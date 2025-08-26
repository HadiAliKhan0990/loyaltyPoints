const { validationResult } = require('express-validator');
const UserConfiguration = require('../models/UserConfiguration');
const PointSchema = require('../models/PointSchema');
const LoyaltyPoints = require('../models/LoyaltyPoints');
const Transaction = require('../models/Transaction');
const { HTTP_STATUS_CODE } = require('../utils/httpStatus');

// Tier configuration
const TIER_CONFIG = {
  bronze: { minPoints: 0, multiplier: 1.0, nextTier: 'silver' },
  silver: { minPoints: 1000, multiplier: 1.2, nextTier: 'gold' },
  gold: { minPoints: 5000, multiplier: 1.5, nextTier: 'platinum' },
  platinum: { minPoints: 10000, multiplier: 2.0, nextTier: null }
};

// Default milestone thresholds
const DEFAULT_MILESTONE_THRESHOLDS = {
  100: 10,    // 10 bonus points for 100 points
  500: 50,    // 50 bonus points for 500 points
  1000: 100,  // 100 bonus points for 1000 points
  5000: 500,  // 500 bonus points for 5000 points
  10000: 1000 // 1000 bonus points for 10000 points
};

// Generate unique transaction ID
const generateTransactionId = () => {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Get User Configuration
const getUserConfiguration = async (req, res) => {
  try {
    const userId = req.user.user_id;

    let userConfig = await UserConfiguration.findOne({
      where: { userId }
    });

    if (!userConfig) {
      // Create default configuration
      userConfig = await UserConfiguration.create({
        userId,
        userType: 'citizen',
        tierLevel: 'bronze',
        pointMultiplier: 1.00,
        defaultSettings: true,
        loyaltyType: 'points',
        calculationType: 'fixed',
        defaultPointsValue: 1.00,
        defaultCashbackValue: 0.00,
        minRedeemPoints: 100,
        maxRedeemPoints: 1000,
        allowImportToTT: true,
        allowExportFromTT: true,
        selectedTier: 'bronze',
        pointsVsDollars: 'points',
        milestoneBonusPoints: 0.00,
        tierBonusPoints: 0.00,
        milestoneThresholds: DEFAULT_MILESTONE_THRESHOLDS,
        tierBonusMultipliers: {
          bronze: 1.0,
          silver: 1.2,
          gold: 1.5,
          platinum: 2.0
        },
        isActive: true
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'User configuration retrieved successfully',
      data: userConfig
    });
  } catch (error) {
    console.error('Error getting user configuration:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to get user configuration',
      data: undefined
    });
  }
};

// Update User Configuration
const updateUserConfiguration = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Validation errors',
        data: errors.array()
      });
    }

    const userId = req.user.user_id;
    const updateData = req.body;

    let userConfig = await UserConfiguration.findOne({
      where: { userId }
    });

    if (userConfig) {
      await userConfig.update(updateData);
    } else {
      userConfig = await UserConfiguration.create({
        userId,
        ...updateData
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'User configuration updated successfully',
      data: userConfig
    });
  } catch (error) {
    console.error('Error updating user configuration:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to update user configuration',
      data: undefined
    });
  }
};

// Get Point Schemas
const getPointSchemas = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const pointSchemas = await PointSchema.findAll({
      where: { userId, isActive: true },
      order: [['pointType', 'ASC']]
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Point schemas retrieved successfully',
      data: pointSchemas
    });
  } catch (error) {
    console.error('Error getting point schemas:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to get point schemas',
      data: undefined
    });
  }
};

// Create Point Schema
const createPointSchema = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Validation errors',
        data: errors.array()
      });
    }

    const userId = req.user.user_id;
    const schemaData = { ...req.body, userId };

    const pointSchema = await PointSchema.create(schemaData);

    res.status(HTTP_STATUS_CODE.CREATED).json({
      status: true,
      status_msg: 'Point schema created successfully',
      data: pointSchema
    });
  } catch (error) {
    console.error('Error creating point schema:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to create point schema',
      data: undefined
    });
  }
};

// Update Point Schema
const updatePointSchema = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Validation errors',
        data: errors.array()
      });
    }

    const userId = req.user.user_id;
    const schemaId = req.params.schemaId;
    const updateData = req.body;

    const pointSchema = await PointSchema.findOne({
      where: { id: schemaId, userId }
    });

    if (!pointSchema) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: false,
        status_msg: 'Point schema not found',
        data: undefined
      });
    }

    await pointSchema.update(updateData);

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Point schema updated successfully',
      data: pointSchema
    });
  } catch (error) {
    console.error('Error updating point schema:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to update point schema',
      data: undefined
    });
  }
};

