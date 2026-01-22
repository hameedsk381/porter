const twilio = require('twilio');
const { redisClient } = require('../config/database');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS
const sendOTP = async (phone) => {
  try {
    const otp = generateOTP();
    const expiry = Date.now() + (process.env.OTP_EXPIRE_MINUTES || 5) * 60 * 1000;

    // Store OTP in Redis with expiry
    await redisClient.setEx(`otp:${phone}`, process.env.OTP_EXPIRE_MINUTES * 60 || 300, otp);

    // Send SMS via Twilio
    const message = await client.messages.create({
      body: `Your Porter verification code is: ${otp}. Valid for ${process.env.OTP_EXPIRE_MINUTES || 5} minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}`
    });

    console.log(`OTP sent to ${phone}: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Send OTP error:', error);
    return false;
  }
};

// Verify OTP
const verifyOTP = async (phone, otp) => {
  try {
    const storedOTP = await redisClient.get(`otp:${phone}`);
    
    if (!storedOTP) {
      return false;
    }

    if (storedOTP === otp) {
      // Delete OTP after successful verification
      await redisClient.del(`otp:${phone}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return false;
  }
};

// Resend OTP
const resendOTP = async (phone) => {
  try {
    // Check if OTP was sent recently (rate limiting)
    const lastSent = await redisClient.get(`otp_sent:${phone}`);
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
      await redisClient.setEx(`otp_sent:${phone}`, 60, Date.now().toString());
      
      return {
        success: true,
        message: 'OTP sent successfully'
      };
    }

    return {
      success: false,
      message: 'Failed to send OTP'
    };
  } catch (error) {
    console.error('Resend OTP error:', error);
    return {
      success: false,
      message: 'Server error'
    };
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP
};
