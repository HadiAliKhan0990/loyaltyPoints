const { DataTypes } = require('sequelize');
const sequelize = require('../connection/db');

const UserConfiguration = sequelize.define('UserConfiguration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'User ID from parent database'
  },
  userType: {
    type: DataTypes.ENUM('citizen', 'business'),
    allowNull: false,
    defaultValue: 'citizen'
  },
  tierLevel: {
    type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
    defaultValue: 'bronze'
  },
  pointMultiplier: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 1.00
  },
  defaultSettings: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  loyaltyType: {
    type: DataTypes.ENUM('points', 'cashback', 'both'),
    defaultValue: 'points'
  },
  calculationType: {
    type: DataTypes.ENUM('fixed', 'percentage'),
    defaultValue: 'fixed'
  },
  defaultPointsValue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1.00
  },
  defaultCashbackValue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  minRedeemPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  maxRedeemPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  },
  // Import/Export Settings
  allowImportToTT: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Allow importing points to TownTicks pool'
  },
  allowExportFromTT: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Allow exporting points from TownTicks pool'
  },
  // Tier Selection and Bonus Settings
  selectedTier: {
    type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
    defaultValue: 'bronze',
    comment: 'User selected tier'
  },
  pointsVsDollars: {
    type: DataTypes.ENUM('points', 'dollars', 'both'),
    defaultValue: 'points',
    comment: 'Preference for points vs dollars'
  },
  // Bonus Points Configuration
  milestoneBonusPoints: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Bonus points for reaching milestones'
  },
  tierBonusPoints: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Bonus points for tier upgrades'
  },
  milestoneThresholds: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Milestone thresholds for bonus points'
  },
  tierBonusMultipliers: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Bonus multipliers for each tier'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  preferences: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional user preferences'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = UserConfiguration;
