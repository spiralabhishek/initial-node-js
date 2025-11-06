import jwt from 'jsonwebtoken';
import { models } from '../config/database.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const { User } = models;

/**
 * Authenticate user via JWT token
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Access token required');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    // Find user
    const user = await User.findOne({
      where: {
        id: decoded.userId,
        deletedAt: null
      }
    });

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated');
    }

    // Attach user info to request
    req.userId = user.id;
    req.user = user.toJSON();

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired');
    }
    throw error;
  }
});

/**
 * Check if user is verified
 */
export const requireVerified = asyncHandler(async (req, res, next) => {
  if (!req.user.isVerified) {
    throw new ApiError(403, 'Email verification required');
  }
  next();
});

/**
 * Optional authentication (doesn't throw error if no token)
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    const user = await User.findOne({
      where: {
        id: decoded.userId,
        deletedAt: null,
        isActive: true
      }
    });

    if (user) {
      req.userId = user.id;
      req.user = user.toJSON();
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
});

export default {
  authenticate,
  requireVerified,
  optionalAuth
};