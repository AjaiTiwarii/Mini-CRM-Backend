const express = require('express');
const router = express.Router();
const segmentController = require('../controllers/segmentController');
const { authenticateSession } = require('../middleware/auth');

// Segment routes (using session auth like data routes)
router.get('/', authenticateSession, segmentController.getSegments.bind(segmentController));
router.post('/', authenticateSession, segmentController.createSegment.bind(segmentController));
router.post('/preview', authenticateSession, segmentController.previewAudience.bind(segmentController));

console.log('Segment routes registered WITH session authentication');

module.exports = router;