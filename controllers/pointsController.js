const { validationResult } = require('express-validator');
const QRCode = require('qrcode');
const LoyaltyPoints = require('../models/LoyaltyPoints');
const Transaction = require('../models/Transaction');
const Business = require('../models/Business');
const LoyaltyProgram = require('../models/LoyaltyProgram');
const { HTTP_STATUS_CODE } = require('../utils/httpStatus');

// Generate unique transaction ID
const generateTransactionId = () => {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Issue Points (Business to Customer)
const issuePoints = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Validation errors',
        data: errors.array()
      });
    }

    const { customerEmail, pointsAmount, cashAmount, description } = req.body;
    const businessId = req.params.businessId;

    // Verify business exists and user has access
    const business = await Business.findByPk(businessId);
    if (!business || business.userId !== req.user.user_id) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: false,
        status_msg: 'Access denied',
        data: undefined
      });
    }

    // Get loyalty program configuration
    const loyaltyProgram = await LoyaltyProgram.findOne({ where: { businessId } });
    if (!loyaltyProgram || !loyaltyProgram.issuePoints) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Point issuance is not enabled for this business',
        data: undefined
      });
    }

    // Note: Customer lookup would be done via parent database
    // For now, we'll use the customer email as identifier
    const customerUserId = req.body.customerUserId; // This should come from parent database

    // Calculate points based on loyalty program configuration
    let calculatedPoints = pointsAmount;
    if (loyaltyProgram.loyaltyCalculationType === 'percentage') {
      calculatedPoints = (cashAmount * loyaltyProgram.defaultPointsValue) / 100;
    }

    // Create transaction
    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      userId: customerUserId,
      businessId,
      transactionType: 'issue',
      poolType: 'individualBusiness',
      pointsAmount: calculatedPoints,
      cashAmount,
      description: description || `Points issued by ${business.businessName}`,
      status: 'completed'
    });

    // Update or create loyalty points record
    let loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId: customerUserId, businessId, poolType: 'individualBusiness' }
    });

    if (loyaltyPoints) {
      await loyaltyPoints.update({
        pointsIssued: parseFloat(loyaltyPoints.pointsIssued) + calculatedPoints,
        pointsAvailable: parseFloat(loyaltyPoints.pointsAvailable) + calculatedPoints,
        lastUpdated: new Date()
      });
    } else {
      loyaltyPoints = await LoyaltyPoints.create({
        userId: customerUserId,
        businessId,
        poolType: 'individualBusiness',
        pointsIssued: calculatedPoints,
        pointsAvailable: calculatedPoints,
        lastUpdated: new Date()
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Points issued successfully',
      data: {
        transaction,
        loyaltyPoints,
        calculatedPoints
      }
    });
  } catch (error) {
    console.error('Issue points error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Internal server error',
      data: undefined
    });
  }
};

// Redeem Points (Screen 167 - Business User)
const redeemPoints = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Validation errors',
        data: errors.array()
      });
    }

    const { customerEmail, pointsToRedeem, qrCodeData, customerUserId } = req.body;
    const businessId = req.params.businessId;

    // Verify business exists and user has access
    const business = await Business.findByPk(businessId);
    if (!business || business.userId !== req.user.user_id) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: false,
        status_msg: 'Access denied',
        data: undefined
      });
    }

    // Get loyalty program configuration
    const loyaltyProgram = await LoyaltyProgram.findOne({ where: { businessId } });
    if (!loyaltyProgram) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Loyalty program not configured',
        data: undefined
      });
    }

    // Get customer's loyalty points
    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId: customerUserId, businessId, poolType: 'individualBusiness' }
    });

    if (!loyaltyPoints || parseFloat(loyaltyPoints.pointsAvailable) < pointsToRedeem) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Insufficient points available',
        data: undefined
      });
    }

    // Calculate redeemed amount
    const redeemedAmount = pointsToRedeem * loyaltyProgram.pointToValueRatio;

    // Create transaction
    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      userId: customerUserId,
      businessId,
      transactionType: 'redeem',
      poolType: 'individualBusiness',
      pointsAmount: pointsToRedeem,
      cashAmount: redeemedAmount,
      description: `Points redeemed at ${business.businessName}`,
      qrCodeData,
      status: 'completed'
    });

    // Update loyalty points
    await loyaltyPoints.update({
      pointsRedeemed: parseFloat(loyaltyPoints.pointsRedeemed) + pointsToRedeem,
      pointsAvailable: parseFloat(loyaltyPoints.pointsAvailable) - pointsToRedeem,
      lastUpdated: new Date()
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Points redeemed successfully',
      data: {
        transaction,
        redeemedAmount,
        remainingPoints: parseFloat(loyaltyPoints.pointsAvailable) - pointsToRedeem
      }
    });
  } catch (error) {
    console.error('Redeem points error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Internal server error',
      data: undefined
    });
  }
};

