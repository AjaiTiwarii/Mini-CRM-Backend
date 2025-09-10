const Joi = require('joi');
const ApiResponse = require('../utils/response');

// Generic validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json(
        ApiResponse.validationError(errors)
      );
    }
    
    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // Customer validation
  customer: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().optional(),
    totalSpent: Joi.number().min(0).optional(),
    orderCount: Joi.number().integer().min(0).optional(),
    lastOrderDate: Joi.date().optional()
  }),

  // Order validation
  order: Joi.object({
    customerId: Joi.string().uuid().optional(),
    customerEmail: Joi.string().email().optional(),
    amount: Joi.number().min(0).required(),
    status: Joi.string().valid('pending', 'completed', 'cancelled').optional(),
    orderDate: Joi.date().optional()
  }),

  // Segment validation
  segment: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    rules: Joi.array().items(
      Joi.object({
        field: Joi.string().valid('totalSpent', 'orderCount', 'lastOrderDate', 'daysInactive').required(),
        operator: Joi.string().valid('gt', 'gte', 'lt', 'lte', 'eq', 'neq').required(),
        value: Joi.alternatives().try(Joi.number(), Joi.string(), Joi.date()).required(),
        logicalOperator: Joi.string().valid('AND', 'OR').optional()
      })
    ).min(1).required()
  }),

  // Campaign validation
  campaign: Joi.object({
    segmentId: Joi.string().uuid().required(),
    name: Joi.string().min(2).max(100).required()
  }),

  // AI prompt validation
  aiPrompt: Joi.object({
    prompt: Joi.string().min(5).max(500).required()
  })
};

// Specific validation middleware for each endpoint
const validateCustomer = validate(schemas.customer);
const validateOrder = validate(schemas.order);
const validateSegment = validate(schemas.segment);
const validateCampaign = validate(schemas.campaign);
const validateAIPrompt = validate(schemas.aiPrompt);

module.exports = {
  validate,
  validateCustomer,
  validateOrder,
  validateSegment,
  validateCampaign,
  validateAIPrompt,
  schemas
};