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

  try {
    // Move media from temp to news folder if it's in temp
    if (media.public_id && media.public_id.includes('uploads/temp')) {
      movedMedia = await moveToFolder(media.public_id, 'news');
    } else {
      movedMedia = media;
    }

    const newNews = await News.create({
      title,
      description,
      media: movedMedia,
      isActive: isActive !== undefined ? isActive : true
    });

    logger.info('News created with media', {
      newsId: newNews.id,
      mediaUrl: movedMedia.url
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
  if (!news) throw new ApiError(404, 'News not found');

  const oldMedia = news.media;
  let movedMedia = media || oldMedia;

  try {
    if (media && media.public_id !== oldMedia?.public_id) {
      if (media.public_id.includes('uploads/temp')) {
        movedMedia = await moveToFolder(media.public_id, 'news');
      }

      if (oldMedia?.public_id) {
        await deleteFromCloudinary(oldMedia.public_id);
      }
    }

    await news.update({
      title: title ?? news.title,
      description: description ?? news.description,
      media: movedMedia,
      isActive: isActive ?? news.isActive
    });

    return successResponse(res, news, 'News updated successfully');
  } catch (error) {
    if (movedMedia && movedMedia.public_id !== oldMedia?.public_id) {
      await deleteFromCloudinary(movedMedia.public_id).catch(() => {});
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
  if (news.media && news.media.public_id) {
    await deleteFromCloudinary(news.media.public_id);
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
