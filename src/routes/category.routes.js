import express from "express";
import * as categoryController from "../controllers/category.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";
import { body, param } from "express-validator";
import { handleValidationErrors } from "../middleware/validation.middleware.js";
import { universalAuth } from "../middleware/universalAuth.middleware.js";
import { adminAuthenticate } from "../middleware/adminAuth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(universalAuth);
/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Private
 */
router.get("/", categoryController.getAllCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Private
 */
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Invalid category ID"), handleValidationErrors],
  categoryController.getCategoryById
);

router.use(adminAuthenticate);

/**
 * @route   POST /api/categories
 * @desc    Create category
 * @access  Private
 */
router.post(
  "/",
  [body("name").notEmpty().withMessage("Category name is required"), handleValidationErrors],
  categoryController.createCategory
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private
 */
router.put(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid category ID"),
    body("name").optional().isString(),
    body("isActive").optional().isBoolean(),
    handleValidationErrors,
  ],
  categoryController.updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category (soft delete)
 * @access  Private
 */
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("Invalid category ID"), handleValidationErrors],
  categoryController.deleteCategory
);

export default router;
