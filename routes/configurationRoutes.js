const express = require('express');
const { body } = require('express-validator');
const configurationController = require('../controllers/configurationController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Validation rules
const userConfigurationValidation = [
  body('userType')
    .optional()
    .isIn(['citizen', 'business'])
    .withMessage('User type must be either citizen or business'),
  body('tierLevel')
    .optional()
    .isIn(['bronze', 'silver', 'gold', 'platinum'])
    .withMessage('Tier level must be bronze, silver, gold, or platinum'),
  body('pointMultiplier')
    .optional()
    .isFloat({ min: 0.1, max: 10 })
    .withMessage('Point multiplier must be between 0.1 and 10'),
  body('defaultSettings')
    .optional()
    .isBoolean()
    .withMessage('Default settings must be a boolean'),
  body('loyaltyType')
    .optional()
    .isIn(['points', 'cashback', 'both'])
    .withMessage('Loyalty type must be points, cashback, or both'),
  body('calculationType')
    .optional()
    .isIn(['fixed', 'percentage'])
    .withMessage('Calculation type must be fixed or percentage'),
  body('defaultPointsValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Default points value must be a positive number'),
  body('defaultCashbackValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Default cashback value must be a positive number'),
  body('minRedeemPoints')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum redeem points must be a positive integer'),
  body('maxRedeemPoints')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum redeem points must be a positive integer'),
  // Import/Export Settings
  body('allowImportToTT')
    .optional()
    .isBoolean()
    .withMessage('Allow import to TT must be a boolean'),
  body('allowExportFromTT')
    .optional()
    .isBoolean()
    .withMessage('Allow export from TT must be a boolean'),
  // Tier Selection and Bonus Settings
  body('selectedTier')
    .optional()
    .isIn(['bronze', 'silver', 'gold', 'platinum'])
    .withMessage('Selected tier must be bronze, silver, gold, or platinum'),
  body('pointsVsDollars')
    .optional()
    .isIn(['points', 'dollars', 'both'])
    .withMessage('Points vs dollars must be points, dollars, or both'),
  body('milestoneBonusPoints')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Milestone bonus points must be a positive number'),
  body('tierBonusPoints')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tier bonus points must be a positive number'),
  body('milestoneThresholds')
    .optional()
    .isObject()
    .withMessage('Milestone thresholds must be an object'),
  body('tierBonusMultipliers')
    .optional()
    .isObject()
    .withMessage('Tier bonus multipliers must be an object'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean')
];

const pointSchemaValidation = [
  body('pointType')
    .isIn(['regular', 'bonus', 'special', 'welcome', 'referral', 'milestone', 'tier'])
    .withMessage('Point type must be regular, bonus, special, welcome, referral, milestone, or tier'),
  body('pointBonus')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Point bonus must be a positive number'),
  body('tierMultiplier')
    .optional()
    .isFloat({ min: 0.1, max: 10 })
    .withMessage('Tier multiplier must be between 0.1 and 10'),
  body('basePoints')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base points must be a positive number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
];

const importExportValidation = [
  body('pointsAmount')
    .isFloat({ min: 0 })
    .withMessage('Points amount must be a positive number'),
  body('sourcePool')
    .optional()
    .isString()
    .withMessage('Source pool must be a string'),
  body('destinationPool')
    .optional()
    .isString()
    .withMessage('Destination pool must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
];

// Routes

// User Configuration
router.get('/user', configurationController.getUserConfiguration);
router.put('/user', userConfigurationValidation, configurationController.updateUserConfiguration);

// Point Schema
router.get('/point-schema', configurationController.getPointSchemas);
router.post('/point-schema', pointSchemaValidation, configurationController.createPointSchema);
router.put('/point-schema/:schemaId', pointSchemaValidation, configurationController.updatePointSchema);
router.delete('/point-schema/:schemaId', configurationController.deletePointSchema);

// Tier Management
router.get('/tier-info', configurationController.getTierInfo);
router.post('/upgrade-tier', configurationController.upgradeTier);

// Import/Export Settings
router.get('/import-export-settings', configurationController.getImportExportSettings);
router.put('/import-export-settings', configurationController.updateImportExportSettings);

// Import/Export Operations
router.post('/import-to-tt', importExportValidation, configurationController.importToTownTicks);
router.post('/export-from-tt', importExportValidation, configurationController.exportFromTownTicks);

// Milestone Management
router.get('/milestones', configurationController.getMilestones);
router.post('/check-milestones', configurationController.checkMilestones);

// User Loyalty Points Management
router.get('/user-loyalty-points', configurationController.getUserLoyaltyPoints);
router.put('/user-loyalty-points', configurationController.updateUserLoyaltyPoints);

module.exports = router;
