import express, { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User, { IUser } from '../models/User';
import Booking from '../models/Booking';
import Payment from '../models/Payment';
import { requireAdmin } from '../middleware/auth';

const router: Router = express.Router();

interface AuthRequest extends Request {
  user?: IUser;
}

// Apply admin middleware to all routes
router.use(requireAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'month' }: any = req.query;
    
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
      default:
        break;
    }

    // Get statistics
    const [
      totalUsers,
      totalDrivers,
      totalBookings,
      completedBookings,
      totalRevenue,
      activeDrivers,
      pendingKYC
    ] = await Promise.all([
      User.countDocuments({ role: 'customer', ...dateFilter }),
      User.countDocuments({ role: 'driver', ...dateFilter }),
      Booking.countDocuments(dateFilter),
      Booking.countDocuments({ status: 'completed', ...dateFilter }),
      Payment.aggregate([
        { $match: { status: 'completed', ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      User.countDocuments({ 
        role: 'driver', 
        'driverProfile.isAvailable': true,
        'driverProfile.isKYCVerified': true 
      }),
      User.countDocuments({ 
        role: 'driver', 
        'driverProfile.isKYCVerified': false 
      })
    ]);

    // Get recent bookings
    const recentBookings: any = await Booking.find(dateFilter)
      .populate('customer', 'name phone')
      .populate('driver', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get top performing drivers
    const topDrivers: any = await Booking.aggregate([
      { $match: { status: 'completed', ...dateFilter } },
      { $group: { 
        _id: '$driver', 
        totalEarnings: { $sum: '$fare.total' },
        totalTrips: { $sum: 1 }
      }},
      { $sort: { totalEarnings: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'driver'
        }
      },
      { $unwind: '$driver' },
      {
        $project: {
          driver: { name: 1, phone: 1, profileImage: 1 },
          totalEarnings: 1,
          totalTrips: 1
        }
      }
    ]);

    return res.json({
      status: 'success',
      data: {
        overview: {
          totalUsers,
          totalDrivers,
          totalBookings,
          completedBookings,
          totalRevenue: totalRevenue[0]?.total || 0,
          activeDrivers,
          pendingKYC
        },
        recentBookings,
        topDrivers
      }
    });
  } catch (error: any) {
    console.error('Get dashboard error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private (Admin)
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    }: any = req.query;

    const query: any = {};
    
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users: any = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    return res.json({
      status: 'success',
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

// @route   GET /api/admin/drivers
// @desc    Get all drivers with KYC status
// @access  Private (Admin)
router.get('/drivers', async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      kycStatus,
      availability,
      search
    }: any = req.query;

    const query: any = { role: 'driver' };
    
    if (kycStatus === 'verified') query['driverProfile.isKYCVerified'] = true;
    if (kycStatus === 'pending') query['driverProfile.isKYCVerified'] = false;
    if (availability === 'online') query['driverProfile.isAvailable'] = true;
    if (availability === 'offline') query['driverProfile.isAvailable'] = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'driverProfile.licenseNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const drivers: any = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    return res.json({
      status: 'success',
      data: {
        drivers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error: any) {
    console.error('Get drivers error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch drivers'
    });
  }
});

// @route   PUT /api/admin/drivers/:id/kyc
// @desc    Approve or reject driver KYC
// @access  Private (Admin)
router.put('/drivers/:id/kyc', [
  body('status').isIn(['approved', 'rejected']).withMessage('Valid status required'),
  body('reason').optional().isString().withMessage('Reason must be a string')
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

    const { status, reason } = req.body;
    const driverId = req.params.id;

    const driver: any = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({
        status: 'error',
        message: 'Driver not found'
      });
    }

    if (!driver.driverProfile) {
      driver.driverProfile = {
        isKYCVerified: false,
        isAvailable: false,
        rating: { average: 0, count: 0 },
        earnings: { total: 0, pending: 0, withdrawn: 0 }
      };
    }
    
    driver.driverProfile.isKYCVerified = status === 'approved';
    
    if (reason) {
      (driver.driverProfile as any).kycReview = {
        status,
        reason,
        reviewedAt: new Date(),
        reviewedBy: req.user?._id
      };
    }

    await driver.save();

    return res.json({
      status: 'success',
      message: `Driver KYC ${status} successfully`,
      data: driver.driverProfile
    });
  } catch (error: any) {
    console.error('Update driver KYC error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update driver KYC'
    });
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all bookings with filters
// @access  Private (Admin)
router.get('/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      vehicleType,
      startDate,
      endDate,
      search
    }: any = req.query;

    const query: any = {};
    
    if (status) query.status = status;
    if (vehicleType) query.vehicleType = vehicleType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { 'pickup.address': { $regex: search, $options: 'i' } },
        { 'drop.address': { $regex: search, $options: 'i' } }
      ];
    }

    const bookings: any = await Booking.find(query)
      .populate('customer', 'name phone')
      .populate('driver', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    return res.json({
      status: 'success',
      data: {
        bookings,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error: any) {
    console.error('Get bookings error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch bookings'
    });
  }
});

// @route   GET /api/admin/payments
// @desc    Get payment analytics
// @access  Private (Admin)
router.get('/payments', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, period = 'month' }: any = req.query;
    
    let dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Mock payment stats since we don't have the actual method
    const paymentStats: any = [{
      totalAmount: 0,
      totalTransactions: 0,
      averageAmount: 0,
      platformCommission: 0,
      driverPayout: 0
    }];

    const paymentMethods: any = await Payment.aggregate([
      { $match: { status: 'completed', ...dateFilter } },
      { $group: { _id: '$method', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    const recentPayments: any = await Payment.find({ status: 'completed', ...dateFilter })
      .populate('customer', 'name phone')
      .populate('booking', 'bookingId')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      status: 'success',
      data: {
        stats: paymentStats[0] || {
          totalAmount: 0,
          totalTransactions: 0,
          averageAmount: 0,
          platformCommission: 0,
          driverPayout: 0
        },
        paymentMethods,
        recentPayments
      }
    });
  } catch (error: any) {
    console.error('Get payments error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payment data'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (active/inactive)
// @access  Private (Admin)
router.put('/users/:id/status', [
  body('isActive').isBoolean().withMessage('Active status must be boolean')
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

    const { isActive } = req.body;
    const userId = req.params.id;

    const user: any = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    return res.json({
      status: 'success',
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error: any) {
    console.error('Update user status error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update user status'
    });
  }
});

export default router;