import mongoose, { Document, Schema, Model } from 'mongoose';

// Define interfaces for our models
export interface IGatewayDetails {
  orderId?: string;
  paymentId?: string;
  signature?: string;
  receipt?: string;
  // Razorpay specific
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  // Stripe specific
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  // Common
  gatewayResponse?: any;
}

export interface IRefund {
  amount?: number;
  reason?: string;
  processedAt?: Date;
  gatewayRefundId?: string;
  status?: 'pending' | 'processed' | 'failed';
}

export interface IPaymentTimeline {
  status: string;
  timestamp: Date;
  amount?: number;
  gatewayResponse?: any;
  note?: string;
}

export interface ICommission {
  platform: number;
  driver: number;
}

export interface ISettlement {
  status?: 'pending' | 'processed' | 'failed';
  processedAt?: Date;
  settlementId?: string;
  driverAmount?: number;
  platformAmount?: number;
}

export interface IPayment extends Document {
  paymentId: string;
  booking: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  driver?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  method: 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  gateway: 'razorpay' | 'stripe' | 'cod';
  gatewayDetails: IGatewayDetails;
  refund?: IRefund;
  timeline: IPaymentTimeline[];
  commission: ICommission;
  settlement?: ISettlement;
  addTimelineEntry(status: string, amount?: number, gatewayResponse?: any, note?: string): Promise<IPayment>;
  updateStatus(newStatus: string, gatewayResponse?: any, note?: string): Promise<IPayment>;
  calculateCommission(): ICommission;
  processRefund(amount?: number, reason?: string): Promise<IPayment>;
}

const paymentSchema: Schema<IPayment> = new mongoose.Schema({
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
paymentSchema.pre<IPayment>('save', function(next) {
  if (!this.paymentId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.paymentId = `PAY${timestamp.slice(-6)}${random}`;
  }
  next();
});

// Method to add timeline entry
paymentSchema.methods.addTimelineEntry = function(status: string, amount?: number, gatewayResponse?: any, note?: string): Promise<IPayment> {
  this.timeline.push({
    status,
    amount: amount || undefined,
    gatewayResponse: gatewayResponse || undefined,
    note: note || undefined,
    timestamp: new Date()
  });
  return this.save();
};

// Method to update status
paymentSchema.methods.updateStatus = function(newStatus: string, gatewayResponse?: any, note?: string): Promise<IPayment> {
  this.status = newStatus;
  this.addTimelineEntry(newStatus, this.amount, gatewayResponse, note);
  return this.save();
};

// Method to calculate commission
paymentSchema.methods.calculateCommission = function(): ICommission {
  const totalAmount = this.amount;
  const platformCommissionRate = 0.15; // 15% platform commission
  const driverCommissionRate = 0.85; // 85% to driver
  
  this.commission.platform = Math.round(totalAmount * platformCommissionRate);
  this.commission.driver = totalAmount - this.commission.platform;
  
  return this.commission;
};

// Method to process refund
paymentSchema.methods.processRefund = async function(amount?: number, reason?: string): Promise<IPayment> {
  this.refund = {
    amount: amount || this.amount,
    reason,
    status: 'pending',
    processedAt: new Date()
  };
  
  this.addTimelineEntry('refund_initiated', this.refund.amount, null, reason);
  return this.save();
};

const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;