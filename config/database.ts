import mongoose from 'mongoose';
import { createClient } from '@redis/client';
import { env } from './env.validation';

// Redis client instance
let redisClient: any = null;

// MongoDB connection with retry logic
const connectDB = async (retries: number = 5): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      
      // Set up connection event handlers
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
      });

      return; // Success - exit function
    } catch (error: any) {
      console.error(
        `❌ MongoDB connection attempt ${attempt}/${retries} failed:`,
        error.message
      );

      if (attempt === retries) {
        console.error('💥 All MongoDB connection attempts failed. Exiting...');
        process.exit(1);
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const backoffTime = Math.min(Math.pow(2, attempt - 1) * 1000, 30000);
      console.log(`⏳ Retrying in ${backoffTime / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }
};

// Redis connection with retry logic
const connectRedis = async (retries: number = 5): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      redisClient = createClient({
        url: env.REDIS_URL,
      });

      redisClient.on('error', (err: Error) => {
        console.error('❌ Redis Client Error:', err.message);
      });

      redisClient.on('connect', () => {
        console.log('🔄 Redis connecting...');
      });

      redisClient.on('ready', () => {
        console.log('✅ Redis ready');
      });

      redisClient.on('reconnecting', () => {
        console.log('⏳ Redis reconnecting...');
      });

      redisClient.on('end', () => {
        console.warn('⚠️  Redis connection ended');
      });

      await redisClient.connect();
      console.log('✅ Redis Connected');
      return; // Success
    } catch (error: any) {
      console.error(
        `❌ Redis connection attempt ${attempt}/${retries} failed:`,
        error.message
      );

      if (attempt === retries) {
        console.error('⚠️  Redis connection failed after all attempts. Continuing without Redis...');
        redisClient = null;
        return; // Don't exit - Redis is optional
      }

      const backoffTime = Math.min(Math.pow(2, attempt - 1) * 1000, 30000);
      console.log(`⏳ Retrying Redis in ${backoffTime / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }
};

// Initialize Redis connection
connectRedis();

export { redisClient };
export default connectDB;