// Delete Point Schema
const deletePointSchema = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const schemaId = req.params.schemaId;

    const pointSchema = await PointSchema.findOne({
      where: { id: schemaId, userId }
    });

    if (!pointSchema) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: false,
        status_msg: 'Point schema not found',
        data: undefined
      });
    }

    await pointSchema.update({ isActive: false });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Point schema deleted successfully',
      data: undefined
    });
  } catch (error) {
    console.error('Error deleting point schema:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to delete point schema',
      data: undefined
    });
  }
};

// Get Tier Information
const getTierInfo = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const userConfig = await UserConfiguration.findOne({
      where: { userId }
    });

    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId }
    });

    const currentTier = userConfig?.tierLevel || 'bronze';
    const tierConfig = TIER_CONFIG[currentTier];
    const totalPoints = loyaltyPoints ? parseFloat(loyaltyPoints.pointsIssued || 0) : 0;

    const tierInfo = {
      currentTier,
      currentMultiplier: tierConfig.multiplier,
      totalPoints,
      nextTier: tierConfig.nextTier,
      pointsToNextTier: tierConfig.nextTier ? 
        Math.max(0, TIER_CONFIG[tierConfig.nextTier].minPoints - totalPoints) : 0,
      tierBenefits: {
        bronze: { multiplier: 1.0, description: 'Basic tier' },
        silver: { multiplier: 1.2, description: '20% bonus points' },
        gold: { multiplier: 1.5, description: '50% bonus points' },
        platinum: { multiplier: 2.0, description: '100% bonus points' }
      }
    };

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Tier information retrieved successfully',
      data: tierInfo
    });
  } catch (error) {
    console.error('Error getting tier info:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to get tier information',
      data: undefined
    });
  }
};

// Upgrade Tier
const upgradeTier = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const userConfig = await UserConfiguration.findOne({
      where: { userId }
    });

    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId }
    });

    if (!userConfig || !loyaltyPoints) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: false,
        status_msg: 'User configuration or loyalty points not found',
        data: undefined
      });
    }

    const currentTier = userConfig.tierLevel;
    const totalPoints = parseFloat(loyaltyPoints.pointsIssued || 0);
    const tierConfig = TIER_CONFIG[currentTier];

    if (!tierConfig.nextTier) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Already at maximum tier',
        data: undefined
      });
    }

    const nextTierConfig = TIER_CONFIG[tierConfig.nextTier];
    if (totalPoints < nextTierConfig.minPoints) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: `Need ${nextTierConfig.minPoints - totalPoints} more points to upgrade to ${tierConfig.nextTier}`,
        data: undefined
      });
    }

    // Calculate tier bonus points
    const tierBonusPoints = parseFloat(userConfig.tierBonusPoints || 0);
    const newMultiplier = nextTierConfig.multiplier;

    // Update tier
    await userConfig.update({ 
      tierLevel: tierConfig.nextTier,
      pointMultiplier: newMultiplier
    });

    await loyaltyPoints.update({
      currentTier: tierConfig.nextTier,
      tierMultiplier: newMultiplier
    });

    // Create tier bonus transaction if bonus points > 0
    if (tierBonusPoints > 0) {
      await Transaction.create({
        transactionId: generateTransactionId(),
        userId,
        transactionType: 'tier_bonus',
        pointType: 'tier',
        pointsAmount: tierBonusPoints,
        description: `Tier upgrade bonus to ${tierConfig.nextTier}`,
        tierUpgraded: tierConfig.nextTier,
        status: 'completed'
      });

      // Update loyalty points with bonus
      await loyaltyPoints.update({
        pointsIssued: parseFloat(loyaltyPoints.pointsIssued) + tierBonusPoints,
        pointsAvailable: parseFloat(loyaltyPoints.pointsAvailable) + tierBonusPoints,
        lastUpdated: new Date()
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: `Successfully upgraded to ${tierConfig.nextTier} tier`,
      data: {
        newTier: tierConfig.nextTier,
        newMultiplier: newMultiplier,
        bonusPointsAwarded: tierBonusPoints
      }
    });
  } catch (error) {
    console.error('Error upgrading tier:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to upgrade tier',
      data: undefined
    });
  }
};

// Get Import/Export Settings
const getImportExportSettings = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const userConfig = await UserConfiguration.findOne({
      where: { userId }
    });

    if (!userConfig) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: false,
        status_msg: 'User configuration not found',
        data: undefined
      });
    }

    const settings = {
      allowImportToTT: userConfig.allowImportToTT,
      allowExportFromTT: userConfig.allowExportFromTT
    };

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Import/Export settings retrieved successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error getting import/export settings:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to get import/export settings',
      data: undefined
    });
  }
};

