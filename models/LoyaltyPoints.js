const { DataTypes } = require('sequelize');
const sequelize = require('../connection/db');

const LoyaltyPoints = sequelize.define('LoyaltyPoints', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  pointsIssued: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  pointsRedeemed: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  pointsTransferred: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  pointsGifted: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  pointsExpired: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  pointsAvailable: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  // Cashback tracking
  cashbackIssued: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  cashbackRedeemed: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  cashbackAvailable: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  // Tier tracking
  currentTier: {
    type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
    defaultValue: 'bronze'
  },
  tierPoints: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    comment: 'Points earned towards next tier'
  },
  tierMultiplier: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 1.00
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
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

module.exports = LoyaltyPoints; 