const jwt = require('jsonwebtoken');
const passport = require('passport');
const { User } = require('../models');
const ApiResponse = require('../utils/response');

// Passport session authentication middleware
const authenticateSession = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json(
    ApiResponse.unauthorized('Please log in to continue')
  );
};

module.exports = {
  authenticateSession
};