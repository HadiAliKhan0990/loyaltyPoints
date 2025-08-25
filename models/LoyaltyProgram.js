const { DataTypes } = require('sequelize');
const sequelize = require('../connection/db');

const LoyaltyProgram = sequelize.define('LoyaltyProgram', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Businesses',
      key: 'id'
    }
  },
  // Screen 100 - Default Billing
  useDefaultBilling: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Screen 101 - Loyalty Type Configuration
  loyaltyType: {
    type: DataTypes.ENUM('points', 'cashback'),
    defaultValue: 'points'
  },
  loyaltyCalculationType: {
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
  // Screen 162 - Redeem Type
  redeemType: {
    type: DataTypes.ENUM('points', 'cashback'),
    defaultValue: 'points'
  },
  minRedeemValue: {
    type: DataTypes.INTEGER,
    defaultValue: 200
  },
  maxRedeemValue: {
    type: DataTypes.INTEGER,
    defaultValue: 700
  },
  currentRedeemValue: {
    type: DataTypes.INTEGER,
    defaultValue: 300
  },
  pointToValueRatio: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1.00
  },
  // Screen 163 - Point Values
  pointValue1: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1.00
  },
  pointValue2: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1.00
  },
  cashValue1: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1.00
  },
  cashValue2: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  // Screen 164 - Point Issuance
  issuePoints: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  minIssueValue: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  maxIssueValue: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  currentIssueValue: {
    type: DataTypes.INTEGER,
    defaultValue: 20
  },
  // Screen 165 - Cash Loyalty
  enableCashLoyalty: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  enablePointIssuance: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  defaultCashValue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1.00
  },
  defaultCashAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  // Pool Configuration
  allowTownTicksImport: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  allowTownTicksExport: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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

module.exports = LoyaltyProgram; 