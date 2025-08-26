const { DataTypes } = require('sequelize');
const sequelize = require('../connection/db');

const LoyaltyPoints = sequelize.define('Loyalty_Points', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  points_issued: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    field: 'points_issued'
  },
  points_redeemed: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    field: 'points_redeemed'
  },
  points_transferred: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    field: 'points_transferred'
  },
  points_gifted: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    field: 'points_gifted'
  },
  points_expired: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    field: 'points_expired'
  },
  points_available: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    field: 'points_available'
  },
  // Cashback tracking
  cashback_issued: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    field: 'cashback_issued'
  },
  cashback_redeemed: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    field: 'cashback_redeemed'
  },
  cashback_available: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    field: 'cashback_available'
  },
  // Tier tracking
  current_tier: {
    type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
    defaultValue: 'bronze',
    field: 'current_tier'
  },
  tier_points: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    comment: 'Points earned towards next tier',
    field: 'tier_points'
  },
  tier_multiplier: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 1.00,
    field: 'tier_multiplier'
  },
  last_updated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_updated'
  }
}, {
  tableName: 'Loyalty_Points',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = LoyaltyPoints; 