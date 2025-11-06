import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../config/logger.js";

/**
 * @route   POST /api/upload
 * @desc    Upload image(s) to Cloudinary by folder
 * @query   folder=profilepicture|news|post
 * @access  Private
 */
export const uploadFiles = asyncHandler(async (req, res) => {
  const folder = req.query.folder || req.body.folder;

  if (!folder) {
    throw new ApiError(400, "Folder name is required");
  }

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No files uploaded");
  }

  const urls = req.files.map((file) => ({
    url: file.path,
    public_id: file.filename,
  }));

  logger.info("Files uploaded to Cloudinary", {
    folder,
    count: req.files.length,
  });

  return successResponse(res, { folder, urls }, "Files uploaded successfully");
});
