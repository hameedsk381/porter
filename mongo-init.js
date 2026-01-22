// MongoDB initialization script
db = db.getSiblingDB('porter-logistics');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['phone', 'name', 'role'],
      properties: {
        phone: {
          bsonType: 'string',
          pattern: '^[0-9]{10}$',
          description: 'Phone number must be 10 digits'
        },
        name: {
          bsonType: 'string',
          minLength: 2,
          description: 'Name must be at least 2 characters'
        },
        role: {
          bsonType: 'string',
          enum: ['customer', 'driver', 'admin'],
          description: 'Role must be customer, driver, or admin'
        }
      }
    }
  }
});

db.createCollection('bookings', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['bookingId', 'customer', 'vehicleType', 'pickup', 'drop', 'status'],
      properties: {
        bookingId: {
          bsonType: 'string',
          description: 'Booking ID is required'
        },
        customer: {
          bsonType: 'objectId',
          description: 'Customer reference is required'
        },
        vehicleType: {
          bsonType: 'string',
          enum: ['2-wheeler', 'mini-truck', 'tempo', '3-wheeler', 'large-truck'],
          description: 'Valid vehicle type is required'
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'confirmed', 'driver_assigned', 'in_progress', 'completed', 'cancelled', 'expired'],
          description: 'Valid status is required'
        }
      }
    }
  }
});

db.createCollection('payments', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['paymentId', 'booking', 'customer', 'amount', 'method', 'status'],
      properties: {
        paymentId: {
          bsonType: 'string',
          description: 'Payment ID is required'
        },
        booking: {
          bsonType: 'objectId',
          description: 'Booking reference is required'
        },
        customer: {
          bsonType: 'objectId',
          description: 'Customer reference is required'
        },
        amount: {
          bsonType: 'number',
          minimum: 0,
          description: 'Amount must be a positive number'
        },
        method: {
          bsonType: 'string',
          enum: ['upi', 'card', 'netbanking', 'wallet', 'cod'],
          description: 'Valid payment method is required'
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
          description: 'Valid payment status is required'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ phone: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { sparse: true });
db.users.createIndex({ 'driverProfile.currentLocation.coordinates': '2dsphere' });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });

db.bookings.createIndex({ customer: 1, createdAt: -1 });
db.bookings.createIndex({ driver: 1, createdAt: -1 });
db.bookings.createIndex({ status: 1 });
db.bookings.createIndex({ 'pickup.coordinates': '2dsphere' });
db.bookings.createIndex({ bookingId: 1 }, { unique: true });
db.bookings.createIndex({ createdAt: -1 });

db.payments.createIndex({ customer: 1, createdAt: -1 });
db.payments.createIndex({ driver: 1, createdAt: -1 });
db.payments.createIndex({ booking: 1 });
db.payments.createIndex({ status: 1 });
db.payments.createIndex({ paymentId: 1 }, { unique: true });
db.payments.createIndex({ createdAt: -1 });

// Create admin user
db.users.insertOne({
  phone: '9999999999',
  name: 'Admin User',
  email: 'admin@porter.com',
  role: 'admin',
  isVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Database initialized successfully!');
