const { Campaign, Segment, CommunicationLog, Customer } = require('../models');
const ApiResponse = require('../utils/response');
const aiService = require('../services/aiService');

class CampaignController {
  // GET /api/campaigns - List user's campaigns
  async getCampaigns(req, res) {
    try {
      const campaigns = await Campaign.findAll({
        where: { userId: req.user.id },
        order: [['created_at', 'DESC']],
        include: [{
          model: Segment,
          as: 'segment',
          attributes: ['name']
        }]
      });

      res.json(ApiResponse.success({ campaigns }));
    } catch (error) {
      console.error('Get campaigns error:', error);
      res.status(500).json(ApiResponse.error('Failed to fetch campaigns'));
    }
  }

  // POST /api/campaigns - Create and launch campaign
  async createCampaign(req, res) {
    try {
      const { segmentId, name } = req.body;

      if (!segmentId || !name) {
        return res.status(400).json(ApiResponse.error('Segment ID and name are required'));
      }

      // Get segment
      const segment = await Segment.findOne({
        where: { id: segmentId, userId: req.user.id }
      });

      if (!segment) {
        return res.status(404).json(ApiResponse.error('Segment not found'));
      }

      if (segment.audienceSize === 0) {
        return res.status(400).json(ApiResponse.error('Cannot create campaign for empty segment'));
      }

      // Create campaign
      const campaign = await Campaign.create({
        userId: req.user.id,
        segmentId,
        name,
        audienceSize: segment.audienceSize
      });

      // Process campaign immediately
      await this.processCampaign(campaign.id, segment);

      const updatedCampaign = await Campaign.findByPk(campaign.id, {
        include: [{
          model: Segment,
          as: 'segment',
          attributes: ['name']
        }]
      });

      console.log(`Campaign created and processed: ${name}`);
      res.status(201).json(ApiResponse.success({ campaign: updatedCampaign }));
    } catch (error) {
      console.error('Create campaign error:', error);
      res.status(500).json(ApiResponse.error('Failed to create campaign'));
    }
  }

  // GET /api/campaigns/:id - Get campaign details with AI insights
  async getCampaign(req, res) {
    try {
      const campaign = await Campaign.findOne({
        where: { id: req.params.id, userId: req.user.id },
        include: [{
          model: Segment,
          as: 'segment',
          attributes: ['name', 'rules']
        }]
      });

      if (!campaign) {
        return res.status(404).json(ApiResponse.error('Campaign not found'));
      }

      // Generate AI insights if campaign is completed
      let aiInsights = null;
      if (campaign.status === 'COMPLETED') {
        try {
          // Get delivery stats by customer segments
          const deliveryStats = await this.getDeliveryStatsBySegment(campaign.id, campaign.segment.rules);
          
          const campaignData = {
            name: campaign.name,
            audienceSize: campaign.audienceSize,
            sentCount: campaign.sentCount,
            failedCount: campaign.failedCount,
            segmentRules: campaign.segment.rules,
            deliveryStats
          };

          aiInsights = await aiService.generateCampaignInsights(campaignData);
          console.log(`AI insights generated for campaign: ${campaign.id}`);
        } catch (error) {
          console.error('Failed to generate AI insights:', error);
        }
      }

      res.json(ApiResponse.success({ 
        campaign,
        aiInsights 
      }));
    } catch (error) {
      console.error('Get campaign error:', error);
      res.status(500).json(ApiResponse.error('Failed to fetch campaign'));
    }
  }

