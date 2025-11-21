// controllers/news.controller.js
import { models } from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';
import { deleteFromCloudinary, moveToFolder } from '../utils/fileUpload.js';

const { News } = models;

/**
 * @route   POST /api/news
 * @desc    Create news with media
 * @access  Private
 */
export const createNews = asyncHandler(async (req, res) => {
  const { title, description, media, isActive } = req.body;

  if (!title || !description || !media) {
    throw new ApiError(400, 'Title, description, and media are required');
  }

  let movedMedia = null;
  let mediaUrl = null;

  try {
    // Check if media is an object with public_id or just a URL string
    const publicId = typeof media === 'object' ? media.public_id : null;
    
    // Move media from temp to news folder if it's in temp
    if (publicId && publicId.includes('uploads/temp')) {
      movedMedia = await moveToFolder(publicId, 'news');
      mediaUrl = movedMedia.url; // Extract only the URL
    } else {
      // If it's already a URL string or not in temp
      mediaUrl = typeof media === 'object' ? media.url : media;
    }

    const newNews = await News.create({
      title,
      description,
      media: mediaUrl, // Store only URL as string
      isActive: isActive !== undefined ? isActive : true
    });

    logger.info('News created with media', {
      newsId: newNews.id,
      mediaUrl: mediaUrl
    });

    return successResponse(res, newNews, 'News created successfully');
  } catch (error) {
    // Rollback: delete moved file if news creation fails
    if (movedMedia && movedMedia.public_id) {
      await deleteFromCloudinary(movedMedia.public_id).catch(err =>
        logger.error('Failed to cleanup media after news creation error', err)
      );
    }
    throw error;
  }
});

/**
 * @route   GET /api/news
 * @desc    Get all active news articles
 * @access  Public
 */
export const getAllNews = asyncHandler(async (req, res) => {
  const newsList = await News.findAll({
    where: { isActive: true },
    order: [['createdAt', 'DESC']]
  });

  logger.info('Fetched all news', { count: newsList.length });

  return successResponse(res, newsList, 'News retrieved successfully');
});

/**
 * @route   GET /api/news/:id
 * @desc    Get single news article by ID
 * @access  Public
 */
export const getNewsById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const news = await News.findOne({ where: { id, isActive: true } });

  if (!news) throw new ApiError(404, 'News not found');

  return successResponse(res, news, 'News retrieved successfully');
});

/**
 * @route   PUT /api/news/:id
 * @desc    Update news
 * @access  Private
 */
export const updateNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, media, isActive } = req.body;

  const news = await News.findByPk(id);

  if (!news) {
    throw new ApiError(404, 'News not found');
  }

  const oldMediaUrl = news.media;
  let movedMedia = null;
  let mediaUrl = null;

  try {
    // Check if new media is provided
    if (media) {
      const publicId = typeof media === 'object' ? media.public_id : null;
      const newMediaUrl = typeof media === 'object' ? media.url : media;

      // Only process if media has changed
      if (newMediaUrl !== oldMediaUrl) {
        // Move new media from temp to news folder
        if (publicId && publicId.includes('uploads/temp')) {
          movedMedia = await moveToFolder(publicId, 'news');
          mediaUrl = movedMedia.url;
        } else {
          mediaUrl = newMediaUrl;
        }

        // Extract public_id from old URL to delete
        if (oldMediaUrl && oldMediaUrl.includes('cloudinary.com')) {
          try {
            // Extract public_id from Cloudinary URL
            const urlParts = oldMediaUrl.split('/upload/');
            if (urlParts.length > 1) {
              const pathParts = urlParts[1].split('/');
              // Remove version (v1234567890) if present
              const startIndex = pathParts[0].startsWith('v') ? 1 : 0;
              const oldPublicId = pathParts.slice(startIndex).join('/').split('.')[0];
              await deleteFromCloudinary(oldPublicId);
            }
          } catch (deleteError) {
            logger.warn('Failed to delete old media', { error: deleteError.message });
          }
        }
      } else {
        mediaUrl = oldMediaUrl; // Keep existing media
      }
    } else {
      mediaUrl = oldMediaUrl; // Keep existing media if not provided
    }

    await news.update({
      title: title || news.title,
      description: description || news.description,
      media: mediaUrl, // Store only URL as string
      isActive: isActive !== undefined ? isActive : news.isActive
    });

    logger.info('News updated', { newsId: id });

    return successResponse(res, news, 'News updated successfully');
  } catch (error) {
    // Rollback: delete new media if update fails
    if (movedMedia && movedMedia.public_id) {
      await deleteFromCloudinary(movedMedia.public_id).catch(err =>
        logger.error('Failed to cleanup new media after update error', err)
      );
    }
    throw error;
  }
});

/**
 * @route   DELETE /api/news/:id
 * @desc    Delete news and its media
 * @access  Private
 */
export const deleteNews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const news = await News.findByPk(id);

  if (!news) {
    throw new ApiError(404, 'News not found');
  }

  // Delete media from Cloudinary
  if (news.media && news.media.includes('cloudinary.com')) {
    try {
      // Extract public_id from Cloudinary URL
      const urlParts = news.media.split('/upload/');
      if (urlParts.length > 1) {
        const pathParts = urlParts[1].split('/');
        // Remove version (v1234567890) if present
        const startIndex = pathParts[0].startsWith('v') ? 1 : 0;
        const publicId = pathParts.slice(startIndex).join('/').split('.')[0];
        await deleteFromCloudinary(publicId);
      }
    } catch (deleteError) {
      logger.warn('Failed to delete media from Cloudinary', { 
        error: deleteError.message,
        newsId: id 
      });
    }
  }

  await news.destroy();

  logger.info('News deleted with media cleanup', { newsId: id });

  return successResponse(res, null, 'News deleted successfully');
});

export default {
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews
};