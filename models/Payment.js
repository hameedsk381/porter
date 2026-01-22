const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    unique: true,
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  method: {
    type: String,
    enum: ['upi', 'card', 'netbanking', 'wallet', 'cod'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  gateway: {
    type: String,
    enum: ['razorpay', 'stripe', 'cod'],
    required: true
  },
  gatewayDetails: {
    orderId: String,
    paymentId: String,
    signature: String,
    receipt: String,
    // Razorpay specific
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    // Stripe specific
    stripePaymentIntentId: String,
    stripeChargeId: String,
    // Common
    gatewayResponse: mongoose.Schema.Types.Mixed
  },
  refund: {
    amount: Number,
    reason: String,
    processedAt: Date,
    gatewayRefundId: String,
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed']
    }
  },
  timeline: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    amount: Number,
    gatewayResponse: mongoose.Schema.Types.Mixed,
    note: String
  }],
  // Commission and fees
  commission: {
    platform: {
      type: Number,
      default: 0
    },
    driver: {
      type: Number,
      default: 0
    }
  },
  // Settlement details
  settlement: {
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending'
    },
    processedAt: Date,
    settlementId: String,
    driverAmount: Number,
    platformAmount: Number
  }
}, {
  timestamps: true
});

// Index for efficient queries
paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ driver: 1, createdAt: -1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentId: 1 });

// Pre-save middleware to generate payment ID
paymentSchema.pre('save', function(next) {
  if (!this.paymentId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.paymentId = `PAY${timestamp.slice(-6)}${random}`;
  }
  next();
});

// Method to add timeline entry
paymentSchema.methods.addTimelineEntry = function(status, amount = null, gatewayResponse = null, note = null) {
  this.timeline.push({
    status,
    amount,
    gatewayResponse,
    note,
    timestamp: new Date()
  });
  return this.save();
};

// Method to update status
paymentSchema.methods.updateStatus = function(newStatus, gatewayResponse = null, note = null) {
  this.status = newStatus;
  this.addTimelineEntry(newStatus, this.amount, gatewayResponse, note);
  return this.save();
};

// Method to calculate commission
paymentSchema.methods.calculateCommission = function() {
  const totalAmount = this.amount;
  const platformCommissionRate = 0.15; // 15% platform commission
  const driverCommissionRate = 0.85; // 85% to driver
  
  this.commission.platform = Math.round(totalAmount * platformCommissionRate);
  this.commission.driver = totalAmount - this.commission.platform;
  
  return this.commission;
};

// Method to process refund
paymentSchema.methods.processRefund = async function(amount, reason) {
  this.refund = {
    amount: amount || this.amount,
    reason,
    status: 'pending',
    processedAt: new Date()
  };
  
  this.addTimelineEntry('refund_initiated', this.refund.amount, null, reason);
  return this.save();
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = function(startDate, endDate) {
  const matchStage = {
    status: 'completed',
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        averageAmount: { $avg: '$amount' },
        platformCommission: { $sum: '$commission.platform' },
        driverPayout: { $sum: '$commission.driver' }
      }
    }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);
