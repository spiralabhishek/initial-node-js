import express from "express";
import * as talukaController from "../controllers/taluka.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";
import { body, param } from "express-validator";
import { handleValidationErrors } from "../middleware/validation.middleware.js";
import { universalAuth } from "../middleware/universalAuth.middleware.js";
import { adminAuthenticate } from "../middleware/adminAuth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(universalAuth);

/**
 * @route   GET /api/talukas
 * @desc    Get all talukas
 * @access  Private
 */
router.get("/", talukaController.getAllTalukas);

/**
 * @route   GET /api/talukas/:id
 * @desc    Get taluka by ID
 * @access  Private
 */
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Invalid taluka ID"), handleValidationErrors],
  talukaController.getTalukaById
);

router.use(adminAuthenticate);

/**
 * @route   POST /api/talukas
 * @desc    Create taluka
 * @access  Private
 */
router.post(
  "/",
  [
    body("taluka").notEmpty().withMessage("Taluka name is required"),
    body("districtId").isUUID().withMessage("Valid districtId is required"),
    handleValidationErrors,
  ],
  talukaController.createTaluka
);

/**
 * @route   PUT /api/talukas/:id
 * @desc    Update taluka
 * @access  Private
 */
router.put(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid taluka ID"),
    body("taluka").optional().isString(),
    body("districtId").optional().isUUID(),
    body("isActive").optional().isBoolean(),
    handleValidationErrors,
  ],
  talukaController.updateTaluka
);

/**
 * @route   DELETE /api/talukas/:id
 * @desc    Delete taluka
 * @access  Private
 */
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("Invalid taluka ID"), handleValidationErrors],
  talukaController.deleteTaluka
);

export default router;
