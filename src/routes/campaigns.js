const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { authenticateSession } = require('../middleware/auth');

// Campaign routes 
router.get('/', authenticateSession, campaignController.getCampaigns.bind(campaignController));
router.post('/', authenticateSession, campaignController.createCampaign.bind(campaignController));
router.get('/:id', authenticateSession, campaignController.getCampaign.bind(campaignController));

console.log('Campaign routes registered WITH session authentication');

module.exports = router;