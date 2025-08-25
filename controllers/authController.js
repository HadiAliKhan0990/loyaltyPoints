const { validationResult } = require('express-validator');
const Business = require('../models/Business');
const { HTTP_STATUS_CODE } = require('../utils/httpStatus');

// Get Current User Profile (from parent database)
const getProfile = async (req, res) => {
  try {
    // User data comes from parent database via JWT token
    const user = req.user;

    let businessData = null;
    if (user.user_category === 1) { // Business user
      businessData = await Business.findOne({ where: { userId: user.user_id } });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Profile retrieved successfully',
      data: {
        user,
        business: businessData
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Error retrieving profile',
      data: undefined
    });
  }
};

// Create Business Profile (for business users)
const createBusinessProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Validation errors',
        data: errors.array()
      });
    }

    const {
      businessName,
      businessType,
      address,
      city,
      state,
      zipCode,
      phone,
      website,
      description
    } = req.body;

    // Check if business profile already exists
    const existingBusiness = await Business.findOne({ where: { userId: req.user.user_id } });
    if (existingBusiness) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Business profile already exists',
        data: undefined
      });
    }

    // Create business profile
    const business = await Business.create({
      userId: req.user.user_id,
      businessName,
      businessType,
      address,
      city,
      state,
      zipCode,
      phone,
      website,
      description
    });

    res.status(HTTP_STATUS_CODE.CREATED).json({
      status: true,
      status_msg: 'Business profile created successfully',
      data: business
    });
  } catch (error) {
    console.error('Create business profile error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Error creating business profile',
      data: undefined
    });
  }
};

// Update Business Profile
const updateBusinessProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: false,
        status_msg: 'Validation errors',
        data: errors.array()
      });
    }

    const business = await Business.findOne({ where: { userId: req.user.user_id } });
    if (!business) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: false,
        status_msg: 'Business profile not found',
        data: undefined
      });
    }

    await business.update(req.body);

    res.status(HTTP_STATUS_CODE.OK).json({
      status: true,
      status_msg: 'Business profile updated successfully',
      data: business
    });
  } catch (error) {
    console.error('Update business profile error:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      status_msg: 'Error updating business profile',
      data: undefined
    });
  }
};

module.exports = {
  getProfile,
  createBusinessProfile,
  updateBusinessProfile
}; 