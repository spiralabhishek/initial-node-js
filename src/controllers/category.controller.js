import { models } from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../config/logger.js";

const { Category } = models;

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Private
 */
export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    where: { isActive: true },
    order: [["name", "ASC"]],
  });

  logger.info("Fetched all categories", { count: categories.length });

  return successResponse(res, categories, "Categories retrieved successfully");
});

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Private
 */
export const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findOne({
    where: { id, isActive: true },
  });

  if (!category) throw new ApiError(404, "Category not found");

  return successResponse(res, category, "Category retrieved successfully");
});

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) throw new ApiError(400, "Category name is required");

  const exists = await Category.findOne({
    where: { name },
  });

  if (exists) throw new ApiError(409, "Category already exists");

  const newCategory = await Category.create({ name });

  logger.info("Category created", { name });

  return successResponse(res, newCategory, "Category created successfully");
});

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, isActive } = req.body;

  const category = await Category.findByPk(id);
  if (!category) throw new ApiError(404, "Category not found");

  // Check if name already exists for another category
  if (name && name !== category.name) {
    const nameExists = await Category.findOne({
      where: { name },
    });
    if (nameExists) throw new ApiError(409, "Category name already in use");
  }

  await category.update({ name, isActive });

  logger.info("Category updated", { id });

  return successResponse(res, category, "Category updated successfully");
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Soft delete category
 * @access  Private
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findByPk(id);
  if (!category) throw new ApiError(404, "Category not found");

  await category.update({ isActive: false });

  logger.info("Category deactivated", { id });

  return successResponse(res, null, "Category deleted successfully");
});

export default {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
