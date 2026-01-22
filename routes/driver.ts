import express, { Request, Response, NextFunction, Router } from 'express';
import { protect, restrictTo } from '../middleware/auth';
import {
  updateDriverLocation,
  setDriverAvailability,
  assignDriverToBooking,
  releaseDriver,
} from '../services/matchingService';
import Booking from '../models/Booking';
import User from '../models/User';
import { io } from '../server';

const router: Router = express.Router();

// Protect all routes - must be authenticated driver
router.use(protect);
router.use(restrictTo('driver'));

/**
 * @route   POST /api/driver/location
 * @desc    Update driver's current location
 * @access  Private (Driver only)
 */
router.post('/location', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const driverId = (req.user as any)._id.toString();
    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates',
      });
    }

    // Update location in Redis GEO index
    await updateDriverLocation(driverId, latitude, longitude);

    // Update location in database
    const user = await User.findById(driverId);
    if (user && user.role === 'driver' && user.driverProfile) {
      if (!user.driverProfile.currentLocation) {
        user.driverProfile.currentLocation = {} as any;
      }
      user.driverProfile.currentLocation = {
        coordinates: [longitude, latitude],
        address: address || '',
        lastUpdated: new Date(),
      };
      await user.save();
    }

    // Emit location update to any active bookings
    const activeBooking = await Booking.findOne({
      driver: driverId,
      status: { $in: ['confirmed', 'in_progress'] },
    });

    if (activeBooking) {
      // Send to customer tracking this booking
      io.to(`booking:${activeBooking._id}`).emit('driver:location_update', {
        bookingId: activeBooking._id,
        location: {
          latitude,
          longitude,
          address,
        },
        timestamp: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        latitude,
        longitude,
        address,
      },
    });
  } catch (error: any) {
    console.error('Error updating driver location:', error.message);
    next(error);
  }
});

/**
 * @route   POST /api/driver/availability
 * @desc    Toggle driver availability (online/offline)
 * @access  Private (Driver only)
 */
router.post('/availability', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const driverId = (req.user as any)._id.toString();
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAvailable must be a boolean',
      });
    }

    // Check if driver has active bookings
    if (!isAvailable) {
      const activeBooking = await Booking.findOne({
        driver: driverId,
        status: { $in: ['confirmed', 'in_progress'] },
      });

      if (activeBooking) {
        return res.status(400).json({
          success: false,
          message: 'Cannot go offline with active bookings',
        });
      }
    }

    // Update availability
    await setDriverAvailability(driverId, isAvailable);

    res.status(200).json({
      success: true,
      message: `Driver is now ${isAvailable ? 'online' : 'offline'}`,
      data: {
        isAvailable,
      },
    });
  } catch (error: any) {
    console.error('Error updating driver availability:', error.message);
    next(error);
  }
});

/**
 * @route   GET /api/driver/bookings/pending
 * @desc    Get pending booking requests sent to this driver
 * @access  Private (Driver only)
 */
router.get('/bookings/pending', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const driverId = (req.user as any)._id.toString();

    // Find bookings where this driver was notified and still pending
    const bookings = await Booking.find({
      notifiedDrivers: driverId,
      status: 'searching',
    })
      .populate('customer', 'name phone profileImage')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    console.error('Error fetching pending bookings:', error.message);
    next(error);
  }
});

/**
 * @route   POST /api/driver/bookings/:id/accept
 * @desc    Accept a booking request
 * @access  Private (Driver only)
 */
router.post('/bookings/:id/accept', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const driverId = (req.user as any)._id.toString();
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if driver was notified about this booking
    if (!booking.notifiedDrivers || !booking.notifiedDrivers.includes(driverId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to accept this booking',
      });
    }

    // Check if booking is still available
    if (booking.status !== 'searching') {
      return res.status(400).json({
        success: false,
        message: 'Booking is no longer available',
      });
    }

    // Assign driver to booking
    const assigned = await assignDriverToBooking(bookingId, driverId);

    if (!assigned) {
      return res.status(500).json({
        success: false,
        message: 'Failed to assign booking',
      });
    }

    // Get updated booking with customer details
    const updatedBooking = await Booking.findById(bookingId)
      .populate('customer', 'name phone profileImage')
      .populate('driver', 'name phone driverProfile.vehicleDetails driverProfile.rating');

    res.status(200).json({
      success: true,
      message: 'Booking accepted successfully',
      data: updatedBooking,
    });
  } catch (error: any) {
    console.error('Error accepting booking:', error.message);
    next(error);
  }
});

/**
 * @route   POST /api/driver/bookings/:id/reject
 * @desc    Reject a booking request
 * @access  Private (Driver only)
 */
