const { Customer, Order } = require('../models');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

class DataController {
  // GET /api/data/customers - List customers
  async getCustomers(req, res) {
    try {
      console.log(`GET /api/data/customers called by user: ${req.user.email}`);
      
      const customers = await Customer.findAll({
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      res.json(ApiResponse.success({ 
        customers,
        total: customers.length 
      }, 'Customers retrieved successfully'));

    } catch (error) {
      logger.error('Get customers error:', error);
      res.status(500).json(
        ApiResponse.error('Failed to fetch customers', 500)
      );
    }
  }

  // POST /api/data/customers - Create customer
  async createCustomer(req, res) {
    try {
      console.log(`POST /api/data/customers called by user: ${req.user.email}`, req.body);
      
      const { email, name, phone } = req.body;
      
      // Basic validation
      if (!email || !name) {
        return res.status(400).json(
          ApiResponse.error('Email and name are required', 400)
        );
      }

      // Check if customer exists
      const existingCustomer = await Customer.findOne({
        where: { email }
      });

      if (existingCustomer) {
        return res.status(409).json(
          ApiResponse.error('Customer with this email already exists', 409)
        );
      }

      // Create customer
      const customer = await Customer.create({
        email,
        name,
        phone: phone || null
      });

      logger.info(`Customer created by ${req.user.email}: ${customer.email}`);

      res.status(201).json(ApiResponse.success({
        customer
      }, 'Customer created successfully'));

    } catch (error) {
      logger.error('Create customer error:', error);
      res.status(500).json(
        ApiResponse.error('Failed to create customer', 500)
      );
    }
  }

  // GET /api/data/orders - List orders
  async getOrders(req, res) {
    try {
      console.log(`GET /api/data/orders called by user: ${req.user.email}`);
      
      const orders = await Order.findAll({
        order: [['orderDate', 'DESC']],
        limit: 50,
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.json(ApiResponse.success({ 
        orders,
        total: orders.length 
      }, 'Orders retrieved successfully'));

    } catch (error) {
      logger.error('Get orders error:', error);
      res.status(500).json(
        ApiResponse.error('Failed to fetch orders', 500)
      );
    }
  }

  // POST /api/data/orders - Create order
  async createOrder(req, res) {
    try {
      console.log(`POST /api/data/orders called by user: ${req.user.email}`, req.body);
      
      const { customerId, customerEmail, amount, status = 'completed' } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json(
          ApiResponse.error('Valid amount is required', 400)
        );
      }

      let targetCustomerId = customerId;

      // Find customer by email if customerId not provided
      if (!targetCustomerId && customerEmail) {
        const customer = await Customer.findOne({
          where: { email: customerEmail }
        });
        
        if (!customer) {
          return res.status(404).json(
            ApiResponse.error('Customer not found', 404)
          );
        }
        
        targetCustomerId = customer.id;
      }

      if (!targetCustomerId) {
        return res.status(400).json(
          ApiResponse.error('Either customerId or customerEmail must be provided', 400)
        );
      }

      // Create order
      const order = await Order.create({
        customerId: targetCustomerId,
        amount: parseFloat(amount),
        status,
        orderDate: new Date()
      });

      // Update customer stats - FIX: Call the method correctly
      try {
        await this.updateCustomerStats(targetCustomerId);
        console.log(`Customer stats updated for ${targetCustomerId}`);
      } catch (statsError) {
        console.error(`Failed to update customer stats for ${targetCustomerId}:`, statsError);
      }

      logger.info(`Order created by ${req.user.email}: ${order.id} for customer ${targetCustomerId}`);

      // Return order with customer info
      const orderWithCustomer = await Order.findByPk(order.id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.status(201).json(ApiResponse.success({
        order: orderWithCustomer
      }, 'Order created successfully'));

    } catch (error) {
      logger.error('Create order error:', error);
      res.status(500).json(
        ApiResponse.error('Failed to create order', 500)
      );
    }
  }

  // GET /api/data/stats - Dashboard statistics
  async getStats(req, res) {
    try {
      logger.info(`GET /api/data/stats called by user: ${req.user.email}`);

      // Fetch counts in parallel
      const [totalCustomers, completedOrders, pendingOrders, cancelledOrders, revenueResult] = await Promise.all([
        Customer.count(),
        Order.count({ where: { status: 'completed' } }),
        Order.count({ where: { status: 'pending' } }),
        Order.count({ where: { status: 'cancelled' } }),
        Order.sum('amount', { where: { status: 'completed' } })
      ]);

      const totalRevenue = revenueResult || 0;
      const totalOrders = completedOrders + pendingOrders; 
      const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
      const totalAttemptedOrders = completedOrders + pendingOrders + cancelledOrders;
      const successRate = totalAttemptedOrders > 0 
        ? (completedOrders / totalAttemptedOrders) * 100 
        : 0;

      // Recent data
      const [recentCustomers, recentOrders] = await Promise.all([
        Customer.findAll({
          order: [['createdAt', 'DESC']],
          limit: 5
        }),
        Order.findAll({
          order: [['orderDate', 'DESC']],
          limit: 5,
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: ['id', 'name', 'email']
            }
          ]
        })
      ]);

      res.json(ApiResponse.success({
        totalCustomers,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        recentCustomers,
        recentOrders
      }, 'Statistics retrieved successfully'));

    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json(
        ApiResponse.error('Failed to fetch statistics', 500)
      );
    }
  }


  // Helper method to update customer statistics
  async updateCustomerStats(customerId) {
    try {
      logger.info(`Updating stats for customerId: ${customerId}`);

      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        logger.warn(`Customer with id ${customerId} not found`);
        return;
      }

      const orders = await Order.findAll({ where: { customerId } });
      logger.info(`Found ${orders.length} orders for customerId: ${customerId}`);

      let totalSpent = 0;
      let orderCount = 0;

      for (const order of orders) {
        switch (order.status) {
          case 'completed':
            totalSpent += parseFloat(order.amount);
            orderCount += 1;
            break;

          case 'pending':
            orderCount += 1;
            break;

          case 'cancelled':
            break;

          default:
            logger.debug(`Skipping order ${order.id} with status: ${order.status}`);
            break;
        }
      }

      const lastOrderDate = orders.length > 0 
        ? new Date(Math.max(...orders.map(o => new Date(o.orderDate))))
        : null;

      await customer.update({
        totalSpent,
        orderCount,
        lastOrderDate
      });

      logger.info(`Customer stats updated successfully for customerId: ${customerId}`, {
        totalSpent,
        orderCount,
        lastOrderDate
      });

    } catch (error) {
      logger.error(`Error updating stats for customerId: ${customerId}`, error);
      throw error; 
    }
  }


}

module.exports = new DataController();