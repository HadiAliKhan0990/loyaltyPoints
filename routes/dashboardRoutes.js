const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Routes

// Get User Dashboard Analytics
router.get('/user', dashboardController.getUserDashboard);

// Get System-wide Analytics (Admin only)
router.get('/system', dashboardController.getSystemAnalytics);

module.exports = router; 