// Update Import/Export Settings
const updateImportExportSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Validation errors',
        data: errors.array()
      });
    }

    const userId = req.user.user_id;
    const { allowImportToTT, allowExportFromTT } = req.body;

    let userConfig = await UserConfiguration.findOne({
      where: { userId }
    });

    if (!userConfig) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: false,
        status_msg: 'User configuration not found',
        data: undefined
      });
    }

    await userConfig.update({
      allowImportToTT,
      allowExportFromTT
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Import/Export settings updated successfully',
      data: {
        allowImportToTT: userConfig.allowImportToTT,
        allowExportFromTT: userConfig.allowExportFromTT
      }
    });
  } catch (error) {
    console.error('Error updating import/export settings:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to update import/export settings',
      data: undefined
    });
  }
};

// Import to TownTicks
const importToTownTicks = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Validation errors',
        data: errors.array()
      });
    }

    const userId = req.user.user_id;
    const { pointsAmount, sourcePool, description } = req.body;

    // Check user configuration
    const userConfig = await UserConfiguration.findOne({
      where: { userId }
    });

    if (!userConfig || !userConfig.allowImportToTT) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: false,
        status_msg: 'Import to TownTicks is not allowed for this user',
        data: undefined
      });
    }

    // Create import transaction
    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      userId,
      transactionType: 'import',
      pointType: 'regular',
      pointsAmount,
      sourcePool: sourcePool || 'external',
      destinationPool: 'townTicks',
      description: description || `Points imported to TownTicks from ${sourcePool || 'external'}`,
      status: 'completed'
    });

    // Update loyalty points
    let loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId }
    });

    if (loyaltyPoints) {
      await loyaltyPoints.update({
        pointsIssued: parseFloat(loyaltyPoints.pointsIssued) + pointsAmount,
        pointsAvailable: parseFloat(loyaltyPoints.pointsAvailable) + pointsAmount,
        lastUpdated: new Date()
      });
    } else {
      loyaltyPoints = await LoyaltyPoints.create({
        userId,
        pointsIssued: pointsAmount,
        pointsAvailable: pointsAmount,
        lastUpdated: new Date()
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Points imported to TownTicks successfully',
      data: {
        transaction,
        loyaltyPoints,
        pointsImported: pointsAmount
      }
    });
  } catch (error) {
    console.error('Error importing to TownTicks:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to import points to TownTicks',
      data: undefined
    });
  }
};

// Export from TownTicks
const exportFromTownTicks = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Validation errors',
        data: errors.array()
      });
    }

    const userId = req.user.user_id;
    const { pointsAmount, destinationPool, description } = req.body;

    // Check user configuration
    const userConfig = await UserConfiguration.findOne({
      where: { userId }
    });

    if (!userConfig || !userConfig.allowExportFromTT) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: false,
        status_msg: 'Export from TownTicks is not allowed for this user',
        data: undefined
      });
    }

    // Check if user has enough points
    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId }
    });

    if (!loyaltyPoints || parseFloat(loyaltyPoints.pointsAvailable) < pointsAmount) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Insufficient points available for export',
        data: undefined
      });
    }

    // Create export transaction
    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      userId,
      transactionType: 'export',
      pointType: 'regular',
      pointsAmount,
      sourcePool: 'townTicks',
      destinationPool: destinationPool || 'external',
      description: description || `Points exported from TownTicks to ${destinationPool || 'external'}`,
      status: 'completed'
    });

    // Update loyalty points
    await loyaltyPoints.update({
      pointsTransferred: parseFloat(loyaltyPoints.pointsTransferred) + pointsAmount,
      pointsAvailable: parseFloat(loyaltyPoints.pointsAvailable) - pointsAmount,
      lastUpdated: new Date()
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Points exported from TownTicks successfully',
      data: {
        transaction,
        loyaltyPoints,
        pointsExported: pointsAmount
      }
    });
  } catch (error) {
    console.error('Error exporting from TownTicks:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to export points from TownTicks',
      data: undefined
    });
  }
};

// Get Milestones
const getMilestones = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const userConfig = await UserConfiguration.findOne({
      where: { userId }
    });

    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId }
    });

    const totalPoints = loyaltyPoints ? parseFloat(loyaltyPoints.pointsIssued || 0) : 0;
    const milestoneThresholds = userConfig?.milestoneThresholds || DEFAULT_MILESTONE_THRESHOLDS;

    const milestones = Object.keys(milestoneThresholds).map(threshold => {
      const thresholdNum = parseInt(threshold);
      const bonusPoints = milestoneThresholds[threshold];
      const isReached = totalPoints >= thresholdNum;
      
      return {
        threshold: thresholdNum,
        bonusPoints,
        isReached,
        progress: Math.min(100, (totalPoints / thresholdNum) * 100)
      };
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Milestones retrieved successfully',
      data: {
        totalPoints,
        milestones,
        nextMilestone: milestones.find(m => !m.isReached)
      }
    });
  } catch (error) {
    console.error('Error getting milestones:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to get milestones',
      data: undefined
    });
  }
};

