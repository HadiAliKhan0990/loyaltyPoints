const { validationResult } = require('express-validator');
const QRCode = require('qrcode');
const LoyaltyPoints = require('../models/LoyaltyPoints');
const Transaction = require('../models/Transaction');
const { HTTP_STATUS_CODE } = require('../utils/httpStatus');

// Generate unique transaction ID
const generateTransactionId = () => {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Issue Points (Business user to Customer)
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

    const { customerUserId, pointsAmount, cashAmount, description, poolType } = req.body;
    const businessUserId = req.user.user_id; // Business user issuing points

    // Create transaction
    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      userId: customerUserId,
      businessUserId: poolType === 'business' ? businessUserId : null,
      transactionType: 'issue',
      poolType,
      pointsAmount,
      cashAmount: cashAmount || 0,
      description: description || `Points issued`,
      status: 'completed'
    });

    // Update or create loyalty points record
    let loyaltyPoints = await LoyaltyPoints.findOne({
      where: { 
        userId: customerUserId, 
        poolType,
        businessUserId: poolType === 'business' ? businessUserId : null
      }
    });

    if (loyaltyPoints) {
      await loyaltyPoints.update({
        pointsIssued: parseFloat(loyaltyPoints.pointsIssued) + pointsAmount,
        pointsAvailable: parseFloat(loyaltyPoints.pointsAvailable) + pointsAmount,
        lastUpdated: new Date()
      });
    } else {
      loyaltyPoints = await LoyaltyPoints.create({
        userId: customerUserId,
        poolType,
        businessUserId: poolType === 'business' ? businessUserId : null,
        pointsIssued: pointsAmount,
        pointsAvailable: pointsAmount,
        lastUpdated: new Date()
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Points issued successfully',
      data: {
        transaction,
        loyaltyPoints,
        pointsIssued: pointsAmount
      }
    });
  } catch (error) {
    console.error('Error issuing points:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to issue points',
      data: undefined
    });
  }
};

// Redeem Points
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

    const { pointsToRedeem, poolType, qrCodeData } = req.body;
    const userId = req.user.user_id;

    // Find loyalty points record
    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { 
        userId, 
        poolType,
        businessUserId: poolType === 'business' ? req.body.businessUserId : null
      }
    });

    if (!loyaltyPoints || parseFloat(loyaltyPoints.pointsAvailable) < pointsToRedeem) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Insufficient points available for redemption',
        data: undefined
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      userId,
      businessUserId: poolType === 'business' ? req.body.businessUserId : null,
      transactionType: 'redeem',
      poolType,
      pointsAmount: pointsToRedeem,
      description: `Points redeemed from ${poolType} pool`,
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
        loyaltyPoints,
        pointsRedeemed: pointsToRedeem
      }
    });
  } catch (error) {
    console.error('Error redeeming points:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to redeem points',
      data: undefined
    });
  }
};

// Gift Points (TownTicks pool only)
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

    const { pointsToGift, recipientUserId } = req.body;
    const senderUserId = req.user.user_id;

    // Gifting only works with TownTicks pool
    const poolType = 'townTicks';

    // Check sender's TownTicks points
    let senderLoyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId: senderUserId, poolType: 'townTicks' }
    });

    if (!senderLoyaltyPoints || parseFloat(senderLoyaltyPoints.pointsAvailable) < pointsToGift) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Insufficient TownTicks points available for gifting',
        data: undefined
      });
    }

    // Create gift transaction
    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      userId: senderUserId,
      transactionType: 'gift',
      poolType: 'townTicks',
      pointsAmount: pointsToGift,
      description: `Points gifted to user ${recipientUserId}`,
      recipientUserId,
      status: 'completed'
    });

    // Update sender's points
    await senderLoyaltyPoints.update({
      pointsGifted: parseFloat(senderLoyaltyPoints.pointsGifted) + pointsToGift,
      pointsAvailable: parseFloat(senderLoyaltyPoints.pointsAvailable) - pointsToGift,
      lastUpdated: new Date()
    });

    // Update or create recipient's points
    let recipientLoyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId: recipientUserId, poolType: 'townTicks' }
    });

    if (recipientLoyaltyPoints) {
      await recipientLoyaltyPoints.update({
        pointsIssued: parseFloat(recipientLoyaltyPoints.pointsIssued) + pointsToGift,
        pointsAvailable: parseFloat(recipientLoyaltyPoints.pointsAvailable) + pointsToGift,
        lastUpdated: new Date()
      });
    } else {
      recipientLoyaltyPoints = await LoyaltyPoints.create({
        userId: recipientUserId,
        poolType: 'townTicks',
        pointsIssued: pointsToGift,
        pointsAvailable: pointsToGift,
        lastUpdated: new Date()
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Points gifted successfully',
      data: {
        transaction,
        senderPoints: senderLoyaltyPoints,
        recipientPoints: recipientLoyaltyPoints,
        pointsGifted: pointsToGift
      }
    });
  } catch (error) {
    console.error('Error gifting points:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to gift points',
      data: undefined
    });
  }
};

