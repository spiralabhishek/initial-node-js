import express from "express";
import * as districtController from "../controllers/district.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";
import { body, param } from "express-validator";
import { handleValidationErrors } from "../middleware/validation.middleware.js";

const router = express.Router();

// Protect all routes
router.use(authMiddleware.authenticate);

/**
 * @route   GET /api/districts
 * @desc    Get all districts
 * @access  Private
 */
router.get("/", districtController.getAllDistricts);

/**
 * @route   GET /api/districts/:id
 * @desc    Get a district by ID
 * @access  Private
 */
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Invalid district ID"), handleValidationErrors],
  districtController.getDistrictById
);

/**
 * @route   POST /api/districts
 * @desc    Create a new district
 * @access  Private
 */
router.post(
  "/",
  [body("district").notEmpty().withMessage("District name is required"), handleValidationErrors],
  districtController.createDistrict
);

/**
 * @route   PUT /api/districts/:id
 * @desc    Update district
 * @access  Private
 */
router.put(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid district ID"),
    body("district").optional().isString().trim(),
    body("isActive").optional().isBoolean(),
    handleValidationErrors,
  ],
  districtController.updateDistrict
);

/**
 * @route   DELETE /api/districts/:id
 * @desc    Soft delete district
 * @access  Private
 */
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("Invalid district ID"), handleValidationErrors],
  districtController.deleteDistrict
);

/**
 * @route   GET /api/districts/:id/talukas
 * @desc    Get all talukas in a district
 * @access  Private
 */
router.get(
  "/:id/talukas",
  [param("id").isUUID().withMessage("Invalid district ID"), handleValidationErrors],
  districtController.getTalukasByDistrictId
);

export default router;
