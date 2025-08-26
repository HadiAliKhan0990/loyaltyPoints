const express = require('express');
const { body } = require('express-validator');
const pointsController = require('../controllers/pointsController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

/**
 * NOTE: All fields use snake_case naming convention
 * Database tables: Loyalty_Points, Loyalty_Transaction, Point_Schema
 */

// Validation rules
const issuePointsValidation = [
  body('customer_user_id')
    .isInt({ min: 1 })
    .withMessage('Customer user ID must be a positive integer'),
  body('points_amount')
    .isFloat({ min: 0 })
    .withMessage('Points amount must be a positive number'),
  body('cash_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cash amount must be a positive number'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
];

const redeemPointsValidation = [
  body('points_to_redeem')
    .isFloat({ min: 0 })
    .withMessage('Points to redeem must be a positive number'),
  body('qr_code_data')
    .optional()
    .isString()
    .withMessage('QR code data must be a string')
];

const giftPointsValidation = [
  body('points_to_gift')
    .isFloat({ min: 0 })
    .withMessage('Points to gift must be a positive number'),
  body('recipient_user_id')
    .isInt({ min: 1 })
    .withMessage('Recipient user ID must be a positive integer')
];

const generateQRCodeValidation = [
  body('points_amount')
    .isFloat({ min: 0 })
    .withMessage('Points amount must be a positive number')
];

// Routes

// Issue Points (Business user to Customer)
router.post('/issue', issuePointsValidation, pointsController.issuePoints);

// Redeem Points
router.post('/redeem', redeemPointsValidation, pointsController.redeemPoints);

// Gift Points (TownTicks platform only)
router.post('/gift', giftPointsValidation, pointsController.giftPoints);

// Get User Points Summary
router.get('/user/points/:userId', pointsController.getUserPoints);

// Generate QR Code for Redemption
router.post('/generate-qr', generateQRCodeValidation, pointsController.generateQRCode);

module.exports = router; 