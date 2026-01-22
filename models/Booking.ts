import mongoose, { Document, Schema, Model } from 'mongoose';

// Define interfaces for our models
export interface ILocation {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  landmark?: string;
  instructions?: string;
}

export interface IFare {
  base: number;
  distance: number;
  time: number;
  surge: number;
  total: number;
  currency: string;
}

export interface IPayment {
  method: 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  stripePaymentIntentId?: string;
}

export interface ITimelineEntry {
  status: string;
  timestamp: Date;
  location?: {
    coordinates: {
      lat: number;
      lng: number;
    };
    address?: string;
  };
  note?: string;
}

export interface IDriverAssignment {
  assignedAt?: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  driverLocation?: Array<{
    coordinates: {
      lat: number;
      lng: number;
    };
    timestamp: Date;
  }>;
}

export interface ICustomerRating {
  rating?: number;
  review?: string;
  ratedAt?: Date;
}

export interface IRequirements {
  helper: boolean;
  fragile: boolean;
  heavy: boolean;
  notes?: string;
}

export interface ICancellation {
  cancelledBy?: 'customer' | 'driver' | 'admin' | 'system';
  reason?: string;
  cancelledAt?: Date;
  refundAmount?: number;
  refundStatus?: 'pending' | 'processed' | 'failed';
}

export interface IInvoice {
  number?: string;
  generatedAt?: Date;
  pdfUrl?: string;
}

export interface IBooking extends Document {
  bookingId: string;
  customer: mongoose.Types.ObjectId;
  driver?: mongoose.Types.ObjectId;
  status: 'pending' | 'searching' | 'confirmed' | 'driver_assigned' | 'in_progress' | 'completed' | 'cancelled' | 'expired' | 'no_drivers_available';
  vehicleType: '2-wheeler' | 'mini-truck' | 'tempo' | '3-wheeler' | 'large-truck';
  pickup: ILocation;
  drop: ILocation;
  distance: {
    value: number;
    unit: string;
  };
  estimatedDuration: {
    value: number;
    unit: string;
  };
  fare: IFare;
  payment: IPayment;
  timeline: ITimelineEntry[];
  driverAssignment: IDriverAssignment;
  customerRating?: ICustomerRating;
  driverRating?: ICustomerRating;
  requirements: IRequirements;
  cancellation?: ICancellation;
  invoice?: IInvoice;
  notifiedDrivers?: string[];
  assignedAt?: Date;
  userId?: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  customerName?: string;
  estimatedFare?: number;
  dropoff?: ILocation;
  addTimelineEntry(status: string, location?: any, note?: string): Promise<IBooking>;
  updateStatus(newStatus: string, location?: any, note?: string): Promise<IBooking>;
  calculateFare(): number;
}

const bookingSchema: Schema<IBooking> = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
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
  status: {
    type: String,
    enum: [
      'pending',      // Booking created, waiting for driver
      'searching',    // Looking for nearby drivers
      'confirmed',    // Driver accepted
      'driver_assigned', // Driver assigned but not started
      'in_progress',  // Trip started
      'completed',    // Trip completed
      'cancelled',    // Booking cancelled
      'expired',      // No driver found within time limit
      'no_drivers_available' // No drivers available nearby
    ],
    default: 'pending'
  },
  vehicleType: {
    type: String,
    enum: ['2-wheeler', 'mini-truck', 'tempo', '3-wheeler', 'large-truck'],
    required: true
  },
  pickup: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    landmark: String,
    instructions: String
  },
  drop: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    landmark: String,
    instructions: String
  },
  distance: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: 'km'
    }
  },
  estimatedDuration: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: 'minutes'
    }
  },
  fare: {
    base: {
      type: Number,
      required: true
    },
    distance: {
      type: Number,
      required: true
    },
    time: {
      type: Number,
      required: true
    },
    surge: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'wallet', 'cod'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    stripePaymentIntentId: String
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
    location: {
      coordinates: {
        lat: Number,
        lng: Number
      },
      address: String
    },
    note: String
  }],
  // Driver assignment details
  driverAssignment: {
    assignedAt: Date,
    acceptedAt: Date,
    startedAt: Date,
    completedAt: Date,
    driverLocation: [{
      coordinates: {
        lat: Number,
        lng: Number
      },
      timestamp: Date
    }]
  },
  // Customer feedback
  customerRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    ratedAt: Date
  },
  // Driver feedback
  driverRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    ratedAt: Date
  },
  // Special requirements
  requirements: {
    helper: {
      type: Boolean,
      default: false
    },
    fragile: {
      type: Boolean,
      default: false
    },
    heavy: {
      type: Boolean,
      default: false
    },
    notes: String
  },
  // Cancellation details
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['customer', 'driver', 'admin', 'system']
    },
    reason: String,
    cancelledAt: Date,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed']
    }
  },
  // Invoice details
  invoice: {
    number: String,
    generatedAt: Date,
    pdfUrl: String
  },
  // Notified drivers for this booking
  notifiedDrivers: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ driver: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'pickup.coordinates': '2dsphere' });
bookingSchema.index({ bookingId: 1 });

// Pre-save middleware to generate booking ID
bookingSchema.pre<IBooking>('save', function(next) {
  if (!this.bookingId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.bookingId = `PORTER${timestamp.slice(-6)}${random}`;
  }
  next();
});

// Method to add timeline entry
bookingSchema.methods.addTimelineEntry = function(status: string, location?: any, note?: string): Promise<IBooking> {
  this.timeline.push({
    status,
    location: location || undefined,
    note: note || undefined,
    timestamp: new Date()
  });
  return this.save();
};

// Method to update status
bookingSchema.methods.updateStatus = function(newStatus: string, location?: any, note?: string): Promise<IBooking> {
  this.status = newStatus;
  this.addTimelineEntry(newStatus, location, note);
  return this.save();
};

// Method to calculate fare
bookingSchema.methods.calculateFare = function(): number {
  const baseFare = this.fare.base;
  const distanceFare = this.fare.distance;
  const timeFare = this.fare.time;
  const surgeFare = this.fare.surge;
  
  this.fare.total = baseFare + distanceFare + timeFare + surgeFare;
  return this.fare.total;
};

const Booking: Model<IBooking> = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;