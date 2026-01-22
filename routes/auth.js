const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const { sendOTP, verifyOTP } = require('../services/otpService');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const router = express.Router();

// @route   POST /api/auth/send-otp
// @desc    Send OTP to phone number
// @access  Public
router.post('/send-otp', [
  body('phone').isMobilePhone('en-IN').withMessage('Valid Indian phone number required'),
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone, name } = req.body;

    // Check if user exists
    let user = await User.findOne({ phone });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        phone,
        name: name || 'User'
      });
      await user.save();
    }

    // Send OTP
    const otpSent = await sendOTP(phone);
    
    if (!otpSent) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP'
      });
    }

    res.json({
      status: 'success',
      message: 'OTP sent successfully',
      phone: phone
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login
// @access  Public
router.post('/verify-otp', [
  body('phone').isMobilePhone('en-IN').withMessage('Valid Indian phone number required'),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('Valid OTP required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone, otp } = req.body;

    // Verify OTP
    const isValidOTP = await verifyOTP(phone, otp);
    
    if (!isValidOTP) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired OTP'
      });
    }

    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update verification status
    user.isVerified = true;
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', [
  body('refreshToken').notEmpty().withMessage('Refresh token required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    res.json({
      status: 'success',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid refresh token'
    });
  }
});

// @route   POST /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.post('/google', [
  body('googleToken').notEmpty().withMessage('Google token required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { googleToken } = req.body;

    // Verify Google token (implement Google OAuth verification)
    const googleUser = await verifyGoogleToken(googleToken);
    
    if (!googleUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Google token'
      });
    }

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { googleId: googleUser.sub },
        { email: googleUser.email }
      ]
    });

    if (!user) {
      user = new User({
        googleId: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        profileImage: googleUser.picture,
        isVerified: true
      });
      await user.save();
    } else {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleUser.sub;
        await user.save();
      }
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    res.json({
      status: 'success',
      message: 'Google login successful',
      data: {
        user: user.getPublicProfile(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', async (req, res) => {
  try {
    // In a more sophisticated implementation, you might want to blacklist the token
    // For now, we'll just return success as the client will remove the token
    
    res.json({
      status: 'success',
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// Helper function to verify Google token (implement based on your Google OAuth setup)
async function verifyGoogleToken(token) {
  // This is a placeholder - implement actual Google token verification
  // You would typically use google-auth-library or similar
  try {
    // Example implementation:
    // const { OAuth2Client } = require('google-auth-library');
    // const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    // const ticket = await client.verifyIdToken({
    //   idToken: token,
    //   audience: process.env.GOOGLE_CLIENT_ID,
    // });
    // return ticket.getPayload();
    
    // For now, return null to indicate not implemented
    return null;
  } catch (error) {
    console.error('Google token verification error:', error);
    return null;
  }
}

module.exports = router;
