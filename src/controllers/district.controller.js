import { models } from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../config/logger.js";

const { District } = models;

/**
 * @route   GET /api/districts
 * @desc    Get all districts
 * @access  Private
 */
export const getAllDistricts = asyncHandler(async (req, res) => {
  const districts = await District.findAll({
    where: { isActive: true },
    order: [["district", "ASC"]],
  });

  logger.info("Fetched all districts", { count: districts.length });

  return successResponse(res, districts, "Districts retrieved successfully");
});

/**
 * @route   GET /api/districts/:id
 * @desc    Get a district by ID
 * @access  Private
 */
export const getDistrictById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const district = await District.findOne({ where: { id } });

  if (!district) throw new ApiError(404, "District not found");

  return successResponse(res, district, "District retrieved successfully");
});

/**
 * @route   POST /api/districts
 * @desc    Create a new district
 * @access  Private
 */
export const createDistrict = asyncHandler(async (req, res) => {
  const { district } = req.body;

  if (!district) throw new ApiError(400, "District name is required");

  const existing = await District.findOne({
    where: { district },
  });

  if (existing) throw new ApiError(409, "District already exists");

  const newDistrict = await District.create({ district });

  logger.info("District created", { district: newDistrict.district });

  return successResponse(res, newDistrict, "District created successfully");
});

/**
 * @route   PUT /api/districts/:id
 * @desc    Update a district
 * @access  Private
 */
export const updateDistrict = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { district, isActive } = req.body;

  const districtRecord = await District.findOne({ where: { id } });
  if (!districtRecord) throw new ApiError(404, "District not found");

  await districtRecord.update({ district, isActive });

  logger.info("District updated", { id });

  return successResponse(res, districtRecord, "District updated successfully");
});

/**
 * @route   DELETE /api/districts/:id
 * @desc    Delete a district (soft delete)
 * @access  Private
 */
export const deleteDistrict = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const districtRecord = await District.findOne({ where: { id } });
  if (!districtRecord) throw new ApiError(404, "District not found");

  await districtRecord.update({ isActive: false });

  logger.info("District deactivated", { id });

  return successResponse(res, null, "District deleted successfully");
});

/**
 * @route   GET /api/districts/:id/talukas
 * @desc    Get all talukas under a specific district
 * @access  Private
 */
export const getTalukasByDistrictId = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if district exists
  const district = await models.District.findOne({
    where: { id, isActive: true },
  });

  if (!district) throw new ApiError(404, "District not found");

  // Fetch all talukas in that district
  const talukas = await models.Taluka.findAll({
    where: { districtId: id, isActive: true },
    order: [["taluka", "ASC"]],
  });

  logger.info("Fetched talukas for district", { districtId: id, count: talukas.length });

  return successResponse(res, talukas, "Talukas retrieved successfully for this district");
});

export default {
  getAllDistricts,
  getDistrictById,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  getTalukasByDistrictId
};
