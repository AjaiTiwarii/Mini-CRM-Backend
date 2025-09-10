const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Google OAuth routes
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

// User session routes
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);

module.exports = router;