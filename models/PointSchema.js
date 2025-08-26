const { DataTypes } = require('sequelize');
const sequelize = require('../connection/db');

const PointSchema = sequelize.define('PointSchema', {
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
  pointType: {
    type: DataTypes.ENUM('regular', 'bonus', 'special', 'welcome', 'referral'),
    allowNull: false,
    defaultValue: 'regular'
  },
  pointBonus: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Additional bonus points'
  },
  tierMultiplier: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 1.00,
    comment: 'Multiplier based on user tier'
  },
  basePoints: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1.00,
    comment: 'Base points for this type'
  },
  conditions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Conditions for applying this point type'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
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

module.exports = PointSchema;
