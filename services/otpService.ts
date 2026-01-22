import twilio from 'twilio';
import { redisClient } from '../config/database';
import { env } from '../config/env.validation';

interface OTPResult {
  success: boolean;
  message?: string;
}

// Initialize Twilio client (only if valid credentials)
const isDevelopment = env.NODE_ENV === 'development';
const hasTwilioCredentials = env.TWILIO_ACCOUNT_SID.startsWith('AC');

const client = hasTwilioCredentials ? twilio(
  env.TWILIO_ACCOUNT_SID,
  env.TWILIO_AUTH_TOKEN
) : null;

// Generate random OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS
const sendOTP = async (phone: string): Promise<boolean> => {
  try {
    const otp = generateOTP();
    const expiry = Date.now() + (parseInt(env.OTP_EXPIRE_MINUTES) * 60 * 1000);

    // Store OTP in Redis with expiry
    await redisClient?.setEx(`otp:${phone}`, parseInt(env.OTP_EXPIRE_MINUTES) * 60, otp);

    // In development or without Twilio, just log OTP to console
    if (!client || isDevelopment) {
      console.log(`\n======================`);
      console.log(`📱 OTP for ${phone}: ${otp}`);
      console.log(`Valid for ${env.OTP_EXPIRE_MINUTES} minutes`);
      console.log(`======================\n`);
      return true;
    }

    // Send SMS via Twilio (production only)
    if (client) {
      const message = await client.messages.create({
        body: `Your Porter verification code is: ${otp}. Valid for ${env.OTP_EXPIRE_MINUTES} minutes.`,
        from: env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      console.log(`OTP sent to ${phone}: ${message.sid}`);
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return false;
  }
};

// Verify OTP
const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
  try {
    const storedOTP = await redisClient?.get(`otp:${phone}`);
    
    if (!storedOTP) {
      return false;
    }

    if (storedOTP === otp) {
      // Delete OTP after successful verification
      await redisClient?.del(`otp:${phone}`);
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return false;
  }
};

// Resend OTP
const resendOTP = async (phone: string): Promise<OTPResult> => {
  try {
    // Check if OTP was sent recently (rate limiting)
    const lastSent = await redisClient?.get(`otp_sent:${phone}`);
    if (lastSent) {
      const timeDiff = Date.now() - parseInt(lastSent);
      const cooldownPeriod = 60 * 1000; // 1 minute cooldown
      
      if (timeDiff < cooldownPeriod) {
        return {
          success: false,
          message: 'Please wait before requesting another OTP'
        };
      }
    }

    // Send new OTP
    const success = await sendOTP(phone);
    
    if (success) {
      // Record when OTP was sent
      await redisClient?.setEx(`otp_sent:${phone}`, 60, Date.now().toString());
      
      return {
        success: true,
        message: 'OTP sent successfully'
      };
    }

    return {
      success: false,
      message: 'Failed to send OTP'
    };
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return {
      success: false,
      message: 'Server error'
    };
  }
};

export {
  sendOTP,
  verifyOTP,
  resendOTP
};