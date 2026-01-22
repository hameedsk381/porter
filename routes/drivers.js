const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { requireDriver } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/drivers/kyc
// @desc    Submit KYC documents
// @access  Private (Driver)
router.post('/kyc', requireDriver, [
  body('licenseNumber').notEmpty().withMessage('License number is required'),
  body('licenseExpiry').isISO8601().withMessage('Valid license expiry date required'),
  body('aadhaarNumber').isLength({ min: 12, max: 12 }).withMessage('Valid Aadhaar number required'),
  body('vehicleDetails.type').isIn(['2-wheeler', 'mini-truck', 'tempo', '3-wheeler', 'large-truck']).withMessage('Valid vehicle type required'),
  body('vehicleDetails.number').notEmpty().withMessage('Vehicle number is required'),
  body('vehicleDetails.model').notEmpty().withMessage('Vehicle model is required'),
  body('vehicleDetails.year').isInt({ min: 1990, max: new Date().getFullYear() + 1 }).withMessage('Valid vehicle year required'),
  body('vehicleDetails.color').notEmpty().withMessage('Vehicle color is required'),
  body('vehicleDetails.capacity').isInt({ min: 1 }).withMessage('Valid vehicle capacity required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      licenseNumber,
      licenseExpiry,
      aadhaarNumber,
      vehicleDetails,
      documents
    } = req.body;

    // Update driver profile
    const user = await User.findById(req.user._id);
    
    user.driverProfile = {
      ...user.driverProfile,
      licenseNumber,
      licenseExpiry: new Date(licenseExpiry),
      aadhaarNumber,
      vehicleDetails: {
        type: vehicleDetails.type,
        number: vehicleDetails.number,
        model: vehicleDetails.model,
        year: vehicleDetails.year,
        color: vehicleDetails.color,
        capacity: vehicleDetails.capacity
      },
      documents: documents || {},
      isKYCVerified: false // Will be verified by admin
    };

    await user.save();

    res.json({
      status: 'success',
      message: 'KYC documents submitted successfully. Pending admin verification.',
      data: user.driverProfile
    });
  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit KYC documents'
    });
  }
});

// @route   POST /api/drivers/upload-document
// @desc    Upload KYC document
// @access  Private (Driver)
router.post('/upload-document', requireDriver, [
  body('documentType').isIn(['license', 'aadhaar', 'rc', 'insurance']).withMessage('Valid document type required'),
  body('imageUrl').notEmpty().withMessage('Image URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { documentType, imageUrl } = req.body;

    const user = await User.findById(req.user._id);
    
    if (!user.driverProfile.documents) {
      user.driverProfile.documents = {};
    }

    user.driverProfile.documents[documentType] = imageUrl;
    await user.save();

    res.json({
      status: 'success',
      message: 'Document uploaded successfully',
      data: {
        documentType,
        imageUrl
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload document'
    });
  }
});

// @route   PUT /api/drivers/availability
// @desc    Toggle driver availability
// @access  Private (Driver)
router.put('/availability', requireDriver, [
  body('isAvailable').isBoolean().withMessage('Availability status must be boolean'),
  body('location').optional().isObject().withMessage('Location must be an object'),
  body('location.coordinates.lat').optional().isNumeric().withMessage('Valid latitude required'),
  body('location.coordinates.lng').optional().isNumeric().withMessage('Valid longitude required'),
  body('location.address').optional().isString().withMessage('Address must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { isAvailable, location } = req.body;

    // Check if driver is KYC verified
    if (isAvailable && !req.user.driverProfile.isKYCVerified) {
      return res.status(400).json({
        status: 'error',
        message: 'KYC verification required to go online'
      });
    }

    const user = await User.findById(req.user._id);
    user.driverProfile.isAvailable = isAvailable;

    // Update location if provided
    if (location && location.coordinates) {
      user.driverProfile.currentLocation = {
        coordinates: [location.coordinates.lng, location.coordinates.lat],
        address: location.address || '',
        lastUpdated: new Date()
      };
    }

    await user.save();

    res.json({
      status: 'success',
      message: `Driver is now ${isAvailable ? 'online' : 'offline'}`,
      data: {
        isAvailable: user.driverProfile.isAvailable,
        currentLocation: user.driverProfile.currentLocation
      }
    });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update availability'
    });
  }
});

