// src/controllers/admin.controller.js

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { models } from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { successResponse } from "../utils/apiResponse.js";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";

const { Admin } = models;

/* -----------------------------------------------------
   Generate Tokens
----------------------------------------------------- */
const generateTokens = (adminId, role) => {
  const accessToken = jwt.sign(
    { adminId, role },
    config.jwt.adminAccessSecret,
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { adminId },
    config.jwt.adminRefreshSecret,
    { expiresIn: "30d" }
  );

  return { accessToken, refreshToken };
};

/* -----------------------------------------------------
   Register Admin (ONLY for Superadmin)
   POST /api/admin/register
----------------------------------------------------- */
export const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role = "admin" } = req.body;

  const exists = await Admin.findOne({
    where: { email, deletedAt: null },
  });

  if (exists) throw new ApiError(409, "Admin already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await Admin.create({
    name,
    email,
    role,
    password: hashedPassword,
  });

  logger.info("Admin registered", { adminId: admin.id });

  return successResponse(res, admin.toJSON(), "Admin registered successfully");
});

/* -----------------------------------------------------
   Admin Login
   POST /api/admin/login
----------------------------------------------------- */
export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({
    where: { email, deletedAt: null },
  });

  if (!admin) throw new ApiError(401, "Invalid email or password");

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) throw new ApiError(401, "Invalid email or password");

  if (!admin.isActive) throw new ApiError(403, "Admin account is deactivated");

  const { accessToken, refreshToken } = generateTokens(admin.id, admin.role);

  // Save refresh token (optional)
  await admin.update({ refreshToken });

  logger.info("Admin logged in", { adminId: admin.id });

  return successResponse(
    res,
    {
      admin: admin.toJSON(),
      accessToken,
      refreshToken,
    },
    "Admin login successful"
  );
});

/* -----------------------------------------------------
   Refresh Token
   POST /api/admin/refresh-token
----------------------------------------------------- */
export const refreshAdminToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) throw new ApiError(400, "Refresh token is required");

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.adminRefreshSecret);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  const admin = await Admin.findOne({
    where: {
      id: decoded.adminId,
      refreshToken,
      deletedAt: null,
    },
  });

  if (!admin) throw new ApiError(401, "Invalid or expired refresh token");

  // Generate new rotation tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(
    admin.id,
    admin.role
  );

  await admin.update({ refreshToken: newRefreshToken });

  return successResponse(
    res,
    {
      accessToken,
      refreshToken: newRefreshToken,
    },
    "Token refreshed successfully"
  );
});

/* -----------------------------------------------------
   Get Admin Profile
   GET /api/admin/profile
----------------------------------------------------- */
export const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findOne({
    where: { id: req.adminId, deletedAt: null },
  });

  if (!admin) throw new ApiError(404, "Admin not found");

  return successResponse(res, admin.toJSON(), "Admin profile retrieved");
});

/* -----------------------------------------------------
   Logout Admin
   POST /api/admin/logout
----------------------------------------------------- */
export const logoutAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findOne({
    where: { id: req.adminId, deletedAt: null },
  });

  if (!admin) throw new ApiError(404, "Admin not found");

  await admin.update({ refreshToken: null });

  return successResponse(res, null, "Admin logged out successfully");
});

/* -----------------------------------------------------
   Deactivate Admin
   PUT /api/admin/deactivate
----------------------------------------------------- */
export const deactivateAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findOne({
    where: { id: req.adminId, deletedAt: null },
  });

  if (!admin) throw new ApiError(404, "Admin not found");

  await admin.update({
    isActive: false,
    refreshToken: null,
  });

  return successResponse(res, null, "Admin deactivated successfully");
});

/* -----------------------------------------------------
   List All Admins (Superadmin only)
   GET /api/admin/all
----------------------------------------------------- */
export const getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.findAll({
    where: { deletedAt: null },
  });

  return successResponse(res, admins, "Admins retrieved successfully");
});

export default {
  registerAdmin,
  loginAdmin,
  refreshAdminToken,
  getAdminProfile,
  logoutAdmin,
  deactivateAdmin,
  getAllAdmins,
};
