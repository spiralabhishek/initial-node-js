// src/middleware/adminAuth.middleware.js
import jwt from 'jsonwebtoken';
import { models } from '../config/database.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const { Admin } = models;

/**
 * Authenticate admin via JWT token
 */
export const adminAuthenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Admin access token required");
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.adminAccessSecret);

    const admin = await Admin.findOne({
      where: {
        id: decoded.adminId,
        deletedAt: null,
        isActive: true,
      },
    });

    if (!admin) throw new ApiError(401, "Admin not found or inactive");

    req.adminId = admin.id;
    req.admin = admin.toJSON();

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") throw new ApiError(401, "Invalid admin token");
    if (error.name === "TokenExpiredError") throw new ApiError(401, "Admin token expired");
    throw error;
  }
});

/**
 * Role-based access control for admins
 * Example: adminRole("superadmin") or adminRole("admin", "editor")
 */
export const adminRole = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.admin) throw new ApiError(401, "Admin authentication required");

    if (!roles.includes(req.admin.role)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }

    next();
  });
};

/**
 * Optional admin authentication
 */
export const optionalAdminAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.adminAccessSecret);

    const admin = await Admin.findOne({
      where: {
        id: decoded.adminId,
        deletedAt: null,
        isActive: true,
      },
    });

    if (admin) {
      req.adminId = admin.id;
      req.admin = admin.toJSON();
    }
  } catch (err) {
    // Optional fail silently
  }

  next();
});

export default {
  adminAuthenticate,
  adminRole,
  optionalAdminAuth,
};
