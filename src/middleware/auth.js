const jwt = require('jsonwebtoken');
const passport = require('passport');
const { User } = require('../models');
const ApiResponse = require('../utils/response');

// JWT Authentication middleware
const authenticateJWT = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    const token = req.headers.authorization?.split(' ')[1] || 
                 req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json(
        ApiResponse.unauthorized('Access token required')
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json(
        ApiResponse.unauthorized('Invalid token')
      );
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(
        ApiResponse.unauthorized('Invalid token')
      );
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(
        ApiResponse.unauthorized('Token expired')
      );
    }

    return res.status(500).json(
      ApiResponse.error('Authentication error', 500)
    );
  }
};

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
  authenticateJWT,
  authenticateSession
};