// @route   PUT /api/drivers/location
// @desc    Update driver location
// @access  Private (Driver)
router.put('/location', requireDriver, [
  body('coordinates.lat').isNumeric().withMessage('Valid latitude required'),
  body('coordinates.lng').isNumeric().withMessage('Valid longitude required'),
  body('address').optional().isString().withMessage('Address must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { coordinates, address } = req.body;

    const user = await User.findById(req.user._id);
    
    user.driverProfile.currentLocation = {
      coordinates: [coordinates.lng, coordinates.lat],
      address: address || '',
      lastUpdated: new Date()
    };

    await user.save();

    // Emit location update to connected clients
    const io = req.app.get('io');
    io.emit('driver-location-update', {
      driverId: user._id,
      location: user.driverProfile.currentLocation
    });

    res.json({
      status: 'success',
      message: 'Location updated successfully',
      data: user.driverProfile.currentLocation
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update location'
    });
  }
});

// @route   GET /api/drivers/earnings
// @desc    Get driver earnings
// @access  Private (Driver)
router.get('/earnings', requireDriver, async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'day':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = { createdAt: { $gte: today } };
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { createdAt: { $gte: weekAgo } };
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        dateFilter = { createdAt: { $gte: monthAgo } };
        break;
      case 'custom':
        if (startDate && endDate) {
          dateFilter = {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          };
        }
        break;
    }

    const bookings = await Booking.find({
      driver: req.user._id,
      status: 'completed',
      ...dateFilter
    }).select('fare payment createdAt');

    const totalEarnings = bookings.reduce((sum, booking) => {
      return sum + (booking.fare.total || 0);
    }, 0);

    const totalTrips = bookings.length;
    const averageEarnings = totalTrips > 0 ? totalEarnings / totalTrips : 0;

    res.json({
      status: 'success',
      data: {
        period,
        totalEarnings,
        totalTrips,
        averageEarnings: Math.round(averageEarnings * 100) / 100,
        bookings: bookings.map(booking => ({
          id: booking._id,
          fare: booking.fare.total,
          createdAt: booking.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch earnings'
    });
  }
});

// @route   GET /api/drivers/ratings
// @desc    Get driver ratings and reviews
// @access  Private (Driver)
router.get('/ratings', requireDriver, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const bookings = await Booking.find({
      driver: req.user._id,
      'customerRating.rating': { $exists: true }
    })
    .populate('customer', 'name profileImage')
    .select('customerRating createdAt')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Booking.countDocuments({
      driver: req.user._id,
      'customerRating.rating': { $exists: true }
    });

    const ratings = bookings.map(booking => ({
      id: booking._id,
      customer: booking.customer,
      rating: booking.customerRating.rating,
      review: booking.customerRating.review,
      ratedAt: booking.customerRating.ratedAt
    }));

    res.json({
      status: 'success',
      data: {
        ratings,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch ratings'
    });
  }
});

// @route   GET /api/drivers/statistics
// @desc    Get driver statistics
// @access  Private (Driver)
router.get('/statistics', requireDriver, async (req, res) => {
  try {
    const driver = await User.findById(req.user._id).select('driverProfile');
    
    const totalBookings = await Booking.countDocuments({
      driver: req.user._id,
      status: 'completed'
    });

    const totalEarnings = await Booking.aggregate([
      {
        $match: {
          driver: req.user._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$fare.total' }
        }
      }
    ]);

    const averageRating = driver.driverProfile.rating.average;
    const totalRatings = driver.driverProfile.rating.count;

    res.json({
      status: 'success',
      data: {
        totalBookings,
        totalEarnings: totalEarnings[0]?.total || 0,
        averageRating,
        totalRatings,
        isKYCVerified: driver.driverProfile.isKYCVerified,
        isAvailable: driver.driverProfile.isAvailable
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;
