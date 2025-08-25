const { Op } = require('sequelize');
const LoyaltyPoints = require('../models/LoyaltyPoints');
const Transaction = require('../models/Transaction');
const Business = require('../models/Business');
const { HTTP_STATUS_CODE } = require('../utils/httpStatus');

// Get Business Dashboard Analytics (Screen 166)
const getBusinessDashboard = async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const { period = 'all' } = req.query; // all, week, month, year

    // Verify business exists and user has access
    const business = await Business.findByPk(businessId);
    if (!business || business.userId !== req.user.user_id) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: false,
        status_msg: 'Access denied',
        data: undefined
      });
    }

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

    // Get all transactions for this business
    const transactions = await Transaction.findAll({
      where: {
        businessId,
        ...dateFilter
      }
    });

    // Get all loyalty points records for this business
    const loyaltyPointsRecords = await LoyaltyPoints.findAll({
      where: { businessId }
    });

    // Calculate analytics
    const analytics = {
      totalPointsIssued: 0,
      totalLoyaltyPointsInSystem: 0,
      totalPointsRedeemed: 0,
      totalPointsTransferred: 0,
      totalPointsGifted: 0,
      totalPointsExpired: 0,
      totalPointsAvailable: 0,
      totalPointsInTownTicksPool: 0,
      totalPointsInBusinessPool: 0,
      totalPointsInIndividualBusinessPool: 0,
      totalPointsInBusinessPool2: 0, // Duplicate as per Figma
      period: period,
      businessName: business.businessName,
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

    // Calculate from loyalty points records
    loyaltyPointsRecords.forEach(record => {
      analytics.totalLoyaltyPointsInSystem += parseFloat(record.pointsIssued || 0);
      analytics.totalPointsAvailable += parseFloat(record.pointsAvailable || 0);
      
      switch (record.poolType) {
        case 'townTicks':
          analytics.totalPointsInTownTicksPool += parseFloat(record.pointsAvailable || 0);
          break;
        case 'business':
          analytics.totalPointsInBusinessPool += parseFloat(record.pointsAvailable || 0);
          analytics.totalPointsInBusinessPool2 += parseFloat(record.pointsAvailable || 0);
          break;
        case 'individualBusiness':
          analytics.totalPointsInIndividualBusinessPool += parseFloat(record.pointsAvailable || 0);
          break;
      }
    });

    // Get recent transactions for detailed view
    const recentTransactions = await Transaction.findAll({
      where: {
        businessId,
        ...dateFilter
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Get customer statistics
    const uniqueCustomers = await Transaction.findAll({
      where: {
        businessId,
        transactionType: 'issue',
        ...dateFilter
      },
      attributes: ['userId'],
      group: ['userId']
    });

    const customerCount = uniqueCustomers.length;

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Business dashboard retrieved successfully',
      data: {
        analytics,
        recentTransactions,
        customerCount,
        period
      }
    });
  } catch (error) {
    console.error('Get business dashboard error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Internal server error',
      data: undefined
    });
  }
};

