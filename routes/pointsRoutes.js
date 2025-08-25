const express = require('express');
const { body } = require('express-validator');
const pointsController = require('../controllers/pointsController');
const { verifyToken, requireBusinessUser, requireCitizenUser } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Validation rules
const issuePointsValidation = [
  body('customerEmail')
    .isEmail()
    .withMessage('Please enter a valid customer email address'),
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
  body('customerEmail')
    .isEmail()
    .withMessage('Please enter a valid customer email address'),
  body('customerUserId')
    .isInt({ min: 1 })
    .withMessage('Customer user ID must be a positive integer'),
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
  body('recipientEmail')
    .isEmail()
    .withMessage('Please enter a valid recipient email address'),
  body('isNewUser')
    .isBoolean()
    .withMessage('isNewUser must be a boolean'),
  body('recipientUserId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Recipient user ID must be a positive integer')
];

const transferToTownTicksValidation = [
  body('businessId')
    .isInt({ min: 1 })
    .withMessage('Business ID must be a positive integer'),
  body('pointsAmount')
    .isFloat({ min: 0 })
    .withMessage('Points amount must be a positive number')
];

const generateQRCodeValidation = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  body('businessId')
    .isInt({ min: 1 })
    .withMessage('Business ID must be a positive integer'),
  body('pointsAmount')
    .isFloat({ min: 0 })
    .withMessage('Points amount must be a positive number')
];

// Routes

// Issue Points (Business to Customer) - Business users only
router.post('/business/:businessId/issue', requireBusinessUser, issuePointsValidation, pointsController.issuePoints);

// Redeem Points (Screen 167 - Business User) - Business users only
router.post('/business/:businessId/redeem', requireBusinessUser, redeemPointsValidation, pointsController.redeemPoints);

// Gift Points (Screen 169 - Citizen User) - Citizen users only
router.post('/gift', requireCitizenUser, giftPointsValidation, pointsController.giftPoints);

// Transfer Points to TownTicks Pool - All authenticated users
router.post('/transfer-to-townticks', transferToTownTicksValidation, pointsController.transferToTownTicks);

// Get User Points Summary - All authenticated users
router.get('/user/points', pointsController.getUserPoints);

// Generate QR Code for Redemption - All authenticated users
router.post('/generate-qr', generateQRCodeValidation, pointsController.generateQRCode);

module.exports = router; 