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
        // Don't fail the entire request if stats update fails
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
      console.log(`GET /api/data/stats called by user: ${req.user.email}`);
      
      const [totalCustomers, totalOrders, revenueResult] = await Promise.all([
        Customer.count(),
        Order.count(),
        Order.sum('amount')
      ]);

      const totalRevenue = revenueResult || 0;
      const completedOrders = await Order.count({ where: { status: 'completed' } });
      
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const successRate = totalOrders > 0 ? (completedOrders / totalOrders * 100) : 0;

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
      console.log(`Updating customer stats for: ${customerId}`);
      
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        console.log(`Customer not found: ${customerId}`);
        return;
      }

      // FIX: Count ALL orders, not just completed ones for total spent and count
      // But you can still track completion rate separately
      const allOrders = await Order.findAll({
        where: { 
          customerId
        },
        order: [['orderDate', 'DESC']]
      });

      const completedOrders = allOrders.filter(order => order.status === 'completed');
      
      // Calculate stats based on ALL orders (including pending)
      const totalSpent = allOrders.reduce((sum, order) => sum + parseFloat(order.amount), 0);
      const orderCount = allOrders.length;
      const lastOrderDate = allOrders.length > 0 
        ? new Date(Math.max(...allOrders.map(order => new Date(order.orderDate))))
        : null;

      console.log(`Customer ${customerId} stats:`, {
        totalSpent,
        orderCount,
        lastOrderDate,
        completedOrders: completedOrders.length
      });

      await customer.update({
        totalSpent,
        orderCount,
        lastOrderDate
      });

      console.log(`Customer stats updated successfully for ${customerId}`);

    } catch (error) {
      logger.error('Update customer stats error:', error);
      throw error; // Re-throw so calling code knows it failed
    }
  }
}

module.exports = new DataController();