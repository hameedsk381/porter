const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
      'confirmed',    // Driver accepted
      'driver_assigned', // Driver assigned but not started
      'in_progress',  // Trip started
      'completed',    // Trip completed
      'cancelled',    // Booking cancelled
      'expired'       // No driver found within time limit
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
  }
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
bookingSchema.pre('save', function(next) {
  if (!this.bookingId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.bookingId = `PORTER${timestamp.slice(-6)}${random}`;
  }
  next();
});

// Method to add timeline entry
bookingSchema.methods.addTimelineEntry = function(status, location = null, note = null) {
  this.timeline.push({
    status,
    location,
    note,
    timestamp: new Date()
  });
  return this.save();
};

// Method to update status
bookingSchema.methods.updateStatus = function(newStatus, location = null, note = null) {
  this.status = newStatus;
  this.addTimelineEntry(newStatus, location, note);
  return this.save();
};

// Method to calculate fare
bookingSchema.methods.calculateFare = function() {
  const baseFare = this.fare.base;
  const distanceFare = this.fare.distance;
  const timeFare = this.fare.time;
  const surgeFare = this.fare.surge;
  
  this.fare.total = baseFare + distanceFare + timeFare + surgeFare;
  return this.fare.total;
};

// Static method to find nearby drivers
bookingSchema.statics.findNearbyDrivers = function(pickupCoordinates, vehicleType, maxDistance = 10000) {
  return this.aggregate([
    {
      $match: {
        'driverProfile.isAvailable': true,
        'driverProfile.isKYCVerified': true,
        'driverProfile.vehicleDetails.type': vehicleType
      }
    },
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [pickupCoordinates.lng, pickupCoordinates.lat]
        },
        distanceField: 'distance',
        maxDistance: maxDistance,
        spherical: true
      }
    },
    {
      $sort: { distance: 1 }
    },
    {
      $limit: 10
    }
  ]);
};

module.exports = mongoose.model('Booking', bookingSchema);
