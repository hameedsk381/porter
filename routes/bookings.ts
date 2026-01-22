import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import Booking, { IBooking } from '../models/Booking';
import User, { IUser } from '../models/User';
import { calculateFare, findNearbyDrivers } from '../services/bookingService';
import { requireCustomer, requireDriver } from '../middleware/auth';
import { autoMatchBooking } from '../services/matchingService';

const router: Router = Router();

// @route   POST /api/bookings/estimate
// @desc    Get fare estimate for a booking
// @access  Private
router.post('/estimate', [
  body('pickup').isObject().withMessage('Pickup location required'),
  body('drop').isObject().withMessage('Drop location required'),
  body('vehicleType').isIn(['2-wheeler', 'mini-truck', 'tempo', '3-wheeler', 'large-truck']).withMessage('Valid vehicle type required')
] as ValidationChain[], async (req: Request, res: Response): Promise<Response> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { pickup, drop, vehicleType, requirements = {} } = req.body;

    // Calculate fare
    const fareEstimate = await calculateFare(pickup, drop, vehicleType, requirements);

    return res.json({
      status: 'success',
      data: fareEstimate
    });
  } catch (error: any) {
    console.error('Fare estimate error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to calculate fare estimate'
    });
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private (Customer)
router.post('/', requireCustomer, [
  body('pickup').isObject().withMessage('Pickup location required'),
  body('drop').isObject().withMessage('Drop location required'),
  body('vehicleType').isIn(['2-wheeler', 'mini-truck', 'tempo', '3-wheeler', 'large-truck']).withMessage('Valid vehicle type required'),
  body('paymentMethod').isIn(['upi', 'card', 'netbanking', 'wallet', 'cod']).withMessage('Valid payment method required')
] as ValidationChain[], async (req: Request, res: Response): Promise<Response> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { pickup, drop, vehicleType, paymentMethod, requirements = {} } = req.body;

    // Calculate fare
    const fareEstimate = await calculateFare(pickup, drop, vehicleType, requirements);

    // Create booking
    const booking = new Booking({
      customer: (req as any).user._id,
      vehicleType,
      pickup,
      drop,
      distance: fareEstimate.distance,
      estimatedDuration: fareEstimate.duration,
      fare: fareEstimate.fare,
      payment: {
        method: paymentMethod,
        status: 'pending'
      },
      requirements
    });

    await booking.save();

    // Add timeline entry
    await booking.addTimelineEntry('booking_created', pickup, 'Booking created');

    // Auto-match booking with nearby drivers using the matching service
    const bookingId = String(booking._id);
    await autoMatchBooking(bookingId);

    return res.status(201).json({
      status: 'success',
      message: 'Booking created successfully. Searching for nearby drivers...',
      data: booking
    });
  } catch (error: any) {
    console.error('Create booking error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create booking'
    });
  }
});

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query: any = {};

    // Filter by user role
    if ((req as any).user.role === 'customer') {
      query.customer = (req as any).user._id;
    } else if ((req as any).user.role === 'driver') {
      query.driver = (req as any).user._id;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);

    const bookings = await Booking.find(query)
      .populate('customer', 'name phone profileImage')
      .populate('driver', 'name phone profileImage driverProfile.vehicleDetails')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await Booking.countDocuments(query);

    return res.json({
      status: 'success',
      data: {
        bookings,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
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

// @route   GET /api/bookings/:id
// @desc    Get specific booking details
// @access  Private
router.get('/:id', async (req: Request, res: Response): Promise<Response> => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name phone profileImage')
      .populate('driver', 'name phone profileImage driverProfile.vehicleDetails');

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Check if user has access to this booking
    const hasAccess = booking.customer.toString() === (req as any).user._id.toString() ||
      (booking.driver && booking.driver.toString() === (req as any).user._id.toString()) ||
      (req as any).user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    return res.json({
      status: 'success',
      data: booking
    });
  } catch (error: any) {
    console.error('Get booking error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch booking'
    });
  }
});

// Driver actions (accept, start, complete) are handled in /api/driver routes

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put('/:id/cancel', [
  body('reason').optional().isString().withMessage('Reason must be a string')
] as ValidationChain[], async (req: Request, res: Response): Promise<Response> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Check if user can cancel this booking
    const canCancel = booking.customer.toString() === (req as any).user._id.toString() ||
      (booking.driver && booking.driver.toString() === (req as any).user._id.toString()) ||
      (req as any).user.role === 'admin';

    if (!canCancel) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Booking cannot be cancelled'
      });
    }

    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledBy: (req as any).user.role,
      reason,
      cancelledAt: new Date()
    };

    await booking.save();
    await booking.addTimelineEntry('booking_cancelled', null, `Booking cancelled by ${(req as any).user.role}`);

    // Notify relevant parties
    const io = (req as any).app.get('io');
    if (booking.customer.toString() !== (req as any).user._id.toString()) {
      io.to(booking.customer.toString()).emit('booking:cancelled', {
        bookingId: booking._id,
        reason: reason || 'Cancelled by user'
      });
      io.to(booking.customer.toString()).emit('booking-update', {
        bookingId: booking._id,
        status: 'cancelled'
      });
    }
    if (booking.driver && booking.driver.toString() !== (req as any).user._id.toString()) {
      io.to(booking.driver.toString()).emit('booking-update', {
        bookingId: booking._id,
        status: 'cancelled'
      });
    }

    return res.json({
      status: 'success',
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to cancel booking'
    });
  }
});

export default router;