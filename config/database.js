const mongoose = require('mongoose');
const redis = require('redis');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

// Redis connection
let redisClient;
const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    console.log('Redis Connected');
  } catch (error) {
    console.error('Redis connection error:', error.message);
  }
};

// Initialize Redis connection
connectRedis();

module.exports = { connectDB, redisClient };
