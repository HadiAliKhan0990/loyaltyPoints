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
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Businesses',
      key: 'id'
    }
  },
  poolType: {
    type: DataTypes.ENUM('townTicks', 'business', 'individualBusiness'),
    allowNull: false
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
  pointsInTownTicksPool: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  pointsInBusinessPool: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  pointsInIndividualBusinessPool: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
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