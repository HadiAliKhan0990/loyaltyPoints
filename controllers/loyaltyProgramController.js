const { validationResult } = require('express-validator');
const LoyaltyProgram = require('../models/LoyaltyProgram');
const Business = require('../models/Business');
const { HTTP_STATUS_CODE } = require('../utils/httpStatus');

// Create or Update Loyalty Program Configuration
const configureLoyaltyProgram = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Validation errors',
        data: errors.array()
      });
    }

    const businessId = req.params.businessId;
    const {
      useDefaultBilling,
      loyaltyType,
      loyaltyCalculationType,
      defaultPointsValue,
      defaultCashbackValue,
      redeemType,
      minRedeemValue,
      maxRedeemValue,
      currentRedeemValue,
      pointToValueRatio,
      pointValue1,
      pointValue2,
      cashValue1,
      cashValue2,
      issuePoints,
      minIssueValue,
      maxIssueValue,
      currentIssueValue,
      enableCashLoyalty,
      enablePointIssuance,
      defaultCashValue,
      defaultCashAmount,
      allowTownTicksImport,
      allowTownTicksExport
    } = req.body;

    // Verify business exists and user has access
    const business = await Business.findByPk(businessId);
    if (!business) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: false,
        status_msg: 'Business not found',
        data: undefined
      });
    }

    if (business.userId !== req.user.user_id) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: false,
        status_msg: 'Access denied',
        data: undefined
      });
    }

    // Find existing loyalty program or create new one
    let loyaltyProgram = await LoyaltyProgram.findOne({ where: { businessId } });
    
    if (loyaltyProgram) {
      // Update existing program
      await loyaltyProgram.update({
        useDefaultBilling,
        loyaltyType,
        loyaltyCalculationType,
        defaultPointsValue,
        defaultCashbackValue,
        redeemType,
        minRedeemValue,
        maxRedeemValue,
        currentRedeemValue,
        pointToValueRatio,
        pointValue1,
        pointValue2,
        cashValue1,
        cashValue2,
        issuePoints,
        minIssueValue,
        maxIssueValue,
        currentIssueValue,
        enableCashLoyalty,
        enablePointIssuance,
        defaultCashValue,
        defaultCashAmount,
        allowTownTicksImport,
        allowTownTicksExport
      });
    } else {
      // Create new program
      loyaltyProgram = await LoyaltyProgram.create({
        businessId,
        useDefaultBilling,
        loyaltyType,
        loyaltyCalculationType,
        defaultPointsValue,
        defaultCashbackValue,
        redeemType,
        minRedeemValue,
        maxRedeemValue,
        currentRedeemValue,
        pointToValueRatio,
        pointValue1,
        pointValue2,
        cashValue1,
        cashValue2,
        issuePoints,
        minIssueValue,
        maxIssueValue,
        currentIssueValue,
        enableCashLoyalty,
        enablePointIssuance,
        defaultCashValue,
        defaultCashAmount,
        allowTownTicksImport,
        allowTownTicksExport
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Loyalty program configured successfully',
      data: loyaltyProgram
    });
  } catch (error) {
    console.error('Configure loyalty program error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Internal server error',
      data: undefined
    });
  }
};

// Get Loyalty Program Configuration
const getLoyaltyProgram = async (req, res) => {
  try {
    const businessId = req.params.businessId;

    // Verify business exists and user has access
    const business = await Business.findByPk(businessId);
    if (!business) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: false,
        status_msg: 'Business not found',
        data: undefined
      });
    }

    if (business.userId !== req.user.user_id) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: false,
        status_msg: 'Access denied',
        data: undefined
      });
    }

    const loyaltyProgram = await LoyaltyProgram.findOne({ where: { businessId } });

    if (!loyaltyProgram) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: false,
        status_msg: 'Loyalty program not found',
        data: undefined
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Loyalty program retrieved successfully',
      data: loyaltyProgram
    });
  } catch (error) {
    console.error('Get loyalty program error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Internal server error',
      data: undefined
    });
  }
};