// Transfer Points between pools
const transferPoints = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Validation errors',
        data: errors.array()
      });
    }

    const { pointsAmount, fromPoolType, toPoolType, businessUserId } = req.body;
    const userId = req.user.user_id;

    // Check source pool points
    let sourceLoyaltyPoints = await LoyaltyPoints.findOne({
      where: { 
        userId, 
        poolType: fromPoolType,
        businessUserId: fromPoolType === 'business' ? businessUserId : null
      }
    });

    if (!sourceLoyaltyPoints || parseFloat(sourceLoyaltyPoints.pointsAvailable) < pointsAmount) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Insufficient points in source pool for transfer',
        data: undefined
      });
    }

    // Create transfer transaction
    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      userId,
      businessUserId: fromPoolType === 'business' ? businessUserId : null,
      transactionType: 'transfer',
      poolType: fromPoolType,
      pointsAmount,
      description: `Points transferred from ${fromPoolType} to ${toPoolType}`,
      status: 'completed'
    });

    // Update source pool
    await sourceLoyaltyPoints.update({
      pointsTransferred: parseFloat(sourceLoyaltyPoints.pointsTransferred) + pointsAmount,
      pointsAvailable: parseFloat(sourceLoyaltyPoints.pointsAvailable) - pointsAmount,
      lastUpdated: new Date()
    });

    // Update or create destination pool
    let destLoyaltyPoints = await LoyaltyPoints.findOne({
      where: { 
        userId, 
        poolType: toPoolType,
        businessUserId: toPoolType === 'business' ? businessUserId : null
      }
    });

    if (destLoyaltyPoints) {
      await destLoyaltyPoints.update({
        pointsIssued: parseFloat(destLoyaltyPoints.pointsIssued) + pointsAmount,
        pointsAvailable: parseFloat(destLoyaltyPoints.pointsAvailable) + pointsAmount,
        lastUpdated: new Date()
      });
    } else {
      destLoyaltyPoints = await LoyaltyPoints.create({
        userId,
        poolType: toPoolType,
        businessUserId: toPoolType === 'business' ? businessUserId : null,
        pointsIssued: pointsAmount,
        pointsAvailable: pointsAmount,
        lastUpdated: new Date()
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Points transferred successfully',
      data: {
        transaction,
        sourcePoints: sourceLoyaltyPoints,
        destPoints: destLoyaltyPoints,
        pointsTransferred: pointsAmount
      }
    });
  } catch (error) {
    console.error('Error transferring points:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to transfer points',
      data: undefined
    });
  }
};

// Get User Points Summary
const getUserPoints = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const loyaltyPoints = await LoyaltyPoints.findAll({
      where: { userId },
      order: [['poolType', 'ASC'], ['createdAt', 'DESC']]
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'User points retrieved successfully',
      data: loyaltyPoints
    });
  } catch (error) {
    console.error('Error getting user points:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to get user points',
      data: undefined
    });
  }
};

// Generate QR Code for Redemption
const generateQRCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Validation errors',
        data: errors.array()
      });
    }

    const { pointsAmount, poolType, businessUserId } = req.body;
    const userId = req.user.user_id;

    // Create QR code data
    const qrData = {
      userId,
      businessUserId: poolType === 'business' ? businessUserId : null,
      poolType,
      pointsAmount,
      timestamp: Date.now()
    };

    const qrCodeData = JSON.stringify(qrData);
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'QR code generated successfully',
      data: {
        qrCodeData,
        qrCodeImage,
        pointsAmount,
        poolType
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to generate QR code',
      data: undefined
    });
  }
};

module.exports = {
  issuePoints,
  redeemPoints,
  giftPoints,
  transferPoints,
  getUserPoints,
  generateQRCode
}; 