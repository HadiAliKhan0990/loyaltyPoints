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

    const { customerUserId, pointsAmount, cashAmount, description } = req.body;

    // Create transaction
    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      userId: customerUserId,
      transactionType: 'issue',
      pointsAmount,
      cashAmount: cashAmount || 0,
      description: description || `Points issued`,
      status: 'completed'
    });

    // Update or create loyalty points record
    let loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId: customerUserId }
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

    const { pointsToRedeem, qrCodeData } = req.body;
    const userId = req.user.user_id;

    // Find loyalty points record
    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId }
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
      transactionType: 'redeem',
      pointsAmount: pointsToRedeem,
      description: `Points redeemed from TownTicks platform`,
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

// Gift Points (TownTicks platform only)
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

    // Check sender's points
    let senderLoyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId: senderUserId }
    });

    if (!senderLoyaltyPoints || parseFloat(senderLoyaltyPoints.pointsAvailable) < pointsToGift) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Insufficient points available for gifting',
        data: undefined
      });
    }

    // Create gift transaction
    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      userId: senderUserId,
      transactionType: 'gift',
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
      where: { userId: recipientUserId }
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

// Get User Points Summary
const getUserPoints = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId }
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'User points retrieved successfully',
      data: loyaltyPoints || {
        userId,
        pointsIssued: 0,
        pointsRedeemed: 0,
        pointsTransferred: 0,
        pointsGifted: 0,
        pointsExpired: 0,
        pointsAvailable: 0
      }
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

    const { pointsAmount } = req.body;
    const userId = req.user.user_id;

    // Create QR code data
    const qrData = {
      userId,
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
        pointsAmount
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
  getUserPoints,
  generateQRCode
}; 