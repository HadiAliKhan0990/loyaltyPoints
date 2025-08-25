const express = require('express');
const router = express.Router();

// Import all loyalty points routes
const authRoutes = require('./authRoutes');
const loyaltyProgramRoutes = require('./loyaltyProgramRoutes');
const pointsRoutes = require('./pointsRoutes');
const dashboardRoutes = require('./dashboardRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/loyalty-program', loyaltyProgramRoutes);
router.use('/points', pointsRoutes);
router.use('/dashboard', dashboardRoutes);

// Test route to check if API is working
router.get('/test', (req, res) => {
  res.status(200).json({ 
    status: true, 
    status_msg: 'Loyalty Points API is working!',
    data: {
      message: 'Welcome to the Loyalty Points System API',
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router; 