import { models } from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../config/logger.js";

const { Taluka, District } = models;

/**
 * @route   GET /api/talukas
 * @desc    Get all talukas (with district info)
 * @access  Private
 */
export const getAllTalukas = asyncHandler(async (req, res) => {
  const talukas = await Taluka.findAll({
    where: { isActive: true },
    include: [{ model: District, as: "district", attributes: ["id", "district"] }],
    order: [["taluka", "ASC"]],
  });

  logger.info("Fetched all talukas", { count: talukas.length });

  return successResponse(res, talukas, "Talukas retrieved successfully");
});

/**
 * @route   GET /api/talukas/:id
 * @desc    Get a single taluka by ID
 * @access  Private
 */
export const getTalukaById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const taluka = await Taluka.findOne({
    where: { id },
    include: [{ model: District, as: "district", attributes: ["id", "district"] }],
  });

  if (!taluka) throw new ApiError(404, "Taluka not found");

  return successResponse(res, taluka, "Taluka retrieved successfully");
});

/**
 * @route   POST /api/talukas
 * @desc    Create new taluka
 * @access  Private
 */
export const createTaluka = asyncHandler(async (req, res) => {
  const { taluka, districtId } = req.body;

  if (!taluka || !districtId) throw new ApiError(400, "Taluka and districtId are required");

  const district = await District.findByPk(districtId);
  if (!district) throw new ApiError(404, "District not found");

  const existing = await Taluka.findOne({ where: { taluka, districtId } });
  if (existing) throw new ApiError(409, "Taluka already exists in this district");

  const newTaluka = await Taluka.create({ taluka, districtId });

  logger.info("Taluka created", { taluka: newTaluka.taluka, districtId });

  return successResponse(res, newTaluka, "Taluka created successfully");
});

/**
 * @route   PUT /api/talukas/:id
 * @desc    Update a taluka
 * @access  Private
 */
export const updateTaluka = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { taluka, districtId, isActive } = req.body;

  const talukaRecord = await Taluka.findByPk(id);
  if (!talukaRecord) throw new ApiError(404, "Taluka not found");

  if (districtId) {
    const district = await District.findByPk(districtId);
    if (!district) throw new ApiError(404, "New district not found");
  }

  await talukaRecord.update({ taluka, districtId, isActive });

  logger.info("Taluka updated", { id });

  return successResponse(res, talukaRecord, "Taluka updated successfully");
});

/**
 * @route   DELETE /api/talukas/:id
 * @desc    Soft delete a taluka (set isActive=false)
 * @access  Private
 */
export const deleteTaluka = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const talukaRecord = await Taluka.findByPk(id);
  if (!talukaRecord) throw new ApiError(404, "Taluka not found");

  await talukaRecord.update({ isActive: false });

  logger.info("Taluka deactivated", { id });

  return successResponse(res, null, "Taluka deleted successfully");
});

export default {
  getAllTalukas,
  getTalukaById,
  createTaluka,
  updateTaluka,
  deleteTaluka,
};
