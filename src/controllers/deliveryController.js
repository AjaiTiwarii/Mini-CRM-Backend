const { CommunicationLog } = require('../models');
const ApiResponse = require('../utils/response');

class DeliveryController {
  // POST /api/delivery/receipt - Handle delivery receipt from vendor
  async handleReceipt(req, res) {
    try {
      const { messageId, status, campaignId, customerId, timestamp } = req.body;

      if (!messageId || !status || !campaignId || !customerId) {
        return res.status(400).json(ApiResponse.error('Missing required fields'));
      }

      // Update communication log
      const updateData = {
        status: status.toUpperCase(),
        [status.toLowerCase() === 'sent' ? 'sentAt' : 'failedAt']: new Date(timestamp || Date.now())
      };

      if (status.toLowerCase() === 'failed' && req.body.failureReason) {
        updateData.failureReason = req.body.failureReason;
      }

      await CommunicationLog.update(updateData, {
        where: { campaignId, customerId }
      });

      console.log(`Delivery receipt processed: ${messageId} - ${status}`);
      res.json(ApiResponse.success({ message: 'Receipt processed' }));

    } catch (error) {
      console.error('Handle receipt error:', error);
      res.status(500).json(ApiResponse.error('Failed to process receipt'));
    }
  }
}

module.exports = new DeliveryController();