router.post('/bookings/:id/reject', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const driverId = (req.user as any)._id.toString();
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Remove driver from notified list
    if (booking.notifiedDrivers) {
      booking.notifiedDrivers = booking.notifiedDrivers.filter(id => id !== driverId);
      await booking.save();
    }

    res.status(200).json({
      success: true,
      message: 'Booking rejected',
    });
  } catch (error: any) {
    console.error('Error rejecting booking:', error.message);
    next(error);
  }
});

/**
 * @route   POST /api/driver/bookings/:id/start
 * @desc    Start a trip (driver reached pickup and starting)
 * @access  Private (Driver only)
 */
router.post('/bookings/:id/start', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const driverId = (req.user as any)._id.toString();
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.driver?.toString() !== driverId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this booking',
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be started',
      });
    }

    // Update booking status
    booking.status = 'in_progress';
    booking.driverAssignment.startedAt = new Date();
    await booking.addTimelineEntry('in_progress', undefined, 'Trip started');

    // Notify customer
    io.to(`user:${booking.customer}`).emit('booking:started', {
      bookingId: booking._id,
      message: 'Your trip has started',
    });

    res.status(200).json({
      success: true,
      message: 'Trip started successfully',
      data: booking,
    });
  } catch (error: any) {
    console.error('Error starting trip:', error.message);
    next(error);
  }
});

/**
 * @route   POST /api/driver/bookings/:id/complete
 * @desc    Complete a trip (reached destination)
 * @access  Private (Driver only)
 */
router.post('/bookings/:id/complete', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const driverId = (req.user as any)._id.toString();
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.driver?.toString() !== driverId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this booking',
      });
    }

    if (booking.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not in progress',
      });
    }

    // Update booking status
    booking.status = 'completed';
    booking.driverAssignment.completedAt = new Date();
    await booking.addTimelineEntry('completed', undefined, 'Trip completed');

    // Update driver earnings
    const driver = await User.findById(driverId);
    if (driver && driver.driverProfile) {
      const driverEarning = booking.fare.total * 0.8; // 80% goes to driver
      driver.driverProfile.earnings = driver.driverProfile.earnings || { total: 0, pending: 0, withdrawn: 0 };
      driver.driverProfile.earnings.total += driverEarning;
      driver.driverProfile.earnings.pending += driverEarning;
      await driver.save();
    }

    // Release driver (make available again)
    await releaseDriver(driverId);

    // Notify customer
    io.to(`user:${booking.customer}`).emit('booking:completed', {
      bookingId: booking._id,
      message: 'Your trip has been completed',
      fare: booking.fare,
    });

    res.status(200).json({
      success: true,
      message: 'Trip completed successfully',
      data: booking,
    });
  } catch (error: any) {
    console.error('Error completing trip:', error.message);
    next(error);
  }
});

/**
 * @route   GET /api/driver/bookings/active
 * @desc    Get driver's active booking
 * @access  Private (Driver only)
 */
router.get('/bookings/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const driverId = req.user!._id;

    const activeBooking = await Booking.findOne({
      driver: driverId,
      status: { $in: ['confirmed', 'in_progress'] },
    }).populate('customer', 'name phone profileImage');

    res.status(200).json({
      success: true,
      data: activeBooking,
    });
  } catch (error: any) {
    console.error('Error fetching active booking:', error.message);
    next(error);
  }
});

/**
 * @route   GET /api/driver/bookings/history
 * @desc    Get driver's booking history
 * @access  Private (Driver only)
 */
router.get('/bookings/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const driverId = req.user!._id;
    const { page = 1, limit = 10, status } = req.query;

    const query: any = { driver: driverId };
    
    if (status && status !== 'all') {
      query.status = status;
    } else {
      query.status = { $in: ['completed', 'cancelled'] };
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'name phone profileImage')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching booking history:', error.message);
    next(error);
  }
});

/**
 * @route   GET /api/driver/earnings
 * @desc    Get driver's earnings summary
 * @access  Private (Driver only)
 */
router.get('/earnings', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const driverId = req.user!._id;

    const driver = await User.findById(driverId);

    if (!driver || !driver.driverProfile) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found',
      });
    }

    // Get earnings breakdown
    const earnings = driver.driverProfile.earnings || { total: 0, pending: 0, withdrawn: 0 };

    // Get recent completed bookings
    const recentBookings = await Booking.find({
      driver: driverId,
      status: 'completed',
    })
      .sort({ 'driverAssignment.completedAt': -1 })
      .limit(10)
      .select('bookingId fare.total driverAssignment.completedAt');

    res.status(200).json({
      success: true,
      data: {
        earnings,
        recentBookings,
      },
    });
  } catch (error: any) {
    console.error('Error fetching earnings:', error.message);
    next(error);
  }
});

export default router;
