const { Campaign, Segment, CommunicationLog, Customer } = require('../models');
const ApiResponse = require('../utils/response');

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

      // Process campaign immediately (simple approach)
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

  // GET /api/campaigns/:id - Get campaign details
  async getCampaign(req, res) {
    try {
      const campaign = await Campaign.findOne({
        where: { id: req.params.id, userId: req.user.id },
        include: [{
          model: Segment,
          as: 'segment',
          attributes: ['name']
        }]
      });

      if (!campaign) {
        return res.status(404).json(ApiResponse.error('Campaign not found'));
      }

      res.json(ApiResponse.success({ campaign }));
    } catch (error) {
      console.error('Get campaign error:', error);
      res.status(500).json(ApiResponse.error('Failed to fetch campaign'));
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
          const message = `Hi ${customer.name}, here's 10% off on your next order! Use code SAVE10`;
          
          // Create communication log
          await CommunicationLog.create({
            campaignId,
            customerId: customer.id,
            message,
            status: 'PENDING'
          });

          // Simulate vendor API call (90% success rate)
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
    const { Op } = require('sequelize');
    
    const conditions = [];
    
    for (const rule of rules) {
      const condition = this.buildSingleCondition(rule);
      conditions.push(condition);
    }

    const whereCondition = conditions.length === 1 ? conditions[0] : { [Op.and]: conditions };
    
    return await Customer.findAll({
      where: whereCondition,
      attributes: ['id', 'name', 'email']
    });
  }

  // Helper: Build single condition (same as segment controller)
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