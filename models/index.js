'use strict';

const LoyaltyPoints = require('./LoyaltyPoints');
const Transaction = require('./Transaction');
const UserConfiguration = require('./UserConfiguration');
const PointSchema = require('./PointSchema');

const db = {
  LoyaltyPoints,
  Transaction,
  UserConfiguration,
  PointSchema
};

module.exports = db;
