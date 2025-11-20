import express from 'express';
import * as userController from '../controllers/user.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation.middleware.js';
import { adminAuthenticate } from '../middleware/adminAuth.middleware.js';

const router = express.Router();

router.get('/all', adminAuthenticate, userController.getAllUsers);

// All routes require authentication
router.use(authMiddleware.authenticate);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile (firstName, lastName, email)
 * @access  Private
 */
router.put(
  '/profile',
  [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email').optional().trim().isEmail().withMessage('Invalid email address').normalizeEmail(),
    handleValidationErrors
  ],
  userController.updateProfile
);

/**
 * @route   POST /api/users/phone/send-otp
 * @desc    Send OTP to new phone number for verification
 * @access  Private
 */
router.post(
  '/phone/send-otp',
  [
    body('newPhoneNumber')
      .notEmpty()
      .withMessage('New phone number is required')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
    handleValidationErrors
  ],
  userController.sendPhoneUpdateOTP
);

/**
 * @route   POST /api/users/phone/verify-otp
 * @desc    Verify OTP and update phone number
 * @access  Private
 */
router.post(
  '/phone/verify-otp',
  [
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
    handleValidationErrors
  ],
  userController.verifyPhoneUpdateOTP
);

/**
 * @route   PUT /api/users/deactivate
 * @desc    Deactivate user account (soft disable)
 * @access  Private
 */
router.put('/deactivate', userController.deactivateAccount);

/**
 * @route   PUT /api/users/reactivate
 * @desc    Reactivate deactivated account with OTP
 * @access  Public (no auth required as account is deactivated)
 */
router.put(
  '/reactivate',
  [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
    handleValidationErrors
  ],
  userController.reactivateAccount
);

/**
 * @route   POST /api/users/account/delete-otp
 * @desc    Request OTP for account deletion
 * @access  Private
 */
router.post('/account/delete-otp', userController.sendDeleteAccountOTP);

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account (soft delete) with OTP verification
 * @access  Private
 */
router.delete(
  '/account',
  [
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
    handleValidationErrors
  ],
  userController.deleteAccount
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (admin only - for future use)
 * @access  Private
 */
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid user ID'), handleValidationErrors],
  userController.getUserById
);

export default router;
