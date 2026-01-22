import express, { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User, { IUser } from '../models/User';
import { uploadToCloudinary } from '../services/cloudinaryService';

const router: Router = express.Router();

interface AuthRequest extends Request {
  user?: IUser;
}

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    
    return res.json({
      status: 'success',
      data: user
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(500).json({
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
], async (req: AuthRequest, res: Response) => {
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
    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (language) updateData.language = language;
    if (notificationSettings) updateData.notificationSettings = notificationSettings;

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    return res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
});

// @route   POST /api/users/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post('/upload-avatar', async (req: AuthRequest, res: Response) => {
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
      req.user?._id,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password');

    return res.json({
      status: 'success',
      message: 'Avatar updated successfully',
      data: user
    });
  } catch (error: any) {
    console.error('Upload avatar error:', error);
    return res.status(500).json({
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
], async (req: AuthRequest, res: Response) => {
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

    const user = await User.findById(req.user?._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Check if address type already exists (for home/work)
    if (type === 'home' || type === 'work') {
      const existingIndex = user.savedAddresses?.findIndex(addr => addr.type === type);
      if (existingIndex !== undefined && existingIndex !== -1) {
        if (user.savedAddresses) {
          user.savedAddresses[existingIndex] = {
            type,
            name,
            address,
            coordinates,
            landmark
          };
        }
      } else {
        user.savedAddresses?.push({
          type,
          name,
          address,
          coordinates,
          landmark
        });
      }
    } else {
      user.savedAddresses?.push({
        type,
        name,
        address,
        coordinates,
        landmark
      });
    }

    await user.save();

    return res.json({
      status: 'success',
      message: 'Address saved successfully',
      data: user.savedAddresses
    });
  } catch (error: any) {
    console.error('Save address error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to save address'
    });
  }
});

// @route   GET /api/users/saved-addresses
// @desc    Get saved addresses
// @access  Private
router.get('/saved-addresses', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('savedAddresses');
    
    return res.json({
      status: 'success',
      data: user?.savedAddresses
    });
  } catch (error: any) {
    console.error('Get saved addresses error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch saved addresses'
    });
  }
});

// @route   DELETE /api/users/saved-addresses/:id
// @desc    Delete saved address
// @access  Private
router.delete('/saved-addresses/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    if (user.savedAddresses) {
      user.savedAddresses = user.savedAddresses.filter(
        (addr, index) => index.toString() !== req.params.id
      );
    }

    await user.save();

    return res.json({
      status: 'success',
      message: 'Address deleted successfully',
      data: user.savedAddresses
    });
  } catch (error: any) {
    console.error('Delete address error:', error);
    return res.status(500).json({
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
], async (req: AuthRequest, res: Response) => {
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
      req.user?._id,
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

    return res.json({
      status: 'success',
      message: 'Device info updated successfully',
      data: user
    });
  } catch (error: any) {
    console.error('Update device info error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update device info'
    });
  }
});

export default router;