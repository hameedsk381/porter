const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { calculateFare, findNearbyDrivers } = require('../services/bookingService');
const { requireCustomer, requireDriver } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/bookings/estimate
// @desc    Get fare estimate for a booking
// @access  Private
router.post('/estimate', [
  body('pickup').isObject().withMessage('Pickup location required'),
  body('drop').isObject().withMessage('Drop location required'),
  body('vehicleType').isIn(['2-wheeler', 'mini-truck', 'tempo', '3-wheeler', 'large-truck']).withMessage('Valid vehicle type required')
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

    const { pickup, drop, vehicleType, requirements = {} } = req.body;

    // Calculate fare
    const fareEstimate = await calculateFare(pickup, drop, vehicleType, requirements);

    res.json({
      status: 'success',
      data: fareEstimate
    });
  } catch (error) {
    console.error('Fare estimate error:', error);
    res.status(500).json({
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

    const { pickup, drop, vehicleType, paymentMethod, requirements = {} } = req.body;

    // Calculate fare
    const fareEstimate = await calculateFare(pickup, drop, vehicleType, requirements);

    // Create booking
    const booking = new Booking({
      customer: req.user._id,
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

    // Find nearby drivers
    const nearbyDrivers = await findNearbyDrivers(pickup.coordinates, vehicleType);

    // Broadcast booking to nearby drivers
    const io = req.app.get('io');
    nearbyDrivers.forEach(driver => {
      io.to(driver._id.toString()).emit('new-booking', {
        bookingId: booking._id,
        booking: booking,
        customer: req.user
      });
    });

    res.status(201).json({
      status: 'success',
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create booking'
    });
  }
});

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};

    // Filter by user role
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (req.user.role === 'driver') {
      query.driver = req.user._id;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'name phone profileImage')
      .populate('driver', 'name phone profileImage driverProfile.vehicleDetails')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
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
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch bookings'
    });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get specific booking details
// @access  Private
router.get('/:id', async (req, res) => {
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
    const hasAccess = booking.customer._id.toString() === req.user._id.toString() ||
                     booking.driver?._id.toString() === req.user._id.toString() ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    res.json({
      status: 'success',
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch booking'
    });
  }
});

// @route   PUT /api/bookings/:id/accept
// @desc    Driver accepts a booking
// @access  Private (Driver)
router.put('/:id/accept', requireDriver, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Booking is no longer available'
      });
    }

    // Check if driver is available
    if (!req.user.driverProfile.isAvailable) {
      return res.status(400).json({
        status: 'error',
        message: 'Driver is not available'
      });
    }

    // Assign driver to booking
    booking.driver = req.user._id;
    booking.status = 'confirmed';
    booking.driverAssignment.assignedAt = new Date();
    booking.driverAssignment.acceptedAt = new Date();

    await booking.save();
    await booking.addTimelineEntry('driver_assigned', null, `Driver ${req.user.name} accepted the booking`);

    // Notify customer
    const io = req.app.get('io');
    io.to(booking.customer.toString()).emit('booking-update', {
      bookingId: booking._id,
      status: 'confirmed',
      driver: req.user
    });

    res.json({
      status: 'success',
      message: 'Booking accepted successfully',
      data: booking
    });
  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to accept booking'
    });
  }
});

// @route   PUT /api/bookings/:id/start
// @desc    Driver starts the trip
// @access  Private (Driver)
router.put('/:id/start', requireDriver, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    if (booking.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        status: 'error',
        message: 'Booking is not in confirmed status'
      });
    }

    booking.status = 'in_progress';
    booking.driverAssignment.startedAt = new Date();

    await booking.save();
    await booking.addTimelineEntry('trip_started', null, 'Trip started');

    // Notify customer
    const io = req.app.get('io');
    io.to(booking.customer.toString()).emit('booking-update', {
      bookingId: booking._id,
      status: 'in_progress'
    });

    res.json({
      status: 'success',
      message: 'Trip started successfully',
      data: booking
    });
  } catch (error) {
    console.error('Start trip error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to start trip'
    });
  }
});

// @route   PUT /api/bookings/:id/complete
// @desc    Driver completes the trip
// @access  Private (Driver)
router.put('/:id/complete', requireDriver, [
  body('finalFare').optional().isNumeric().withMessage('Final fare must be a number')
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

    const { finalFare } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    if (booking.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    if (booking.status !== 'in_progress') {
      return res.status(400).json({
        status: 'error',
        message: 'Trip is not in progress'
      });
    }

    booking.status = 'completed';
    booking.driverAssignment.completedAt = new Date();

    // Update final fare if provided
    if (finalFare) {
      booking.fare.total = finalFare;
    }

    await booking.save();
    await booking.addTimelineEntry('trip_completed', null, 'Trip completed successfully');

    // Notify customer
    const io = req.app.get('io');
    io.to(booking.customer.toString()).emit('booking-update', {
      bookingId: booking._id,
      status: 'completed'
    });

    res.json({
      status: 'success',
      message: 'Trip completed successfully',
      data: booking
    });
  } catch (error) {
    console.error('Complete trip error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to complete trip'
    });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put('/:id/cancel', [
  body('reason').optional().isString().withMessage('Reason must be a string')
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

    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Check if user can cancel this booking
    const canCancel = booking.customer.toString() === req.user._id.toString() ||
                     booking.driver?.toString() === req.user._id.toString() ||
                     req.user.role === 'admin';

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
      cancelledBy: req.user.role,
      reason,
      cancelledAt: new Date()
    };

    await booking.save();
    await booking.addTimelineEntry('booking_cancelled', null, `Booking cancelled by ${req.user.role}`);

    // Notify relevant parties
    const io = req.app.get('io');
    if (booking.customer.toString() !== req.user._id.toString()) {
      io.to(booking.customer.toString()).emit('booking-update', {
        bookingId: booking._id,
        status: 'cancelled'
      });
    }
    if (booking.driver && booking.driver.toString() !== req.user._id.toString()) {
      io.to(booking.driver.toString()).emit('booking-update', {
        bookingId: booking._id,
        status: 'cancelled'
      });
    }

    res.json({
      status: 'success',
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel booking'
    });
  }
});

module.exports = router;
