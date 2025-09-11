const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');

// Delivery receipt route (no auth needed - called by external vendor)
router.post('/receipt', deliveryController.handleReceipt.bind(deliveryController));

console.log('Delivery routes registered (no authentication)');

module.exports = router;