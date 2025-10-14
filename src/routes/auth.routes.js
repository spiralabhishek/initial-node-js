import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';
import * as securityMiddleware from '../middleware/security.middleware.js';
import * as validationMiddleware from '../middleware/validation.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  securityMiddleware.registerLimiter,
  validationMiddleware.registerValidation,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  securityMiddleware.authLimiter,
  validationMiddleware.loginValidation,
  authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  validationMiddleware.refreshTokenValidation,
  authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authMiddleware.authenticate,
  authController.logout
);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post(
  '/logout-all',
  authMiddleware.authenticate,
  authController.logoutAll
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get(
  '/me',
  authMiddleware.authenticate,
  authController.getCurrentUser
);

export default router;