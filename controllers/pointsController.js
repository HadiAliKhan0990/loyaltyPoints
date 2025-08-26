const { validationResult } = require('express-validator');
const QRCode = require('qrcode');
const LoyaltyPoints = require('../models/LoyaltyPoints');
const LoyaltyTransaction = require('../models/Transaction');
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

    const { customer_user_id, points_amount, cash_amount, description } = req.body;

    // Create transaction
    const transaction = await LoyaltyTransaction.create({
      transaction_id: generateTransactionId(),
      user_id: customer_user_id,
      transaction_type: 'issue',
      points_amount: points_amount,
      cash_amount: cash_amount || 0,
      description: description || `Points issued`,
      status: 'completed'
    });

    // Update or create loyalty points record
    let loyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: customer_user_id }
    });

    if (loyaltyPoints) {
      await loyaltyPoints.update({
        points_issued: parseFloat(loyaltyPoints.points_issued) + points_amount,
        points_available: parseFloat(loyaltyPoints.points_available) + points_amount,
        last_updated: new Date()
      });
    } else {
      loyaltyPoints = await LoyaltyPoints.create({
        user_id: customer_user_id,
        points_issued: points_amount,
        points_available: points_amount,
        last_updated: new Date()
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Points issued successfully',
      data: {
        transaction,
        loyalty_points: loyaltyPoints,
        points_issued: points_amount
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

    const { points_to_redeem, qr_code_data } = req.body;
    const userId = req.user.user_id;

    // Find loyalty points record
    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: userId }
    });

    if (!loyaltyPoints || parseFloat(loyaltyPoints.points_available) < points_to_redeem) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Insufficient points available for redemption',
        data: undefined
      });
    }

    // Create transaction
    const transaction = await LoyaltyTransaction.create({
      transaction_id: generateTransactionId(),
      user_id: userId,
      transaction_type: 'redeem',
      points_amount: points_to_redeem,
      description: `Points redeemed from TownTicks platform`,
      qr_code_data: qr_code_data,
      status: 'completed'
    });

    // Update loyalty points
    await loyaltyPoints.update({
      points_redeemed: parseFloat(loyaltyPoints.points_redeemed) + points_to_redeem,
      points_available: parseFloat(loyaltyPoints.points_available) - points_to_redeem,
      last_updated: new Date()
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Points redeemed successfully',
      data: {
        transaction,
        loyalty_points: loyaltyPoints,
        points_redeemed: points_to_redeem
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

    const { points_to_gift, recipient_user_id } = req.body;
    const senderUserId = req.user.user_id;

    // Check sender's points
    let senderLoyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: senderUserId }
    });

    if (!senderLoyaltyPoints || parseFloat(senderLoyaltyPoints.points_available) < points_to_gift) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Insufficient points available for gifting',
        data: undefined
      });
    }

    // Create gift transaction
    const transaction = await LoyaltyTransaction.create({
      transaction_id: generateTransactionId(),
      user_id: senderUserId,
      transaction_type: 'gift',
      points_amount: points_to_gift,
      description: `Points gifted to user ${recipient_user_id}`,
      recipient_user_id: recipient_user_id,
      status: 'completed'
    });

    // Update sender's points
    await senderLoyaltyPoints.update({
      points_gifted: parseFloat(senderLoyaltyPoints.points_gifted) + points_to_gift,
      points_available: parseFloat(senderLoyaltyPoints.points_available) - points_to_gift,
      last_updated: new Date()
    });

    // Update or create recipient's points
    let recipientLoyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: recipient_user_id }
    });

    if (recipientLoyaltyPoints) {
      await recipientLoyaltyPoints.update({
        points_issued: parseFloat(recipientLoyaltyPoints.points_issued) + points_to_gift,
        points_available: parseFloat(recipientLoyaltyPoints.points_available) + points_to_gift,
        last_updated: new Date()
      });
    } else {
      recipientLoyaltyPoints = await LoyaltyPoints.create({
        user_id: recipient_user_id,
        points_issued: points_to_gift,
        points_available: points_to_gift,
        last_updated: new Date()
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Points gifted successfully',
      data: {
        transaction,
        sender_points: senderLoyaltyPoints,
        recipient_points: recipientLoyaltyPoints,
        points_gifted: points_to_gift
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
    const userId = req.params.userId;
    
    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { user_id: userId }
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'User points retrieved successfully',
      data: loyaltyPoints || {
        user_id: userId,
        points_issued: 0,
        points_redeemed: 0,
        points_transferred: 0,
        points_gifted: 0,
        points_expired: 0,
        points_available: 0
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

    const { points_amount } = req.body;
    const userId = req.user.user_id;

    // Create QR code data
    const qrData = {
      user_id: userId,
      points_amount: points_amount,
      timestamp: Date.now()
    };

    const qr_code_data = JSON.stringify(qrData);
    const qr_code_image = await QRCode.toDataURL(qr_code_data);

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'QR code generated successfully',
      data: {
        qr_code_data,
        qr_code_image,
        points_amount
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