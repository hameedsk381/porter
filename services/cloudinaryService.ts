import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  width?: number;
  height?: number;
  error?: string;
}

interface MultipleUploadResult {
  success: boolean;
  uploaded?: UploadResult[];
  failed?: UploadResult[];
  error?: string;
}

interface DeleteResult {
  success: boolean;
  result?: any;
  error?: string;
}

interface ImageOptions {
  width?: number | string;
  height?: number | string;
  quality?: string;
  fetch_format?: string;
}

// Upload file to Cloudinary
const uploadToCloudinary = async (file: string, folder: string = 'porter'): Promise<UploadResult> => {
  try {
    const result: any = await cloudinary.uploader.upload(file, {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Upload multiple files
const uploadMultipleFiles = async (files: string[], folder: string = 'porter'): Promise<MultipleUploadResult> => {
  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
    const results = await Promise.all(uploadPromises);
    
    const successful = results.filter(result => result.success);
    const failed = results.filter(result => !result.success);

    return {
      success: failed.length === 0,
      uploaded: successful,
      failed: failed
    };
  } catch (error: any) {
    console.error('Multiple file upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId: string): Promise<DeleteResult> => {
  try {
    const result: any = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      result: result
    };
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate optimized image URL
const getOptimizedImageUrl = (publicId: string, options: ImageOptions = {}): string => {
  const defaultOptions = {
    quality: 'auto',
    fetch_format: 'auto',
    width: options.width || 'auto',
    height: options.height || 'auto'
  };

  return cloudinary.url(publicId, defaultOptions);
};

export {
  uploadToCloudinary,
  uploadMultipleFiles,
  deleteFromCloudinary,
  getOptimizedImageUrl
};