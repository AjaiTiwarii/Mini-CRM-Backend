const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// Use SESSION-based authentication (works with Google OAuth)
const { authenticateSession } = require('../middleware/auth');

// Customer routes (with session authentication) - FIX: Bind methods to preserve 'this' context
router.get('/customers', authenticateSession, dataController.getCustomers.bind(dataController));
router.post('/customers', authenticateSession, dataController.createCustomer.bind(dataController));

// Order routes (with session authentication) - FIX: Bind methods to preserve 'this' context  
router.get('/orders', authenticateSession, dataController.getOrders.bind(dataController));
router.post('/orders', authenticateSession, dataController.createOrder.bind(dataController));

// Stats route (with session authentication) - FIX: Bind methods to preserve 'this' context
router.get('/stats', authenticateSession, dataController.getStats.bind(dataController));

console.log('📊 Data routes registered WITH session-based authentication');

module.exports = router;