import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';
import * as securityMiddleware from '../middleware/security.middleware.js';
import * as validationMiddleware from '../middleware/validation.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register/send-otp
 * @desc    Send OTP for registration
 * @access  Public
 */
router.post(
  '/register/send-otp',
  securityMiddleware.registerLimiter,
  validationMiddleware.sendRegisterOTPValidation,
  authController.sendRegisterOTP
);

/**
 * @route   POST /api/auth/register/verify-otp
 * @desc    Verify OTP and complete registration
 * @access  Public
 */
router.post(
  '/register/verify-otp',
  securityMiddleware.registerLimiter,
  validationMiddleware.verifyRegisterOTPValidation,
  authController.verifyRegisterOTP
);

/**
 * @route   POST /api/auth/login/send-otp
 * @desc    Send OTP for login
 * @access  Public
 */
router.post(
  '/login/send-otp',
  securityMiddleware.authLimiter,
  validationMiddleware.sendLoginOTPValidation,
  authController.sendLoginOTP
);

router.post(
  '/login/resend-otp',
  securityMiddleware.authLimiter,
  validationMiddleware.sendLoginOTPValidation,
  authController.resendOTP
);

/**
 * @route   POST /api/auth/login/verify-otp
 * @desc    Verify OTP and login
 * @access  Public
 */
router.post(
  '/login/verify-otp',
  securityMiddleware.authLimiter,
  validationMiddleware.verifyLoginOTPValidation,
  authController.verifyLoginOTP
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