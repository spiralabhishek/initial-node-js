// controllers/upload.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../config/logger.js";

/**
 * @route   POST /api/upload
 * @desc    Upload image(s)/video(s) to Cloudinary temp folder
 * @access  Private
 */
export const uploadFiles = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No files uploaded");
  }

  const uploadedFiles = req.files.map((file) => {
    // Determine resource type from file path or mimetype
    const isVideo = file.mimetype?.startsWith('video/') || 
                    file.resource_type === 'video';
    
    return {
      url: file.path, // Cloudinary URL (secure_url)
      public_id: file.filename, // Cloudinary public_id
      resource_type: isVideo ? 'video' : 'image',
      format: file.format || file.mimetype?.split('/')[1],
      size: file.size,
      width: file.width,
      height: file.height,
      duration: file.duration, // For videos
    };
  });

  logger.info("Files uploaded to Cloudinary temp folder", {
    folder: 'uploads/temp',
    count: req.files.length,
    userId: req.userId,
    files: uploadedFiles.map(f => ({
      public_id: f.public_id,
      resource_type: f.resource_type
    }))
  });

  return successResponse(
    res,
    { files: uploadedFiles },
    "Files uploaded successfully to temporary storage"
  );
});