// Gift Points (Screen 169 - Citizen User)
const giftPoints = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Validation errors',
        data: errors.array()
      });
    }

    const { pointsToGift, recipientEmail, isNewUser, recipientUserId } = req.body;

    // Verify sender has enough points in TownTicks pool
    const senderPoints = await LoyaltyPoints.findOne({
      where: { userId: req.user.user_id, poolType: 'townTicks' }
    });

    if (!senderPoints || parseFloat(senderPoints.pointsAvailable) < pointsToGift) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Insufficient points available in TownTicks pool',
        data: undefined
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      userId: req.user.user_id,
      transactionType: 'gift',
      poolType: 'townTicks',
      pointsAmount: pointsToGift,
      description: `Points gifted to ${recipientEmail}`,
      recipientEmail,
      recipientUserId: recipientUserId || null,
      status: 'completed'
    });

    // Update sender's points
    await senderPoints.update({
      pointsGifted: parseFloat(senderPoints.pointsGifted) + pointsToGift,
      pointsAvailable: parseFloat(senderPoints.pointsAvailable) - pointsToGift,
      lastUpdated: new Date()
    });

    // Update or create recipient's TownTicks pool points
    if (recipientUserId) {
      let recipientPoints = await LoyaltyPoints.findOne({
        where: { userId: recipientUserId, poolType: 'townTicks' }
      });

      if (recipientPoints) {
        await recipientPoints.update({
          pointsAvailable: parseFloat(recipientPoints.pointsAvailable) + pointsToGift,
          lastUpdated: new Date()
        });
      } else {
        await LoyaltyPoints.create({
          userId: recipientUserId,
          poolType: 'townTicks',
          pointsAvailable: pointsToGift,
          lastUpdated: new Date()
        });
      }
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Points gifted successfully',
      data: {
        transaction,
        giftedPoints: pointsToGift,
        recipientEmail
      }
    });
  } catch (error) {
    console.error('Gift points error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Internal server error',
      data: undefined
    });
  }
};

// Transfer Points to TownTicks Pool
const transferToTownTicks = async (req, res) => {
  try {
    const { businessId, pointsAmount } = req.body;

    // Verify business exists and user has access
    const business = await Business.findByPk(businessId);
    if (!business || business.userId !== req.user.user_id) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: false,
        status_msg: 'Access denied',
        data: undefined
      });
    }

    // Check if business allows export to TownTicks
    const loyaltyProgram = await LoyaltyProgram.findOne({ where: { businessId } });
    if (!loyaltyProgram || !loyaltyProgram.allowTownTicksExport) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Transfer to TownTicks pool is not allowed for this business',
        data: undefined
      });
    }

    // Get user's business pool points
    const businessPoints = await LoyaltyPoints.findOne({
      where: { userId: req.user.user_id, businessId, poolType: 'individualBusiness' }
    });

    if (!businessPoints || parseFloat(businessPoints.pointsAvailable) < pointsAmount) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Insufficient points in business pool',
        data: undefined
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      userId: req.user.user_id,
      businessId,
      transactionType: 'transfer',
      poolType: 'townTicks',
      pointsAmount,
      description: `Points transferred from ${business.businessName} to TownTicks pool`,
      status: 'completed'
    });

    // Update business pool points
    await businessPoints.update({
      pointsTransferred: parseFloat(businessPoints.pointsTransferred) + pointsAmount,
      pointsAvailable: parseFloat(businessPoints.pointsAvailable) - pointsAmount,
      lastUpdated: new Date()
    });

    // Update or create TownTicks pool points
    let townTicksPoints = await LoyaltyPoints.findOne({
      where: { userId: req.user.user_id, poolType: 'townTicks' }
    });

    if (townTicksPoints) {
      await townTicksPoints.update({
        pointsAvailable: parseFloat(townTicksPoints.pointsAvailable) + pointsAmount,
        lastUpdated: new Date()
      });
    } else {
      await LoyaltyPoints.create({
        userId: req.user.user_id,
        poolType: 'townTicks',
        pointsAvailable: pointsAmount,
        lastUpdated: new Date()
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Points transferred to TownTicks pool successfully',
      data: {
        transaction,
        transferredPoints: pointsAmount
      }
    });
  } catch (error) {
    console.error('Transfer to TownTicks error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Internal server error',
      data: undefined
    });
  }
};

// Get User Points Summary
const getUserPoints = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get all points records for the user
    const pointsRecords = await LoyaltyPoints.findAll({
      where: { userId },
      include: [
        {
          model: Business,
          as: 'business',
          attributes: ['businessName', 'businessType']
        }
      ]
    });

    // Calculate totals
    const totals = {
      totalPointsAvailable: 0,
      totalPointsIssued: 0,
      totalPointsRedeemed: 0,
      totalPointsTransferred: 0,
      totalPointsGifted: 0,
      totalPointsExpired: 0,
      townTicksPool: 0,
      businessPools: []
    };

    pointsRecords.forEach(record => {
      totals.totalPointsAvailable += parseFloat(record.pointsAvailable || 0);
      totals.totalPointsIssued += parseFloat(record.pointsIssued || 0);
      totals.totalPointsRedeemed += parseFloat(record.pointsRedeemed || 0);
      totals.totalPointsTransferred += parseFloat(record.pointsTransferred || 0);
      totals.totalPointsGifted += parseFloat(record.pointsGifted || 0);
      totals.totalPointsExpired += parseFloat(record.pointsExpired || 0);

      if (record.poolType === 'townTicks') {
        totals.townTicksPool = parseFloat(record.pointsAvailable || 0);
      } else if (record.poolType === 'individualBusiness') {
        totals.businessPools.push({
          businessName: record.business?.businessName,
          pointsAvailable: parseFloat(record.pointsAvailable || 0),
          businessId: record.businessId
        });
      }
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'User points retrieved successfully',
      data: {
        totals,
        details: pointsRecords
      }
    });
  } catch (error) {
    console.error('Get user points error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Internal server error',
      data: undefined
    });
  }
};

// Generate QR Code for Redemption
const generateQRCode = async (req, res) => {
  try {
    const { userId, businessId, pointsAmount } = req.body;

    const qrData = {
      userId,
      businessId,
      pointsAmount,
      timestamp: Date.now(),
      type: 'redemption'
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'QR code generated successfully',
      data: {
        qrCode: qrCodeDataURL,
        qrData
      }
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Internal server error',
      data: undefined
    });
  }
};

module.exports = {
  issuePoints,
  redeemPoints,
  giftPoints,
  transferToTownTicks,
  getUserPoints,
  generateQRCode
}; 