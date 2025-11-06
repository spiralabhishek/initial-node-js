import express from "express";
import * as postController from "../controllers/post.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";
import { body, param, query } from "express-validator";
import { handleValidationErrors } from "../middleware/validation.middleware.js";

const router = express.Router();

/**
 * @route   GET /api/posts
 * @desc    Get all posts (with filters)
 * @access  Public
 */
router.get(
  "/",
  [
    query("categoryId").optional().isUUID(),
    query("districtId").optional().isUUID(),
    query("talukaId").optional().isUUID(),
    handleValidationErrors,
  ],
  postController.getAllPosts
);

/**
 * @route   GET /api/posts/:id
 * @desc    Get post by ID
 * @access  Public
 */
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Invalid post ID"), handleValidationErrors],
  postController.getPostById
);

// All below require authentication
router.use(authMiddleware.authenticate);

/**
 * @route   POST /api/posts
 * @desc    Create post
 * @access  Private
 */
router.post(
  "/",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("categoryId").isUUID().withMessage("Valid categoryId is required"),
    body("districtId").isUUID().withMessage("Valid districtId is required"),
    body("talukaId").isUUID().withMessage("Valid talukaId is required"),
    body("media").isArray().withMessage("Media must be an array of URLs"),
    handleValidationErrors,
  ],
  postController.createPost
);

/**
 * @route   PUT /api/posts/:id
 * @desc    Update post
 * @access  Private
 */
router.put(
  "/:id",
  [param("id").isUUID().withMessage("Invalid post ID"), handleValidationErrors],
  postController.updatePost
);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete post (soft delete)
 * @access  Private
 */
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("Invalid post ID"), handleValidationErrors],
  postController.deletePost
);

export default router;
