const { Segment, Customer } = require('../models');
const { Op } = require('sequelize');
const ApiResponse = require('../utils/response');

class SegmentController {
  // GET /api/segments - List user's segments
  async getSegments(req, res) {
    try {
      const segments = await Segment.findAll({
        where: { userId: req.user.id },
        order: [['created_at', 'DESC']]
      });

      res.json(ApiResponse.success({ segments }));
    } catch (error) {
      console.error('Get segments error:', error);
      res.status(500).json(ApiResponse.error('Failed to fetch segments'));
    }
  }

  // POST /api/segments - Create new segment
  async createSegment(req, res) {
    try {
      const { name, description, rules } = req.body;

      if (!name || !rules || !Array.isArray(rules) || rules.length === 0) {
        return res.status(400).json(ApiResponse.error('Name and rules are required'));
      }

      // Calculate audience size
      const audienceSize = await this.calculateAudienceSize(rules);

      const segment = await Segment.create({
        name,
        description: description || '',
        rules,
        userId: req.user.id,
        audienceSize
      });

      console.log(`Segment created: ${name} (${audienceSize} customers)`);
      res.status(201).json(ApiResponse.success({ segment }));
    } catch (error) {
      console.error('Create segment error:', error);
      res.status(500).json(ApiResponse.error('Failed to create segment'));
    }
  }

  // POST /api/segments/preview - Preview audience size
  async previewAudience(req, res) {
    try {
      const { rules } = req.body;

      if (!rules || !Array.isArray(rules) || rules.length === 0) {
        return res.status(400).json(ApiResponse.error('Rules are required'));
      }

      const audienceSize = await this.calculateAudienceSize(rules);
      res.json(ApiResponse.success({ audienceSize }));
    } catch (error) {
      console.error('Preview audience error:', error);
      res.status(500).json(ApiResponse.error('Failed to calculate audience'));
    }
  }

  // Helper: Calculate audience size from rules
  async calculateAudienceSize(rules) {
    try {
      const whereCondition = this.buildWhereCondition(rules);
      return await Customer.count({ where: whereCondition });
    } catch (error) {
      console.error('Calculate audience error:', error);
      return 0;
    }
  }

  // Helper: Build SQL where condition from rules
  buildWhereCondition(rules) {
    if (!rules.length) return {};

    const conditions = [];
    
    for (const rule of rules) {
      const condition = this.buildSingleCondition(rule);
      conditions.push(condition);
    }

    return conditions.length === 1 ? conditions[0] : { [Op.and]: conditions };
  }

  // Helper: Build single condition
  buildSingleCondition(rule) {
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

module.exports = new SegmentController();