// Get Customer Dashboard Analytics
const getCustomerDashboard = async (req, res) => {
  try {
    const userId = req.user.user_id;
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

    // Get all transactions for this user
    const transactions = await Transaction.findAll({
      where: {
        userId,
        ...dateFilter
      },
      include: [
        {
          model: Business,
          as: 'business',
          attributes: ['businessName', 'businessType']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get all loyalty points records for this user
    const loyaltyPointsRecords = await LoyaltyPoints.findAll({
      where: { userId },
      include: [
        {
          model: Business,
          as: 'business',
          attributes: ['businessName', 'businessType']
        }
      ]
    });

    // Calculate analytics
    const analytics = {
      totalPointsAvailable: 0,
      totalPointsIssued: 0,
      totalPointsRedeemed: 0,
      totalPointsTransferred: 0,
      totalPointsGifted: 0,
      totalPointsExpired: 0,
      totalPointsInTownTicksPool: 0,
      totalPointsInBusinessPool: 0,
      totalPointsInIndividualBusinessPool: 0,
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

    // Calculate from loyalty points records
    loyaltyPointsRecords.forEach(record => {
      analytics.totalPointsAvailable += parseFloat(record.pointsAvailable || 0);
      
      switch (record.poolType) {
        case 'townTicks':
          analytics.totalPointsInTownTicksPool += parseFloat(record.pointsAvailable || 0);
          break;
        case 'business':
          analytics.totalPointsInBusinessPool += parseFloat(record.pointsAvailable || 0);
          break;
        case 'individualBusiness':
          analytics.totalPointsInIndividualBusinessPool += parseFloat(record.pointsAvailable || 0);
          break;
      }
    });

    // Get business breakdown
    const businessBreakdown = [];
    loyaltyPointsRecords.forEach(record => {
      if (record.poolType === 'individualBusiness' && record.business) {
        businessBreakdown.push({
          businessName: record.business.businessName,
          businessType: record.business.businessType,
          pointsAvailable: parseFloat(record.pointsAvailable || 0),
          pointsIssued: parseFloat(record.pointsIssued || 0),
          pointsRedeemed: parseFloat(record.pointsRedeemed || 0)
        });
      }
    });

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Customer dashboard retrieved successfully',
      data: {
        analytics,
        transactions: transactions.slice(0, 10), // Recent 10 transactions
        businessBreakdown,
        period
      }
    });
  } catch (error) {
    console.error('Get customer dashboard error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Internal server error',
      data: undefined
    });
  }
};

// Get System-wide Analytics (Admin/Platform level)
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

    // Get all transactions
    const transactions = await Transaction.findAll({
      where: dateFilter,
      include: [
        {
          model: Business,
          as: 'business',
          attributes: ['businessName']
        }
      ]
    });

    // Get all loyalty points records
    const loyaltyPointsRecords = await LoyaltyPoints.findAll({
      include: [
        {
          model: Business,
          as: 'business',
          attributes: ['businessName']
        }
      ]
    });

    // Calculate system-wide analytics
    const analytics = {
      totalPointsIssued: 0,
      totalLoyaltyPointsInSystem: 0,
      totalPointsRedeemed: 0,
      totalPointsTransferred: 0,
      totalPointsGifted: 0,
      totalPointsExpired: 0,
      totalPointsAvailable: 0,
      totalPointsInTownTicksPool: 0,
      totalPointsInBusinessPool: 0,
      totalPointsInIndividualBusinessPool: 0,
      totalBusinesses: 0,
      totalCustomers: 0,
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

    // Calculate from loyalty points records
    loyaltyPointsRecords.forEach(record => {
      analytics.totalLoyaltyPointsInSystem += parseFloat(record.pointsIssued || 0);
      analytics.totalPointsAvailable += parseFloat(record.pointsAvailable || 0);
      
      switch (record.poolType) {
        case 'townTicks':
          analytics.totalPointsInTownTicksPool += parseFloat(record.pointsAvailable || 0);
          break;
        case 'business':
          analytics.totalPointsInBusinessPool += parseFloat(record.pointsAvailable || 0);
          break;
        case 'individualBusiness':
          analytics.totalPointsInIndividualBusinessPool += parseFloat(record.pointsAvailable || 0);
          break;
      }
    });

    // Get unique business and customer counts
    const uniqueBusinesses = await Transaction.findAll({
      where: dateFilter,
      attributes: ['businessId'],
      group: ['businessId']
    });

    const uniqueCustomers = await Transaction.findAll({
      where: dateFilter,
      attributes: ['userId'],
      group: ['userId']
    });

    analytics.totalBusinesses = uniqueBusinesses.length;
    analytics.totalCustomers = uniqueCustomers.length;

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'System analytics retrieved successfully',
      data: {
        analytics,
        period
      }
    });
  } catch (error) {
    console.error('Get system analytics error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Internal server error',
      data: undefined
    });
  }
};

module.exports = {
  getBusinessDashboard,
  getCustomerDashboard,
  getSystemAnalytics
}; 