const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, requireBusinessUser, requireCitizenUser, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Routes

// Get Business Dashboard Analytics (Screen 166) - Business users only
router.get('/business/:businessId', requireBusinessUser, dashboardController.getBusinessDashboard);

// Get Customer Dashboard Analytics - Citizen users only
router.get('/customer', requireCitizenUser, dashboardController.getCustomerDashboard);

// Get System-wide Analytics (Admin/Platform level) - Admin users only
router.get('/system', requireAdmin, dashboardController.getSystemAnalytics);

module.exports = router; 