// Update Default Billing Setting (Screen 100)
const updateDefaultBilling = async (req, res) => {
  try {
    const { useDefaultBilling } = req.body;
    const businessId = req.params.businessId;

    const business = await Business.findByPk(businessId);
    if (!business || business.userId !== req.user.user_id) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: false,
        status_msg: 'Access denied',
        data: undefined
      });
    }

    let loyaltyProgram = await LoyaltyProgram.findOne({ where: { businessId } });
    if (!loyaltyProgram) {
      loyaltyProgram = await LoyaltyProgram.create({ businessId });
    }

    await loyaltyProgram.update({ useDefaultBilling });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Default billing setting updated',
      data: { useDefaultBilling }
    });
  } catch (error) {
    console.error('Update default billing error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Internal server error',
      data: undefined
    });
  }
};

// Update Loyalty Type Configuration (Screen 101)
const updateLoyaltyType = async (req, res) => {
  try {
    const {
      loyaltyType,
      loyaltyCalculationType,
      defaultPointsValue,
      defaultCashbackValue
    } = req.body;
    const businessId = req.params.businessId;

    const business = await Business.findByPk(businessId);
    if (!business || business.userId !== req.user.user_id) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: false,
        status_msg: 'Access denied',
        data: undefined
      });
    }

    let loyaltyProgram = await LoyaltyProgram.findOne({ where: { businessId } });
    if (!loyaltyProgram) {
      loyaltyProgram = await LoyaltyProgram.create({ businessId });
    }

    await loyaltyProgram.update({
      loyaltyType,
      loyaltyCalculationType,
      defaultPointsValue,
      defaultCashbackValue
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Loyalty type configuration updated',
      data: {
        loyaltyType,
        loyaltyCalculationType,
        defaultPointsValue,
        defaultCashbackValue
      }
    });
  } catch (error) {
    console.error('Update loyalty type error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Internal server error',
      data: undefined
    });
  }
};

// Update Redeem Configuration (Screen 162)
const updateRedeemConfig = async (req, res) => {
  try {
    const {
      redeemType,
      minRedeemValue,
      maxRedeemValue,
      currentRedeemValue,
      pointToValueRatio
    } = req.body;
    const businessId = req.params.businessId;

    const business = await Business.findByPk(businessId);
    if (!business || business.userId !== req.user.user_id) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: false,
        status_msg: 'Access denied',
        data: undefined
      });
    }

    let loyaltyProgram = await LoyaltyProgram.findOne({ where: { businessId } });
    if (!loyaltyProgram) {
      loyaltyProgram = await LoyaltyProgram.create({ businessId });
    }

    await loyaltyProgram.update({
      redeemType,
      minRedeemValue,
      maxRedeemValue,
      currentRedeemValue,
      pointToValueRatio
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Redeem configuration updated',
      data: {
        redeemType,
        minRedeemValue,
        maxRedeemValue,
        currentRedeemValue,
        pointToValueRatio
      }
    });
  } catch (error) {
    console.error('Update redeem config error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Internal server error',
      data: undefined
    });
  }
};

// Update Point Issuance Configuration (Screen 164)
const updatePointIssuance = async (req, res) => {
  try {
    const {
      issuePoints,
      minIssueValue,
      maxIssueValue,
      currentIssueValue
    } = req.body;
    const businessId = req.params.businessId;

    const business = await Business.findByPk(businessId);
    if (!business || business.userId !== req.user.user_id) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: false,
        status_msg: 'Access denied',
        data: undefined
      });
    }

    let loyaltyProgram = await LoyaltyProgram.findOne({ where: { businessId } });
    if (!loyaltyProgram) {
      loyaltyProgram = await LoyaltyProgram.create({ businessId });
    }

    await loyaltyProgram.update({
      issuePoints,
      minIssueValue,
      maxIssueValue,
      currentIssueValue
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Point issuance configuration updated',
      data: {
        issuePoints,
        minIssueValue,
        maxIssueValue,
        currentIssueValue
      }
    });
  } catch (error) {
    console.error('Update point issuance error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Internal server error',
      data: undefined
    });
  }
};

module.exports = {
  configureLoyaltyProgram,
  getLoyaltyProgram,
  updateDefaultBilling,
  updateLoyaltyType,
  updateRedeemConfig,
  updatePointIssuance
}; 