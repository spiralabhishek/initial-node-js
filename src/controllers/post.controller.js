import { models } from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';

const { Post, Category, District, Taluka, User } = models;

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
export const createPost = asyncHandler(async (req, res) => {
  const { categoryId, districtId, talukaId, title, description, media, postedBy } = req.body;
  const author = req.userId || postedBy;

  if (!categoryId || !districtId || !talukaId || !title || !description || !media || !author) {
    throw new ApiError(400, 'All required fields must be provided');
  }

  // Validate foreign keys
  const [category, district, taluka] = await Promise.all([
    Category.findByPk(categoryId),
    District.findByPk(districtId),
    Taluka.findByPk(talukaId)
  ]);

  if (!category) throw new ApiError(404, 'Category not found');
  if (!district) throw new ApiError(404, 'District not found');
  if (!taluka) throw new ApiError(404, 'Taluka not found');

  const newPost = await Post.create({
    categoryId,
    districtId,
    talukaId,
    title,
    description,
    media: Array.isArray(media) ? media : [media],
    postedBy: author
  });

  logger.info('New post created', { postId: newPost.id, userId: author });

  return successResponse(res, newPost, 'Post created successfully');
});

/**
 * @route   GET /api/posts
 * @desc    Get all posts with optional filters
 * @access  Public
 */
export const getAllPosts = asyncHandler(async (req, res) => {
  const { categoryId, districtId, talukaId } = req.query;

  const filters = { isActive: true };
  if (categoryId) filters.categoryId = categoryId;
  if (districtId) filters.districtId = districtId;
  if (talukaId) filters.talukaId = talukaId;

  const posts = await Post.findAll({
    where: filters,
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: District, as: 'district', attributes: ['id', 'district'] },
      { model: Taluka, as: 'taluka', attributes: ['id', 'taluka'] },
      { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }
    ],
    order: [['createdAt', 'DESC']]
  });

  return successResponse(res, posts, 'Posts retrieved successfully');
});

/**
 * @route   GET /api/posts/:id
 * @desc    Get a single post by ID
 * @access  Public
 */
export const getPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await Post.findOne({
    where: { id, isActive: true },
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: District, as: 'district', attributes: ['id', 'district'] },
      { model: Taluka, as: 'taluka', attributes: ['id', 'taluka'] },
      { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }
    ]
  });

  if (!post) throw new ApiError(404, 'Post not found');

  return successResponse(res, post, 'Post retrieved successfully');
});

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post
 * @access  Private
 */
export const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, media, categoryId, districtId, talukaId, isActive } = req.body;

  const post = await Post.findByPk(id);
  if (!post) throw new ApiError(404, 'Post not found');

  await post.update({
    title,
    description,
    media,
    categoryId,
    districtId,
    talukaId,
    isActive
  });

  logger.info('Post updated', { id });

  return successResponse(res, post, 'Post updated successfully');
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Soft delete post
 * @access  Private
 */
export const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await Post.findByPk(id);
  if (!post) throw new ApiError(404, 'Post not found');

  await post.update({ isActive: false });

  logger.info('Post deleted', { id });

  return successResponse(res, null, 'Post deleted successfully');
});

export default {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost
};
