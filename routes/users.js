const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('language').optional().isIn(['en', 'hi', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'mr', 'pa', 'ur']).withMessage('Invalid language')
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

    const { name, email, language, notificationSettings } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (language) updateData.language = language;
    if (notificationSettings) updateData.notificationSettings = notificationSettings;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
});

// @route   POST /api/users/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post('/upload-avatar', async (req, res) => {
  try {
    // In a real implementation, you would handle file upload using multer
    // For now, we'll assume the file is already uploaded to cloudinary
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Image URL is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password');

    res.json({
      status: 'success',
      message: 'Avatar updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload avatar'
    });
  }
});

// @route   POST /api/users/saved-addresses
// @desc    Add saved address
// @access  Private
router.post('/saved-addresses', [
  body('type').isIn(['home', 'work', 'other']).withMessage('Valid address type required'),
  body('name').isLength({ min: 2 }).withMessage('Address name must be at least 2 characters'),
  body('address').isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),
  body('coordinates.lat').isNumeric().withMessage('Valid latitude required'),
  body('coordinates.lng').isNumeric().withMessage('Valid longitude required')
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

    const { type, name, address, coordinates, landmark } = req.body;

    const user = await User.findById(req.user._id);
    
    // Check if address type already exists (for home/work)
    if (type === 'home' || type === 'work') {
      const existingIndex = user.savedAddresses.findIndex(addr => addr.type === type);
      if (existingIndex !== -1) {
        user.savedAddresses[existingIndex] = {
          type,
          name,
          address,
          coordinates,
          landmark
        };
      } else {
        user.savedAddresses.push({
          type,
          name,
          address,
          coordinates,
          landmark
        });
      }
    } else {
      user.savedAddresses.push({
        type,
        name,
        address,
        coordinates,
        landmark
      });
    }

    await user.save();

    res.json({
      status: 'success',
      message: 'Address saved successfully',
      data: user.savedAddresses
    });
  } catch (error) {
    console.error('Save address error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save address'
    });
  }
});

// @route   GET /api/users/saved-addresses
// @desc    Get saved addresses
// @access  Private
router.get('/saved-addresses', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('savedAddresses');
    
    res.json({
      status: 'success',
      data: user.savedAddresses
    });
  } catch (error) {
    console.error('Get saved addresses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch saved addresses'
    });
  }
});

// @route   DELETE /api/users/saved-addresses/:id
// @desc    Delete saved address
// @access  Private
router.delete('/saved-addresses/:id', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.savedAddresses = user.savedAddresses.filter(
      (addr, index) => index.toString() !== req.params.id
    );

    await user.save();

    res.json({
      status: 'success',
      message: 'Address deleted successfully',
      data: user.savedAddresses
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete address'
    });
  }
});

// @route   PUT /api/users/device-info
// @desc    Update device information
// @access  Private
router.put('/device-info', [
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('platform').isIn(['ios', 'android', 'web']).withMessage('Valid platform required'),
  body('version').notEmpty().withMessage('Version is required'),
  body('fcmToken').optional().isString().withMessage('FCM token must be a string')
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

    const { deviceId, platform, version, fcmToken } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        deviceInfo: {
          deviceId,
          platform,
          version,
          fcmToken
        }
      },
      { new: true }
    ).select('-password');

    res.json({
      status: 'success',
      message: 'Device info updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update device info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update device info'
    });
  }
});

module.exports = router;
