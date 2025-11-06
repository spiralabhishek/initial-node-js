import express from "express";
import * as newsController from "../controllers/news.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";
import { body, param } from "express-validator";
import { handleValidationErrors } from "../middleware/validation.middleware.js";

const router = express.Router();

/**
 * @route   GET /api/news
 * @desc    Get all news
 * @access  Public
 */
router.get("/", newsController.getAllNews);

/**
 * @route   GET /api/news/:id
 * @desc    Get news by ID
 * @access  Public
 */
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Invalid news ID"), handleValidationErrors],
  newsController.getNewsById
);

// Protect the rest
router.use(authMiddleware.authenticate);

/**
 * @route   POST /api/news
 * @desc    Create news
 * @access  Private
 */
router.post(
  "/",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("media").notEmpty().withMessage("Media is required"),
    body("description").notEmpty().withMessage("Description is required"),
    handleValidationErrors,
  ],
  newsController.createNews
);

/**
 * @route   PUT /api/news/:id
 * @desc    Update news
 * @access  Private
 */
router.put(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid news ID"),
    body("title").optional().isString(),
    body("media").optional().isString(),
    body("description").optional().isString(),
    body("isActive").optional().isBoolean(),
    handleValidationErrors,
  ],
  newsController.updateNews
);

/**
 * @route   DELETE /api/news/:id
 * @desc    Delete news
 * @access  Private
 */
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("Invalid news ID"), handleValidationErrors],
  newsController.deleteNews
);

export default router;
