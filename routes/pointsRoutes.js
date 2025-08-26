const express = require('express');
const { body } = require('express-validator');
const pointsController = require('../controllers/pointsController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Validation rules
const issuePointsValidation = [
  body('customerUserId')
    .isInt({ min: 1 })
    .withMessage('Customer user ID must be a positive integer'),
  body('pointsAmount')
    .isFloat({ min: 0 })
    .withMessage('Points amount must be a positive number'),
  body('cashAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cash amount must be a positive number'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
];

const redeemPointsValidation = [
  body('pointsToRedeem')
    .isFloat({ min: 0 })
    .withMessage('Points to redeem must be a positive number'),
  body('qrCodeData')
    .optional()
    .isString()
    .withMessage('QR code data must be a string')
];

const giftPointsValidation = [
  body('pointsToGift')
    .isFloat({ min: 0 })
    .withMessage('Points to gift must be a positive number'),
  body('recipientUserId')
    .isInt({ min: 1 })
    .withMessage('Recipient user ID must be a positive integer')
];

const generateQRCodeValidation = [
  body('pointsAmount')
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
router.get('/user/points', pointsController.getUserPoints);

// Generate QR Code for Redemption
router.post('/generate-qr', generateQRCodeValidation, pointsController.generateQRCode);

module.exports = router; 