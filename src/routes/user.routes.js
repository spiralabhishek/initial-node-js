import express from 'express';
import * as userController from '../controllers/user.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';
import * as validationMiddleware from '../middleware/validation.middleware.js';
import { body } from 'express-validator';

const router = express.Router();

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
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  validationMiddleware.updateProfileValidation,
  userController.updateProfile
);

/**
 * @route   PUT /api/users/password
 * @desc    Change user password
 * @access  Private
 */
router.put(
  '/password',
  validationMiddleware.changePasswordValidation,
  userController.changePassword
);

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete(
  '/account',
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required for account deletion'),
    validationMiddleware.handleValidationErrors
  ],
  userController.deleteAccount
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (for future admin use)
 * @access  Private
 */
router.get(
  '/:id',
  validationMiddleware.validateUUID('id'),
  userController.getUserById
);

export default router;