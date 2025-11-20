// utils/fileUpload.js
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from './apiError.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for temporary uploads - UPLOADS DIRECTLY TO CLOUDINARY
const tempStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type based on mimetype
    const isVideo = file.mimetype.startsWith('video/');
    
    return {
      folder: 'uploads/temp', // Cloudinary folder path
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webp', 'mkv'],
      resource_type: isVideo ? 'video' : 'image',
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`, // Unique filename
    };
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Invalid file type: ${file.mimetype}. Only images and videos are allowed`
      ),
      false
    );
  }
};

// Multer upload instance - NO LOCAL STORAGE
export const upload = multer({
  storage: tempStorage, // Uses Cloudinary storage
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
});

// Helper function to move file from temp to permanent folder
export const moveToFolder = async (publicId, targetFolder) => {
  try {
    // Extract the file name from public_id
    const fileName = publicId.split('/').pop();
    const newPublicId = `uploads/${targetFolder}/${fileName}`;

    // Determine resource type from public_id
    let resourceType = 'image';
    
    // Get resource details to determine type
    try {
      await cloudinary.api.resource(publicId, { resource_type: 'image' });
      resourceType = 'image';
    } catch {
      try {
        await cloudinary.api.resource(publicId, { resource_type: 'video' });
        resourceType = 'video';
      } catch {
        resourceType = 'raw';
      }
    }

    // Rename (move) the file in Cloudinary
    const result = await cloudinary.uploader.rename(publicId, newPublicId, {
      resource_type: resourceType,
      invalidate: true,
      overwrite: false,
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: resourceType,
    };
  } catch (error) {
    throw new ApiError(500, `Failed to move file: ${error.message}`);
  }
};

// Helper function to delete file from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    // Try deleting as image first
    let result;
    try {
      result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true,
      });
    } catch {
      // If image fails, try as video
      result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video',
        invalidate: true,
      });
    }

    return result;
  } catch (error) {
    throw new ApiError(500, `Failed to delete file: ${error.message}`);
  }
};

// Helper to delete multiple files
export const deleteManyFromCloudinary = async (publicIds) => {
  try {
    const deletePromises = publicIds.map((id) => deleteFromCloudinary(id));
    const results = await Promise.allSettled(deletePromises);
    
    // Log any failures but don't throw
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to delete ${publicIds[index]}:`, result.reason);
      }
    });
    
    return results;
  } catch (error) {
    throw new ApiError(500, `Failed to delete files: ${error.message}`);
  }
};

export { cloudinary };