const { DataTypes } = require('sequelize');
const sequelize = require('../connection/db');

const PointSchema = sequelize.define('Point_Schema', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'User ID from parent database',
    field: 'user_id'
  },
  point_type: {
    type: DataTypes.ENUM('regular', 'bonus', 'special', 'welcome', 'referral', 'milestone', 'tier'),
    allowNull: false,
    defaultValue: 'regular',
    field: 'point_type'
  },
  point_bonus: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Additional bonus points',
    field: 'point_bonus'
  },
  tier_multiplier: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 1.00,
    comment: 'Multiplier based on user tier',
    field: 'tier_multiplier'
  },
  base_points: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1.00,
    comment: 'Base points for this type',
    field: 'base_points'
  },
  conditions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Conditions for applying this point type'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'Point_Schema',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PointSchema;
