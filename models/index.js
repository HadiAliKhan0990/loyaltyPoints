'use strict';

const LoyaltyPoints = require('./LoyaltyPoints');
const LoyaltyTransaction = require('./Transaction');
const PointSchema = require('./PointSchema');

const db = {
  LoyaltyPoints,
  LoyaltyTransaction,
  PointSchema
};

module.exports = db;
