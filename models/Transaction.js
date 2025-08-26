const { DataTypes } = require('sequelize');
const sequelize = require('../connection/db');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  transactionType: {
    type: DataTypes.ENUM('issue', 'redeem', 'gift', 'transfer', 'import', 'export', 'expire', 'cashback_issue', 'cashback_redeem', 'milestone_bonus', 'tier_bonus'),
    allowNull: false
  },
  pointType: {
    type: DataTypes.ENUM('regular', 'bonus', 'special', 'welcome', 'referral', 'milestone', 'tier'),
    defaultValue: 'regular'
  },
  pointsAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  cashAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  cashbackAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  tierMultiplier: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 1.00
  },
  bonusPoints: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  // Import/Export specific fields
  sourcePool: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Source pool for import/export transactions'
  },
  destinationPool: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Destination pool for import/export transactions'
  },
  // Milestone tracking
  milestoneReached: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Milestone that was reached'
  },
  tierUpgraded: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Tier that was upgraded to'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recipientUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  recipientEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  qrCodeData: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'completed'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional transaction metadata'
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

module.exports = Transaction; 