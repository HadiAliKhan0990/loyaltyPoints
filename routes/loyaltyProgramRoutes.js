const express = require('express');
const { body } = require('express-validator');
const loyaltyProgramController = require('../controllers/loyaltyProgramController');
const { verifyToken, requireBusinessUser } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);
router.use(requireBusinessUser);

// Validation rules
const loyaltyProgramValidation = [
  body('useDefaultBilling')
    .optional()
    .isBoolean()
    .withMessage('useDefaultBilling must be a boolean'),
  body('loyaltyType')
    .optional()
    .isIn(['points', 'cashback'])
    .withMessage('loyaltyType must be either points or cashback'),
  body('loyaltyCalculationType')
    .optional()
    .isIn(['fixed', 'percentage'])
    .withMessage('loyaltyCalculationType must be either fixed or percentage'),
  body('defaultPointsValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('defaultPointsValue must be a positive number'),
  body('defaultCashbackValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('defaultCashbackValue must be a positive number'),
  body('redeemType')
    .optional()
    .isIn(['points', 'cashback'])
    .withMessage('redeemType must be either points or cashback'),
  body('minRedeemValue')
    .optional()
    .isInt({ min: 0 })
    .withMessage('minRedeemValue must be a positive integer'),
  body('maxRedeemValue')
    .optional()
    .isInt({ min: 0 })
    .withMessage('maxRedeemValue must be a positive integer'),
  body('currentRedeemValue')
    .optional()
    .isInt({ min: 0 })
    .withMessage('currentRedeemValue must be a positive integer'),
  body('pointToValueRatio')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('pointToValueRatio must be a positive number'),
  body('pointValue1')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('pointValue1 must be a positive number'),
  body('pointValue2')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('pointValue2 must be a positive number'),
  body('cashValue1')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('cashValue1 must be a positive number'),
  body('cashValue2')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('cashValue2 must be a positive number'),
  body('issuePoints')
    .optional()
    .isBoolean()
    .withMessage('issuePoints must be a boolean'),
  body('minIssueValue')
    .optional()
    .isInt({ min: 0 })
    .withMessage('minIssueValue must be a positive integer'),
  body('maxIssueValue')
    .optional()
    .isInt({ min: 0 })
    .withMessage('maxIssueValue must be a positive integer'),
  body('currentIssueValue')
    .optional()
    .isInt({ min: 0 })
    .withMessage('currentIssueValue must be a positive integer'),
  body('enableCashLoyalty')
    .optional()
    .isBoolean()
    .withMessage('enableCashLoyalty must be a boolean'),
  body('enablePointIssuance')
    .optional()
    .isBoolean()
    .withMessage('enablePointIssuance must be a boolean'),
  body('defaultCashValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('defaultCashValue must be a positive number'),
  body('defaultCashAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('defaultCashAmount must be a positive number'),
  body('allowTownTicksImport')
    .optional()
    .isBoolean()
    .withMessage('allowTownTicksImport must be a boolean'),
  body('allowTownTicksExport')
    .optional()
    .isBoolean()
    .withMessage('allowTownTicksExport must be a boolean')
];

const defaultBillingValidation = [
  body('useDefaultBilling')
    .isBoolean()
    .withMessage('useDefaultBilling must be a boolean')
];

const loyaltyTypeValidation = [
  body('loyaltyType')
    .isIn(['points', 'cashback'])
    .withMessage('loyaltyType must be either points or cashback'),
  body('loyaltyCalculationType')
    .isIn(['fixed', 'percentage'])
    .withMessage('loyaltyCalculationType must be either fixed or percentage'),
  body('defaultPointsValue')
    .isFloat({ min: 0 })
    .withMessage('defaultPointsValue must be a positive number'),
  body('defaultCashbackValue')
    .isFloat({ min: 0 })
    .withMessage('defaultCashbackValue must be a positive number')
];

const redeemConfigValidation = [
  body('redeemType')
    .isIn(['points', 'cashback'])
    .withMessage('redeemType must be either points or cashback'),
  body('minRedeemValue')
    .isInt({ min: 0 })
    .withMessage('minRedeemValue must be a positive integer'),
  body('maxRedeemValue')
    .isInt({ min: 0 })
    .withMessage('maxRedeemValue must be a positive integer'),
  body('currentRedeemValue')
    .isInt({ min: 0 })
    .withMessage('currentRedeemValue must be a positive integer'),
  body('pointToValueRatio')
    .isFloat({ min: 0 })
    .withMessage('pointToValueRatio must be a positive number')
];

const pointIssuanceValidation = [
  body('issuePoints')
    .isBoolean()
    .withMessage('issuePoints must be a boolean'),
  body('minIssueValue')
    .isInt({ min: 0 })
    .withMessage('minIssueValue must be a positive integer'),
  body('maxIssueValue')
    .isInt({ min: 0 })
    .withMessage('maxIssueValue must be a positive integer'),
  body('currentIssueValue')
    .isInt({ min: 0 })
    .withMessage('currentIssueValue must be a positive integer')
];

// Routes

// Screen 100 - Default Billing
router.put('/business/:businessId/default-billing', defaultBillingValidation, loyaltyProgramController.updateDefaultBilling);

// Screen 101 - Loyalty Type Configuration
router.put('/business/:businessId/loyalty-type', loyaltyTypeValidation, loyaltyProgramController.updateLoyaltyType);

// Screen 162 - Redeem Configuration
router.put('/business/:businessId/redeem-config', redeemConfigValidation, loyaltyProgramController.updateRedeemConfig);

// Screen 164 - Point Issuance Configuration
router.put('/business/:businessId/point-issuance', pointIssuanceValidation, loyaltyProgramController.updatePointIssuance);

// Complete loyalty program configuration
router.put('/business/:businessId/configure', loyaltyProgramValidation, loyaltyProgramController.configureLoyaltyProgram);

// Get loyalty program configuration
router.get('/business/:businessId', loyaltyProgramController.getLoyaltyProgram);

module.exports = router; 