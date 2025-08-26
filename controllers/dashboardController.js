const { Op } = require('sequelize');
const LoyaltyPoints = require('../models/LoyaltyPoints');
const Transaction = require('../models/Transaction');
const { HTTP_STATUS_CODE } = require('../utils/httpStatus');

// Get User Dashboard Analytics
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { period = 'all' } = req.query; // all, week, month, year

    // Calculate date range based on period
    let dateFilter = {};
    if (period !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      dateFilter = {
        createdAt: {
          [Op.gte]: startDate
        }
      };
    }

    // Get all transactions for this user
    const transactions = await Transaction.findAll({
      where: {
        userId,
        ...dateFilter
      },
      order: [['createdAt', 'DESC']]
    });

    // Get loyalty points record for this user
    const loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId }
    });

    // Calculate analytics
    const analytics = {
      totalPointsIssued: 0,
      totalPointsRedeemed: 0,
      totalPointsTransferred: 0,
      totalPointsGifted: 0,
      totalPointsExpired: 0,
      totalPointsAvailable: 0,
      recentTransactions: transactions.slice(0, 10),
      period: period,
      lastUpdated: new Date()
    };

    // Calculate from transactions
    transactions.forEach(transaction => {
      const pointsAmount = parseFloat(transaction.pointsAmount || 0);
      
      switch (transaction.transactionType) {
        case 'issue':
          analytics.totalPointsIssued += pointsAmount;
          break;
        case 'redeem':
          analytics.totalPointsRedeemed += pointsAmount;
          break;
        case 'transfer':
          analytics.totalPointsTransferred += pointsAmount;
          break;
        case 'gift':
          analytics.totalPointsGifted += pointsAmount;
          break;
        case 'expire':
          analytics.totalPointsExpired += pointsAmount;
          break;
      }
    });

    // Get current points from loyalty points record
    if (loyaltyPoints) {
      analytics.totalPointsAvailable = parseFloat(loyaltyPoints.pointsAvailable || 0);
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'User dashboard analytics retrieved successfully',
      data: analytics
    });
  } catch (error) {
    console.error('Error getting user dashboard:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to get user dashboard analytics',
      data: undefined
    });
  }
};

// Get System-wide Analytics (Admin only)
const getSystemAnalytics = async (req, res) => {
  try {
    const { period = 'all' } = req.query;

    // Calculate date range based on period
    let dateFilter = {};
    if (period !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      dateFilter = {
        createdAt: {
          [Op.gte]: startDate
        }
      };
    }

    // Get system-wide statistics
    const totalTransactions = await Transaction.count({
      where: dateFilter
    });

    const totalLoyaltyPoints = await LoyaltyPoints.sum('pointsAvailable', {
      where: dateFilter
    });

    const totalUsers = await LoyaltyPoints.count({
      distinct: true,
      col: 'userId',
      where: dateFilter
    });

    const analytics = {
      totalTransactions,
      totalLoyaltyPoints: totalLoyaltyPoints || 0,
      totalUsers,
      period,
      lastUpdated: new Date()
    };

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'System analytics retrieved successfully',
      data: analytics
    });
  } catch (error) {
    console.error('Error getting system analytics:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Failed to get system analytics',
      data: undefined
    });
  }
};

module.exports = {
  getUserDashboard,
  getSystemAnalytics
}; 