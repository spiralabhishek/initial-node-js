import * as tokenService from '../services/token.service.js';
import * as userModel from '../models/user.model.js';
import { logger } from '../config/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Extract token from request header
 * @param {Object} req - Express request object
 * @returns {string|null} Token or null
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Authenticate user using JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  // Extract token from header
  const token = extractToken(req);

  if (!token) {
    logger.warn('Authentication failed: No token provided', {
      ip: req.ip,
      path: req.path
    });
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    // Verify token
    const payload = tokenService.verifyAccessToken(token);

    // Get user from database
    const user = await userModel.findUserById(payload.userId);

    if (!user) {
      logger.warn('Authentication failed: User not found', {
        userId: payload.userId,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    if (!user.is_active) {
      logger.warn('Authentication failed: User inactive', {
        userId: user.id,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach user to request object (without password)
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    req.userId = user.id;

    logger.debug('User authenticated', { userId: user.id });
    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error.message,
      ip: req.ip,
      path: req.path
    });

    return res.status(401).json({
      success: false,
      message: error.message === 'Token expired' ? 'Token expired' : 'Invalid authentication token'
    });
  }
});

/**
 * Optional authentication - doesn't fail if no token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  try {
    const payload = tokenService.verifyAccessToken(token);
    const user = await userModel.findUserById(payload.userId);

    if (user && user.is_active) {
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
      req.userId = user.id;
    }
  } catch (error) {
    // Silent fail for optional auth
    logger.debug('Optional auth failed', { error: error.message });
  }

  next();
});

/**
 * Check if user has specific role (for future role-based access)
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.id,
        requiredRoles: roles,
        userRole: req.user.role
      });

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  });
};

/**
 * Verify refresh token from cookie or body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const verifyRefreshToken = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token required'
    });
  }

  try {
    const payload = tokenService.verifyRefreshToken(refreshToken);
    req.refreshToken = refreshToken;
    req.userId = payload.userId;
    next();
  } catch (error) {
    logger.warn('Refresh token verification failed', {
      error: error.message,
      ip: req.ip
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
});

export default {
  authenticate,
  optionalAuthenticate,
  authorize,
  verifyRefreshToken
};