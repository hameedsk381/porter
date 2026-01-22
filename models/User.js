const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  profileImage: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['customer', 'driver', 'admin'],
    default: 'customer'
  },
  // Customer specific fields
  savedAddresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'other'
    },
    name: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    landmark: String
  }],
  // Driver specific fields
  driverProfile: {
    licenseNumber: String,
    licenseExpiry: Date,
    aadhaarNumber: String,
    vehicleDetails: {
      type: String,
      number: String,
      model: String,
      year: Number,
      color: String,
      capacity: Number
    },
    documents: {
      license: String,
      aadhaar: String,
      rc: String,
      insurance: String
    },
    isKYCVerified: {
      type: Boolean,
      default: false
    },
    isAvailable: {
      type: Boolean,
      default: false
    },
    currentLocation: {
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      },
      address: String,
      lastUpdated: Date
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    },
    earnings: {
      total: {
        type: Number,
        default: 0
      },
      pending: {
        type: Number,
        default: 0
      },
      withdrawn: {
        type: Number,
        default: 0
      }
    }
  },
  // OAuth fields
  googleId: String,
  // Notification preferences
  notificationSettings: {
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    }
  },
  // Language preference
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'mr', 'pa', 'ur']
  },
  // Device information
  deviceInfo: {
    deviceId: String,
    platform: String,
    version: String,
    fcmToken: String
  }
}, {
  timestamps: true
});

// Index for geospatial queries
userSchema.index({ 'driverProfile.currentLocation.coordinates': '2dsphere' });

// Pre-save middleware to hash password if provided
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshTokens;
  return userObject;
};

// Method to update driver location
userSchema.methods.updateLocation = function(coordinates, address) {
  if (this.role === 'driver') {
    this.driverProfile.currentLocation = {
      coordinates: [coordinates.lng, coordinates.lat],
      address,
      lastUpdated: new Date()
    };
    return this.save();
  }
  throw new Error('Only drivers can update location');
};

module.exports = mongoose.model('User', userSchema);