// Check Milestones
const checkMilestones = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const userConfig = await UserConfiguration.findOne({
      where: { userId }
    });

    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId }
    });

    if (!userConfig || !loyaltyPoints) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: false,
        status_msg: 'User configuration or loyalty points not found',
        data: undefined
      });
    }

    const totalPoints = parseFloat(loyaltyPoints.pointsIssued || 0);
    const milestoneThresholds = userConfig.milestoneThresholds || DEFAULT_MILESTONE_THRESHOLDS;
    const milestoneBonusPoints = parseFloat(userConfig.milestoneBonusPoints || 0);

    const reachedMilestones = [];
    let totalBonusAwarded = 0;

    // Check for new milestones reached
    for (const [threshold, bonusPoints] of Object.entries(milestoneThresholds)) {
      const thresholdNum = parseInt(threshold);
      
      if (totalPoints >= thresholdNum) {
        // Check if this milestone was already awarded
        const existingTransaction = await Transaction.findOne({
          where: {
            userId,
            transactionType: 'milestone_bonus',
            milestoneReached: threshold
          }
        });

        if (!existingTransaction) {
          // Award milestone bonus
          const bonusToAward = bonusPoints * milestoneBonusPoints;
          
          await Transaction.create({
            transactionId: generateTransactionId(),
            userId,
            transactionType: 'milestone_bonus',
            pointType: 'milestone',
            pointsAmount: bonusToAward,
            description: `Milestone bonus for reaching ${threshold} points`,
            milestoneReached: threshold,
            status: 'completed'
          });

          // Update loyalty points
          await loyaltyPoints.update({
            pointsIssued: parseFloat(loyaltyPoints.pointsIssued) + bonusToAward,
            pointsAvailable: parseFloat(loyaltyPoints.pointsAvailable) + bonusToAward,
            lastUpdated: new Date()
          });

          reachedMilestones.push({
            threshold: thresholdNum,
            bonusAwarded: bonusToAward
          });

          totalBonusAwarded += bonusToAward;
        }
      }
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Milestones checked successfully',
      data: {
        reachedMilestones,
        totalBonusAwarded,
        newTotalPoints: parseFloat(loyaltyPoints.pointsIssued)
      }
    });
  } catch (error) {
    console.error('Error checking milestones:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to check milestones',
      data: undefined
    });
  }
};

// Get User Loyalty Points
const getUserLoyaltyPoints = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId }
    });

    const userConfig = await UserConfiguration.findOne({
      where: { userId }
    });

    const response = {
      loyaltyPoints: loyaltyPoints || {
        userId,
        pointsIssued: 0,
        pointsRedeemed: 0,
        pointsTransferred: 0,
        pointsGifted: 0,
        pointsExpired: 0,
        pointsAvailable: 0,
        cashbackIssued: 0,
        cashbackRedeemed: 0,
        cashbackAvailable: 0,
        currentTier: 'bronze',
        tierMultiplier: 1.00
      },
      userConfig: userConfig || {
        tierLevel: 'bronze',
        pointMultiplier: 1.00,
        loyaltyType: 'points',
        pointsVsDollars: 'points'
      }
    };

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'User loyalty points retrieved successfully',
      data: response
    });
  } catch (error) {
    console.error('Error getting user loyalty points:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to get user loyalty points',
      data: undefined
    });
  }
};

// Update User Loyalty Points
const updateUserLoyaltyPoints = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const updateData = req.body;

    let loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId }
    });

    if (loyaltyPoints) {
      await loyaltyPoints.update(updateData);
    } else {
      loyaltyPoints = await LoyaltyPoints.create({
        userId,
        ...updateData
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'User loyalty points updated successfully',
      data: loyaltyPoints
    });
  } catch (error) {
    console.error('Error updating user loyalty points:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to update user loyalty points',
      data: undefined
    });
  }
};

module.exports = {
  getUserConfiguration,
  updateUserConfiguration,
  getPointSchemas,
  createPointSchema,
  updatePointSchema,
  deletePointSchema,
  getTierInfo,
  upgradeTier,
  getImportExportSettings,
  updateImportExportSettings,
  importToTownTicks,
  exportFromTownTicks,
  getMilestones,
  checkMilestones,
  getUserLoyaltyPoints,
  updateUserLoyaltyPoints
};
