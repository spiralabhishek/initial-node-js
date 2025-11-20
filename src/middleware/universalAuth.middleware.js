// src/middleware/universalAuth.middleware.js

import jwt from "jsonwebtoken";
import { models } from "../config/database.js";
import { config } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const { User, Admin } = models;

export const universalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Access token required");
  }

  const token = authHeader.substring(7);

  // 1️⃣ Try User token
  try {
    const decodedUser = jwt.verify(token, config.jwt.accessSecret);

    const user = await User.findOne({
      where: { id: decodedUser.userId, deletedAt: null, isActive: true },
    });

    if (user) {
      req.userId = user.id;
      req.user = user.toJSON();
      return next();
    }
  } catch (err) {
    // ignore, try admin next
  }

  // 2️⃣ Try Admin token
  try {
    const decodedAdmin = jwt.verify(token, config.jwt.adminAccessSecret);

    const admin = await Admin.findOne({
      where: { id: decodedAdmin.adminId, deletedAt: null, isActive: true },
    });

    if (admin) {
      req.adminId = admin.id;
      req.admin = admin.toJSON();
      return next();
    }
  } catch (err) {
    // ignore
  }

  // If both failed
  throw new ApiError(401, "Invalid or expired token");
});
