import { models } from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../config/logger.js";

const { News } = models;

/**
 * @route   POST /api/news
 * @desc    Create a new news article
 * @access  Private
 */
export const createNews = asyncHandler(async (req, res) => {
  const { title, media, description } = req.body;

  if (!title || !media || !description) {
    throw new ApiError(400, "Title, media, and description are required");
  }

  const news = await News.create({ title, media, description });

  logger.info("News created", { newsId: news.id });

  return successResponse(res, news, "News created successfully");
});

/**
 * @route   GET /api/news
 * @desc    Get all active news articles
 * @access  Public
 */
export const getAllNews = asyncHandler(async (req, res) => {
  const newsList = await News.findAll({
    where: { isActive: true },
    order: [["createdAt", "DESC"]],
  });

  logger.info("Fetched all news", { count: newsList.length });

  return successResponse(res, newsList, "News retrieved successfully");
});

/**
 * @route   GET /api/news/:id
 * @desc    Get single news article by ID
 * @access  Public
 */
export const getNewsById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const news = await News.findOne({ where: { id, isActive: true } });

  if (!news) throw new ApiError(404, "News not found");

  return successResponse(res, news, "News retrieved successfully");
});

/**
 * @route   PUT /api/news/:id
 * @desc    Update a news article
 * @access  Private
 */
export const updateNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, media, description, isActive } = req.body;

  const news = await News.findByPk(id);
  if (!news) throw new ApiError(404, "News not found");

  await news.update({ title, media, description, isActive });

  logger.info("News updated", { id });

  return successResponse(res, news, "News updated successfully");
});

/**
 * @route   DELETE /api/news/:id
 * @desc    Soft delete news
 * @access  Private
 */
export const deleteNews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const news = await News.findByPk(id);
  if (!news) throw new ApiError(404, "News not found");

  await news.update({ isActive: false });

  logger.info("News deleted", { id });

  return successResponse(res, null, "News deleted successfully");
});

export default {
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
};
