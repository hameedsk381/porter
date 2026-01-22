import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface EnvConfig {
  // Server
  NODE_ENV: string;
  PORT: number;
  FRONTEND_URL: string;

  // Database
  MONGODB_URI: string;
  REDIS_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRE: string;

  // Twilio
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;
  OTP_EXPIRE_MINUTES: string;

  // Payment Gateways
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;

  // Storage
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;

  // Google OAuth
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

export const validateEnv = (): EnvConfig => {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER'
  ];

  const missing = requiredVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    const errorMsg = 'Missing required environment variables: ' + missing.join(', ');
    throw new Error(errorMsg);
  }

  // Validate format
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('WARNING: JWT_SECRET should be at least 32 characters long');
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid number between 1 and 65535');
  }

  console.log('Environment variables validated successfully');

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: port,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

    MONGODB_URI: process.env.MONGODB_URI!,
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
    REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE || '30d',

    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID!,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN!,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER!,
    OTP_EXPIRE_MINUTES: process.env.OTP_EXPIRE_MINUTES || '5',

    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,

    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  };
};

export const env = validateEnv();
