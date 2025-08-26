const { DataTypes } = require('sequelize');
const sequelize = require('../connection/db');

const LoyaltyTransaction = sequelize.define('Loyalty_Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'transaction_id'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  transaction_type: {
    type: DataTypes.ENUM('issue', 'redeem', 'gift', 'transfer', 'import', 'export', 'expire', 'cashback_issue', 'cashback_redeem', 'milestone_bonus', 'tier_bonus'),
    allowNull: false,
    field: 'transaction_type'
  },
  point_type: {
    type: DataTypes.ENUM('regular', 'bonus', 'special', 'welcome', 'referral', 'milestone', 'tier'),
    defaultValue: 'regular',
    field: 'point_type'
  },
  points_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'points_amount'
  },
  cash_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'cash_amount'
  },
  cashback_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'cashback_amount'
  },
  tier_multiplier: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 1.00,
    field: 'tier_multiplier'
  },
  bonus_points: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    field: 'bonus_points'
  },
  // Import/Export specific fields
  source_pool: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Source pool for import/export transactions',
    field: 'source_pool'
  },
  destination_pool: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Destination pool for import/export transactions',
    field: 'destination_pool'
  },
  // Milestone tracking
  milestone_reached: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Milestone that was reached',
    field: 'milestone_reached'
  },
  tier_upgraded: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Tier that was upgraded to',
    field: 'tier_upgraded'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recipient_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'recipient_user_id'
  },
  recipient_email: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'recipient_email'
  },
  qr_code_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'qr_code_data'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'completed'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional transaction metadata'
  }
}, {
  tableName: 'Loyalty_Transaction',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = LoyaltyTransaction; 