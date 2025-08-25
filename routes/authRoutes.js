const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyToken, requireBusinessUser } = require('../middlewares/authMiddleware');

const router = express.Router();

// Validation rules
const businessProfileValidation = [
  body('businessName')
    .notEmpty()
    .withMessage('Business name is required'),
  body('businessType')
    .optional()
    .isString()
    .withMessage('Business type must be a string'),
  body('address')
    .optional()
    .isString()
    .withMessage('Address must be a string'),
  body('city')
    .optional()
    .isString()
    .withMessage('City must be a string'),
  body('state')
    .optional()
    .isString()
    .withMessage('State must be a string'),
  body('zipCode')
    .optional()
    .isString()
    .withMessage('Zip code must be a string'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please enter a valid website URL'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
];

// Routes
router.get('/profile', verifyToken, authController.getProfile);
router.post('/business-profile', verifyToken, requireBusinessUser, businessProfileValidation, authController.createBusinessProfile);
router.put('/business-profile', verifyToken, requireBusinessUser, businessProfileValidation, authController.updateBusinessProfile);

module.exports = router; 