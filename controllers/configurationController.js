const { validationResult } = require('express-validator');
const PointSchema = require('../models/PointSchema');
const LoyaltyPoints = require('../models/LoyaltyPoints');
const LoyaltyTransaction = require('../models/Transaction');
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
  100: 10,
  500: 50,
  1000: 100,
  5000: 500,
  10000: 1000
};

// Generate unique transaction ID
const generateTransactionId = () => {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Get User Configuration (from JWT token/User table)
const getUserConfiguration = async (req, res) => {
  try {
    const user = req.user; // User data from JWT token includes loyalty configuration

    // Extract loyalty configuration from user
    const userConfig = {
      user_id: user.user_id || user.id,
      email: user.email,
      loyalty_tier_level: user.loyalty_tier_level || 'bronze',
      loyalty_point_multiplier: user.loyalty_point_multiplier || 1.00,
      loyalty_type: user.loyalty_type || 'points',
      loyalty_calculation_type: user.loyalty_calculation_type || 'fixed',
      loyalty_default_points_value: user.loyalty_default_points_value || 1.00,
      loyalty_default_cashback_value: user.loyalty_default_cashback_value || 0.00,
      loyalty_min_redeem_points: user.loyalty_min_redeem_points || 100,
      loyalty_max_redeem_points: user.loyalty_max_redeem_points || 1000,
      loyalty_allow_import_to_tt: user.loyalty_allow_import_to_tt !== false,
      loyalty_allow_export_from_tt: user.loyalty_allow_export_from_tt !== false,
      loyalty_points_vs_dollars: user.loyalty_points_vs_dollars || 'points',
      loyalty_milestone_bonus_points: user.loyalty_milestone_bonus_points || 0.00,
      loyalty_tier_bonus_points: user.loyalty_tier_bonus_points || 0.00,
      loyalty_milestone_thresholds: user.loyalty_milestone_thresholds || DEFAULT_MILESTONE_THRESHOLDS,
      loyalty_tier_bonus_multipliers: user.loyalty_tier_bonus_multipliers || {
        bronze: 1.0,
        silver: 1.2,
        gold: 1.5,
        platinum: 2.0
      },
      loyalty_preferences: user.loyalty_preferences || {}
    };

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
// Note: This should update the User table in parent database
// For now, returns info message that updates should be done via parent DB API
const updateUserConfiguration = async (req, res) => {
  try {
    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'User configuration updated successfully',
      data: {
        note: 'Loyalty configuration fields (loyalty_tier_level, loyalty_type, etc.) are stored in the User table',
        current_config: {
          loyalty_tier_level: req.user.loyalty_tier_level,
          loyalty_type: req.user.loyalty_type,
          loyalty_point_multiplier: req.user.loyalty_point_multiplier
        }
      }
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
    const userId = req.user.user_id || req.user.id;

    const pointSchemas = await PointSchema.findAll({
      where: { user_id: userId, is_active: true },
      order: [['point_type', 'ASC']]
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

    const userId = req.user.user_id || req.user.id;
    const schemaData = { ...req.body, user_id: userId };

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

    const userId = req.user.user_id || req.user.id;
    const schemaId = req.params.schemaId;
    const updateData = req.body;

    const pointSchema = await PointSchema.findOne({
      where: { id: schemaId, user_id: userId }
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
    const userId = req.user.user_id || req.user.id;
    const schemaId = req.params.schemaId;

    const pointSchema = await PointSchema.findOne({
      where: { id: schemaId, user_id: userId }
    });

    if (!pointSchema) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: false,
        status_msg: 'Point schema not found',
        data: undefined
      });
    }

    await pointSchema.update({ is_active: false });

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
    const userId = req.user.user_id || req.user.id;
    const user = req.user;

    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: userId }
    });

    const currentTier = user.loyalty_tier_level || loyaltyPoints?.current_tier || 'bronze';
    const tierConfig = TIER_CONFIG[currentTier];
    const totalPoints = loyaltyPoints ? parseFloat(loyaltyPoints.points_issued || 0) : 0;

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
    const userId = req.user.user_id || req.user.id;
    const user = req.user;

    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: userId }
    });

    if (!loyaltyPoints) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: false,
        status_msg: 'Loyalty points not found',
        data: undefined
      });
    }

    const currentTier = loyaltyPoints.current_tier || 'bronze';
    const totalPoints = parseFloat(loyaltyPoints.points_issued || 0);
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

    const tierBonusPoints = parseFloat(user.loyalty_tier_bonus_points || 0);
    const newMultiplier = nextTierConfig.multiplier;

    // Update loyalty points tier
    await loyaltyPoints.update({
      current_tier: tierConfig.nextTier,
      tier_multiplier: newMultiplier
    });

    // Create tier bonus transaction if bonus points > 0
    if (tierBonusPoints > 0) {
      await LoyaltyTransaction.create({
        transaction_id: generateTransactionId(),
        user_id: userId,
        transaction_type: 'tier_bonus',
        point_type: 'tier',
        points_amount: tierBonusPoints,
        description: `Tier upgrade bonus to ${tierConfig.nextTier}`,
        tier_upgraded: tierConfig.nextTier,
        status: 'completed'
      });

      // Update loyalty points with bonus
      await loyaltyPoints.update({
        points_issued: parseFloat(loyaltyPoints.points_issued) + tierBonusPoints,
        points_available: parseFloat(loyaltyPoints.points_available) + tierBonusPoints,
        last_updated: new Date()
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: `Successfully upgraded to ${tierConfig.nextTier} tier`,
      data: {
        newTier: tierConfig.nextTier,
        newMultiplier: newMultiplier,
        bonusPointsAwarded: tierBonusPoints,
        note: 'User tier in parent database should also be updated via parent DB API'
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
    const user = req.user;

    const settings = {
      allow_import_to_tt: user.loyalty_allow_import_to_tt !== false,
      allow_export_from_tt: user.loyalty_allow_export_from_tt !== false
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
    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Import/Export settings are managed in the parent User table. Please use the parent database API to update these settings.',
      data: {
        note: 'Update loyalty_allow_import_to_tt and loyalty_allow_export_from_tt fields in User table',
        current_settings: {
          allow_import_to_tt: req.user.loyalty_allow_import_to_tt,
          allow_export_from_tt: req.user.loyalty_allow_export_from_tt
        }
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

    const userId = req.user.user_id || req.user.id;
    const user = req.user;
    const { pointsAmount, sourcePool, description } = req.body;

    // Check user configuration
    if (!user.loyalty_allow_import_to_tt) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: false,
        status_msg: 'Import to TownTicks is not allowed for this user',
        data: undefined
      });
    }

    // Create import transaction
    const transaction = await LoyaltyTransaction.create({
      transaction_id: generateTransactionId(),
      user_id: userId,
      transaction_type: 'import',
      point_type: 'regular',
      points_amount: pointsAmount,
      source_pool: sourcePool || 'external',
      destination_pool: 'townTicks',
      description: description || `Points imported to TownTicks from ${sourcePool || 'external'}`,
      status: 'completed'
    });

    // Update loyalty points
    let loyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: userId }
    });

    if (loyaltyPoints) {
      await loyaltyPoints.update({
        points_issued: parseFloat(loyaltyPoints.points_issued) + pointsAmount,
        points_available: parseFloat(loyaltyPoints.points_available) + pointsAmount,
        last_updated: new Date()
      });
    } else {
      loyaltyPoints = await LoyaltyPoints.create({
        user_id: userId,
        points_issued: pointsAmount,
        points_available: pointsAmount,
        last_updated: new Date()
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

    const userId = req.user.user_id || req.user.id;
    const user = req.user;
    const { pointsAmount, destinationPool, description } = req.body;

    // Check user configuration
    if (!user.loyalty_allow_export_from_tt) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: false,
        status_msg: 'Export from TownTicks is not allowed for this user',
        data: undefined
      });
    }

    // Check if user has enough points
    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: userId }
    });

    if (!loyaltyPoints || parseFloat(loyaltyPoints.points_available) < pointsAmount) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Insufficient points available for export',
        data: undefined
      });
    }

    // Create export transaction
    const transaction = await LoyaltyTransaction.create({
      transaction_id: generateTransactionId(),
      user_id: userId,
      transaction_type: 'export',
      point_type: 'regular',
      points_amount: pointsAmount,
      source_pool: 'townTicks',
      destination_pool: destinationPool || 'external',
      description: description || `Points exported from TownTicks to ${destinationPool || 'external'}`,
      status: 'completed'
    });

    // Update loyalty points
    await loyaltyPoints.update({
      points_transferred: parseFloat(loyaltyPoints.points_transferred) + pointsAmount,
      points_available: parseFloat(loyaltyPoints.points_available) - pointsAmount,
      last_updated: new Date()
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
    const userId = req.user.user_id || req.user.id;
    const user = req.user;

    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: userId }
    });

    const totalPoints = loyaltyPoints ? parseFloat(loyaltyPoints.points_issued || 0) : 0;
    const milestoneThresholds = user.loyalty_milestone_thresholds || DEFAULT_MILESTONE_THRESHOLDS;

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
    const userId = req.user.user_id || req.user.id;
    const user = req.user;

    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: userId }
    });

    if (!loyaltyPoints) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: false,
        status_msg: 'Loyalty points not found',
        data: undefined
      });
    }

    const totalPoints = parseFloat(loyaltyPoints.points_issued || 0);
    const milestoneThresholds = user.loyalty_milestone_thresholds || DEFAULT_MILESTONE_THRESHOLDS;
    const milestoneBonusPoints = parseFloat(user.loyalty_milestone_bonus_points || 0);

    const reachedMilestones = [];
    let totalBonusAwarded = 0;

    // Check for new milestones reached
    for (const [threshold, bonusPoints] of Object.entries(milestoneThresholds)) {
      const thresholdNum = parseInt(threshold);
      
      if (totalPoints >= thresholdNum) {
        // Check if this milestone was already awarded
        const existingTransaction = await LoyaltyTransaction.findOne({
          where: {
            user_id: userId,
            transaction_type: 'milestone_bonus',
            milestone_reached: threshold
          }
        });

        if (!existingTransaction) {
          // Award milestone bonus
          const bonusToAward = bonusPoints * milestoneBonusPoints;
          
          await LoyaltyTransaction.create({
            transaction_id: generateTransactionId(),
            user_id: userId,
            transaction_type: 'milestone_bonus',
            point_type: 'milestone',
            points_amount: bonusToAward,
            description: `Milestone bonus for reaching ${threshold} points`,
            milestone_reached: threshold,
            status: 'completed'
          });

          // Update loyalty points
          await loyaltyPoints.update({
            points_issued: parseFloat(loyaltyPoints.points_issued) + bonusToAward,
            points_available: parseFloat(loyaltyPoints.points_available) + bonusToAward,
            last_updated: new Date()
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
        newTotalPoints: parseFloat(loyaltyPoints.points_issued)
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
    const userId = req.user.user_id || req.user.id;
    const user = req.user;

    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: userId }
    });

    const response = {
      loyaltyPoints: loyaltyPoints || {
        user_id: userId,
        points_issued: 0,
        points_redeemed: 0,
        points_transferred: 0,
        points_gifted: 0,
        points_expired: 0,
        points_available: 0,
        cashback_issued: 0,
        cashback_redeemed: 0,
        cashback_available: 0,
        current_tier: 'bronze',
        tier_multiplier: 1.00
      },
      userConfig: {
        tier_level: user.loyalty_tier_level || 'bronze',
        point_multiplier: user.loyalty_point_multiplier || 1.00,
        loyalty_type: user.loyalty_type || 'points',
        points_vs_dollars: user.loyalty_points_vs_dollars || 'points'
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

// Update User Loyalty Points (admin only - direct points manipulation)
const updateUserLoyaltyPoints = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const updateData = req.body;

    let loyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: userId }
    });

    if (loyaltyPoints) {
      await loyaltyPoints.update(updateData);
    } else {
      loyaltyPoints = await LoyaltyPoints.create({
        user_id: userId,
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