  // Get AI insights for a campaign
  async getCampaignInsights(req, res) {
    try {
      const campaign = await Campaign.findOne({
        where: { id: req.params.id, userId: req.user.id },
        include: [{
          model: Segment,
          as: 'segment',
          attributes: ['name', 'rules']
        }]
      });

      if (!campaign) {
        return res.status(404).json(ApiResponse.error('Campaign not found'));
      }

      if (campaign.status !== 'COMPLETED') {
        return res.status(400).json(ApiResponse.error('Campaign insights only available for completed campaigns'));
      }

      // Get delivery stats by customer segments
      const deliveryStats = await this.getDeliveryStatsBySegment(campaign.id, campaign.segment.rules);
      
      const campaignData = {
        name: campaign.name,
        audienceSize: campaign.audienceSize,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount,
        segmentRules: campaign.segment.rules,
        deliveryStats
      };

      const aiInsights = await aiService.generateCampaignInsights(campaignData);

      res.json(ApiResponse.success({ 
        insights: aiInsights,
        generatedAt: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Get campaign insights error:', error);
      res.status(500).json(ApiResponse.error('Failed to generate campaign insights'));
    }
  }

  // Helper: Get delivery statistics segmented by customer characteristics
  async getDeliveryStatsBySegment(campaignId, segmentRules) {
    try {
      const logs = await CommunicationLog.findAll({
        where: { campaignId },
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['totalSpent', 'orderCount']
        }]
      });

      const stats = [];

      // High value customers (>₹10K)
      const highValueCustomers = logs.filter(log => log.customer.totalSpent > 10000);
      if (highValueCustomers.length > 0) {
        const delivered = highValueCustomers.filter(log => log.status === 'SENT').length;
        const rate = ((delivered / highValueCustomers.length) * 100).toFixed(1);
        stats.push({
          description: 'Customers with >₹10K spending',
          count: highValueCustomers.length,
          rate: rate
        });
      }

      // Frequent buyers (>3 orders)
      const frequentBuyers = logs.filter(log => log.customer.orderCount > 3);
      if (frequentBuyers.length > 0) {
        const delivered = frequentBuyers.filter(log => log.status === 'SENT').length;
        const rate = ((delivered / frequentBuyers.length) * 100).toFixed(1);
        stats.push({
          description: 'Customers with >3 orders',
          count: frequentBuyers.length,
          rate: rate
        });
      }

      return stats;
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      return [];
    }
  }

  // Helper: Process campaign (send messages)
  async processCampaign(campaignId, segment) {
    try {
      // Update campaign status
      await Campaign.update({ status: 'RUNNING' }, { where: { id: campaignId } });

      // Get customers for segment
      const customers = await this.getCustomersForSegment(segment.rules);
      
      let sentCount = 0, failedCount = 0;

      // Send messages to each customer
      for (const customer of customers) {
        try {
          const message = `Hi ${customer.name}, this is an example message`;
          
          // Create communication log
          await CommunicationLog.create({
            campaignId,
            customerId: customer.id,
            message,
            status: 'PENDING'
          });

          // Simulate vendor API call (taking 90% success rate)
          const isSuccess = Math.random() < 0.9;
          
          if (isSuccess) {
            await CommunicationLog.update(
              { status: 'SENT', sentAt: new Date() },
              { where: { campaignId, customerId: customer.id } }
            );
            sentCount++;
          } else {
            await CommunicationLog.update(
              { 
                status: 'FAILED', 
                failedAt: new Date(),
                failureReason: 'Delivery failed'
              },
              { where: { campaignId, customerId: customer.id } }
            );
            failedCount++;
          }

          // Small delay to simulate real API
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          failedCount++;
          console.error(`Failed to send message to ${customer.email}:`, error);
        }
      }

      // Update campaign with final counts
      await Campaign.update({
        status: 'COMPLETED',
        sentCount,
        failedCount
      }, { where: { id: campaignId } });

      console.log(`Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed`);

    } catch (error) {
      await Campaign.update({ status: 'FAILED' }, { where: { id: campaignId } });
      console.error('Process campaign error:', error);
    }
  }

  // Helper: Get customers matching segment rules
  async getCustomersForSegment(rules) {
    if (!rules.length) return {};

    const { Op } = require('sequelize');

    let condition = this.buildSingleCondition(rules[0]);

    for (let i = 1; i < rules.length; i++) {
      const rule = rules[i];
      const op = rule.logicalOperator === 'OR' ? Op.or : Op.and;
      const nextCond = this.buildSingleCondition(rule);

      condition = { [op]: [condition, nextCond] };
    }
    
    return await Customer.findAll({
      where: condition,
      attributes: ['id', 'name', 'email']
    });
  }

  // Helper: Build single condition
  buildSingleCondition(rule) {
    const { Op } = require('sequelize');
    const { field, operator, value } = rule;
    
    const opMap = {
      'gt': Op.gt, 'gte': Op.gte, 'lt': Op.lt, 
      'lte': Op.lte, 'eq': Op.eq, 'neq': Op.ne
    };

    switch (field) {
      case 'totalSpent':
        return { total_spent: { [opMap[operator]]: parseFloat(value) } };
      case 'orderCount':
        return { order_count: { [opMap[operator]]: parseInt(value) } };
      case 'lastOrderDate':
        return { last_order_date: { [opMap[operator]]: new Date(value) } };
      case 'daysInactive':
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(value));
        return { last_order_date: { [Op.lt]: daysAgo } };
      default:
        throw new Error(`Unsupported field: ${field}`);
    }
  }
}

module.exports = new CampaignController();