import express, { Router, Request, Response, Application } from 'express';
import { body, validationResult } from 'express-validator';
import User, { IUser } from '../models/User';
import Booking from '../models/Booking';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { requireDriver } from '../middleware/auth';

const router: Router = express.Router();

interface AuthRequest extends Request {
  user?: IUser;
}

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
], async (req: AuthRequest, res: Response) => {
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
    const user = await User.findById(req.user?._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Initialize driverProfile if it doesn't exist
    if (!user.driverProfile) {
      user.driverProfile = {
        isKYCVerified: false,
        isAvailable: false,
        rating: { average: 0, count: 0 },
        earnings: { total: 0, pending: 0, withdrawn: 0 }
      };
    }
    
    // Update driver profile fields
    user.driverProfile.licenseNumber = licenseNumber;
    user.driverProfile.licenseExpiry = new Date(licenseExpiry);
    user.driverProfile.aadhaarNumber = aadhaarNumber;
    user.driverProfile.vehicleDetails = {
      type: vehicleDetails.type,
      number: vehicleDetails.number,
      model: vehicleDetails.model,
      year: vehicleDetails.year,
      color: vehicleDetails.color,
      capacity: vehicleDetails.capacity
    };
    user.driverProfile.documents = documents || {
      license: '',
      aadhaar: '',
      rc: '',
      insurance: ''
    };
    user.driverProfile.isKYCVerified = false; // Will be verified by admin

    await user.save();

    return res.json({
      status: 'success',
      message: 'KYC documents submitted successfully. Pending admin verification.',
      data: user.driverProfile
    });
  } catch (error: any) {
    console.error('KYC submission error:', error);
    return res.status(500).json({
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
], async (req: AuthRequest, res: Response) => {
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

    const user = await User.findById(req.user?._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Initialize driverProfile if it doesn't exist
    if (!user.driverProfile) {
      user.driverProfile = {
        isKYCVerified: false,
        isAvailable: false,
        rating: { average: 0, count: 0 },
        earnings: { total: 0, pending: 0, withdrawn: 0 }
      };
    }
    
    // Initialize documents if they don't exist
    if (!user.driverProfile.documents) {
      user.driverProfile.documents = {
        license: '',
        aadhaar: '',
        rc: '',
        insurance: ''
      };
    }

    // Update the specific document type
    switch (documentType) {
      case 'license':
        user.driverProfile.documents.license = imageUrl;
        break;
      case 'aadhaar':
        user.driverProfile.documents.aadhaar = imageUrl;
        break;
      case 'rc':
        user.driverProfile.documents.rc = imageUrl;
        break;
      case 'insurance':
        user.driverProfile.documents.insurance = imageUrl;
        break;
    }
    
    await user.save();

    return res.json({
      status: 'success',
      message: 'Document uploaded successfully',
      data: {
        documentType,
        imageUrl
      }
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    return res.status(500).json({
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
], async (req: AuthRequest, res: Response) => {
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
    if (isAvailable && !req.user?.driverProfile?.isKYCVerified) {
      return res.status(400).json({
        status: 'error',
        message: 'KYC verification required to go online'
      });
    }

    const user = await User.findById(req.user?._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Initialize driverProfile if it doesn't exist
    if (!user.driverProfile) {
      user.driverProfile = {
        isKYCVerified: false,
        isAvailable: false,
        rating: { average: 0, count: 0 },
        earnings: { total: 0, pending: 0, withdrawn: 0 }
      };
    }
    
    user.driverProfile.isAvailable = isAvailable;

    // Update location if provided
    if (location && location.coordinates) {
      if (!user.driverProfile.currentLocation) {
        user.driverProfile.currentLocation = {
          coordinates: [0, 0],
          address: '',
          lastUpdated: new Date()
        };
      }
      user.driverProfile.currentLocation.coordinates = [location.coordinates.lng, location.coordinates.lat];
      user.driverProfile.currentLocation.address = location.address || '';
      user.driverProfile.currentLocation.lastUpdated = new Date();
    }

    await user.save();

    return res.json({
      status: 'success',
      message: `Driver is now ${isAvailable ? 'online' : 'offline'}`,
      data: {
        isAvailable: user.driverProfile.isAvailable,
        currentLocation: user.driverProfile.currentLocation
      }
    });
  } catch (error: any) {
    console.error('Toggle availability error:', error);
    return res.status(500).json({
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
], async (req: AuthRequest, res: Response) => {
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

    const user = await User.findById(req.user?._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Initialize driverProfile if it doesn't exist
    if (!user.driverProfile) {
      user.driverProfile = {
        isKYCVerified: false,
        isAvailable: false,
        rating: { average: 0, count: 0 },
        earnings: { total: 0, pending: 0, withdrawn: 0 }
      };
    }
    
    // Initialize currentLocation if it doesn't exist
    if (!user.driverProfile.currentLocation) {
      user.driverProfile.currentLocation = {
        coordinates: [0, 0],
        address: '',
        lastUpdated: new Date()
      };
    }
    
    user.driverProfile.currentLocation.coordinates = [coordinates.lng, coordinates.lat];
    user.driverProfile.currentLocation.address = address || '';
    user.driverProfile.currentLocation.lastUpdated = new Date();

    await user.save();

    // Emit location update to connected clients
    const io = (req as any).app?.get('io');
    if (io) {
      io.emit('driver-location-update', {
        driverId: user._id,
        location: user.driverProfile.currentLocation
      });
    }

    return res.json({
      status: 'success',
      message: 'Location updated successfully',
      data: user.driverProfile.currentLocation
    });
  } catch (error: any) {
    console.error('Update location error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update location'
    });
  }
});

// @route   GET /api/drivers/earnings
// @desc    Get driver earnings
// @access  Private (Driver)
router.get('/earnings', requireDriver, async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'month', startDate, endDate }: any = req.query;
    
    let dateFilter: any = {};
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

    const bookings: any = await Booking.find({
      driver: req.user?._id,
      status: 'completed',
      ...dateFilter
    }).select('fare payment createdAt');

    const totalEarnings = bookings.reduce((sum: number, booking: any) => {
      return sum + (booking.fare?.total || 0);
    }, 0);

    const totalTrips = bookings.length;
    const averageEarnings = totalTrips > 0 ? totalEarnings / totalTrips : 0;

    return res.json({
      status: 'success',
      data: {
        period,
        totalEarnings,
        totalTrips,
        averageEarnings: Math.round(averageEarnings * 100) / 100,
        bookings: bookings.map((booking: any) => ({
          id: booking._id,
          fare: booking.fare?.total,
          createdAt: booking.createdAt
        }))
      }
    });
  } catch (error: any) {
    console.error('Get earnings error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch earnings'
    });
  }
});

// @route   GET /api/drivers/ratings
// @desc    Get driver ratings and reviews
// @access  Private (Driver)
router.get('/ratings', requireDriver, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10 }: any = req.query;

    const bookings: any = await Booking.find({
      driver: req.user?._id,
      'customerRating.rating': { $exists: true }
    })
    .populate('customer', 'name profileImage')
    .select('customerRating createdAt')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Booking.countDocuments({
      driver: req.user?._id,
      'customerRating.rating': { $exists: true }
    });

    const ratings = bookings.map((booking: any) => ({
      id: booking._id,
      customer: booking.customer,
      rating: booking.customerRating?.rating,
      review: booking.customerRating?.review,
      ratedAt: booking.customerRating?.ratedAt
    }));

    return res.json({
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
  } catch (error: any) {
    console.error('Get ratings error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch ratings'
    });
  }
});

// @route   GET /api/drivers/statistics
// @desc    Get driver statistics
// @access  Private (Driver)
router.get('/statistics', requireDriver, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('driverProfile');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    const totalBookings = await Booking.countDocuments({
      driver: req.user?._id,
      status: 'completed'
    });

    const totalEarningsResult: any = await Booking.aggregate([
      {
        $match: {
          driver: req.user?._id,
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

    const averageRating = user.driverProfile?.rating?.average || 0;
    const totalRatings = user.driverProfile?.rating?.count || 0;

    return res.json({
      status: 'success',
      data: {
        totalBookings,
        totalEarnings: totalEarningsResult[0]?.total || 0,
        averageRating,
        totalRatings,
        isKYCVerified: user.driverProfile?.isKYCVerified || false,
        isAvailable: user.driverProfile?.isAvailable || false
      }
    });
  } catch (error: any) {
    console.error('Get statistics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch statistics'
    });
  }
});

export default router;