const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { createRazorpayOrder, verifyRazorpayPayment } = require('../services/razorpayService');
const { createStripePaymentIntent, confirmStripePayment } = require('../services/stripeService');
const router = express.Router();

// @route   POST /api/payments/initiate
// @desc    Initiate payment
// @access  Private
router.post('/initiate', [
  body('bookingId').isMongoId().withMessage('Valid booking ID required'),
  body('method').isIn(['upi', 'card', 'netbanking', 'wallet', 'cod']).withMessage('Valid payment method required')
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

    const { bookingId, method } = req.body;

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Check if user has access to this booking
    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Check if booking is in valid state for payment
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Booking is not in valid state for payment'
      });
    }

    // Handle COD
    if (method === 'cod') {
      const payment = new Payment({
        booking: bookingId,
        customer: req.user._id,
        amount: booking.fare.total,
        method: 'cod',
        gateway: 'cod',
        status: 'completed'
      });

      await payment.save();

      // Update booking payment status
      booking.payment.status = 'completed';
      booking.payment.transactionId = payment.paymentId;
      await booking.save();

      return res.json({
        status: 'success',
        message: 'Payment initiated successfully',
        data: {
          paymentId: payment.paymentId,
          method: 'cod',
          status: 'completed'
        }
      });
    }

    // Create payment record
    const payment = new Payment({
      booking: bookingId,
      customer: req.user._id,
      amount: booking.fare.total,
      method: method,
      gateway: method === 'upi' || method === 'card' || method === 'netbanking' ? 'razorpay' : 'stripe'
    });

    await payment.save();

    let paymentData = {};

    // Initiate payment based on method
    if (method === 'upi' || method === 'card' || method === 'netbanking') {
      // Razorpay
      const razorpayOrder = await createRazorpayOrder({
        amount: booking.fare.total * 100, // Convert to paise
        currency: 'INR',
        receipt: payment.paymentId
      });

      payment.gatewayDetails.razorpayOrderId = razorpayOrder.id;
      await payment.save();

      paymentData = {
        paymentId: payment.paymentId,
        gateway: 'razorpay',
        orderId: razorpayOrder.id,
        amount: booking.fare.total,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID
      };
    } else {
      // Stripe
      const stripePaymentIntent = await createStripePaymentIntent({
        amount: booking.fare.total * 100, // Convert to cents
        currency: 'inr',
        metadata: {
          paymentId: payment.paymentId,
          bookingId: bookingId
        }
      });

      payment.gatewayDetails.stripePaymentIntentId = stripePaymentIntent.id;
      await payment.save();

      paymentData = {
        paymentId: payment.paymentId,
        gateway: 'stripe',
        clientSecret: stripePaymentIntent.client_secret,
        amount: booking.fare.total,
        currency: 'inr'
      };
    }

    res.json({
      status: 'success',
      message: 'Payment initiated successfully',
      data: paymentData
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to initiate payment'
    });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify payment
// @access  Private
router.post('/verify', [
  body('paymentId').notEmpty().withMessage('Payment ID required'),
  body('gatewayResponse').isObject().withMessage('Gateway response required')
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

    const { paymentId, gatewayResponse } = req.body;

    // Find payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    // Check if user has access to this payment
    if (payment.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    let isVerified = false;

    // Verify payment based on gateway
    if (payment.gateway === 'razorpay') {
      isVerified = await verifyRazorpayPayment(gatewayResponse);
      
      if (isVerified) {
        payment.gatewayDetails.razorpayPaymentId = gatewayResponse.razorpay_payment_id;
        payment.gatewayDetails.razorpaySignature = gatewayResponse.razorpay_signature;
      }
    } else if (payment.gateway === 'stripe') {
      isVerified = await confirmStripePayment(gatewayResponse.paymentIntentId);
      
      if (isVerified) {
        payment.gatewayDetails.stripeChargeId = gatewayResponse.chargeId;
      }
    }

    if (isVerified) {
      payment.status = 'completed';
      payment.gatewayResponse = gatewayResponse;
      
      await payment.save();
      await payment.addTimelineEntry('payment_completed', payment.amount, gatewayResponse, 'Payment completed successfully');

      // Update booking payment status
      const booking = await Booking.findById(payment.booking);
      booking.payment.status = 'completed';
      booking.payment.transactionId = payment.paymentId;
      booking.payment.razorpayOrderId = payment.gatewayDetails.razorpayOrderId;
      booking.payment.razorpayPaymentId = payment.gatewayDetails.razorpayPaymentId;
      booking.payment.stripePaymentIntentId = payment.gatewayDetails.stripePaymentIntentId;
      await booking.save();

      res.json({
        status: 'success',
        message: 'Payment verified successfully',
        data: {
          paymentId: payment.paymentId,
          status: 'completed',
          amount: payment.amount
        }
      });
    } else {
      payment.status = 'failed';
      payment.gatewayResponse = gatewayResponse;
      
      await payment.save();
      await payment.addTimelineEntry('payment_failed', payment.amount, gatewayResponse, 'Payment verification failed');

      res.status(400).json({
        status: 'error',
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify payment'
    });
  }
});

// @route   GET /api/payments/history
// @desc    Get payment history
// @access  Private
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { customer: req.user._id };

    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('booking', 'bookingId pickup drop fare')
      .populate('driver', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        payments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payment history'
    });
  }
});

// @route   POST /api/payments/refund
// @desc    Process refund
// @access  Private
router.post('/refund', [
  body('paymentId').notEmpty().withMessage('Payment ID required'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
  body('reason').notEmpty().withMessage('Refund reason required')
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

    const { paymentId, amount, reason } = req.body;

    // Find payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    // Check if user has access to this payment
    if (payment.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Check if payment is eligible for refund
    if (payment.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Only completed payments can be refunded'
      });
    }

    const refundAmount = amount || payment.amount;

    // Process refund
    await payment.processRefund(refundAmount, reason);

    res.json({
      status: 'success',
      message: 'Refund processed successfully',
      data: {
        paymentId: payment.paymentId,
        refundAmount,
        reason,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process refund'
    });
  }
});

module.exports = router;
