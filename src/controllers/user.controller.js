import * as userModel from '../models/user.model.js';
import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse, noContentResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';

/**
 * Get user profile
 * GET /api/users/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await userModel.findUserById(req.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Remove sensitive data
  const { password, ...userWithoutPassword } = user;

  logger.info('User profile retrieved', { userId: req.userId });

  return successResponse(res, userWithoutPassword, 'Profile retrieved successfully');
});

/**
 * Update user profile
 * PUT /api/users/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, email } = req.body;
  
  const updates = {};
  if (firstName) updates.first_name = firstName;
  if (lastName) updates.last_name = lastName;
  if (email) updates.email = email.toLowerCase();

  // Check if email is being changed and if it already exists
  if (email && email.toLowerCase() !== req.user.email) {
    const emailExists = await userModel.emailExists(email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    }
  }

  const updatedUser = await userModel.updateUser(req.userId, updates);

  logger.info('User profile updated', { 
    userId: req.userId,
    updates: Object.keys(updates)
  });

  return successResponse(res, updatedUser, 'Profile updated successfully');
});

/**
 * Change password
 * PUT /api/users/password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await userModel.findUserById(req.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Verify current password
  const isPasswordValid = await authService.comparePassword(currentPassword, user.password);

  if (!isPasswordValid) {
    logger.warn('Password change failed - invalid current password', { 
      userId: req.userId 
    });
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Hash new password
  const hashedPassword = await authService.hashPassword(newPassword);

  // Update password
  await userModel.updateUser(req.userId, { password: hashedPassword });

  // Revoke all existing tokens for security
  await userModel.revokeAllUserTokens(req.userId);

  logger.info('Password changed successfully', { userId: req.userId });

  return successResponse(res, null, 'Password changed successfully. Please login again.');
});

/**
 * Delete user account
 * DELETE /api/users/account
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  // Get user with password
  const user = await userModel.findUserById(req.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Verify password before deletion
  const isPasswordValid = await authService.comparePassword(password, user.password);

  if (!isPasswordValid) {
    logger.warn('Account deletion failed - invalid password', { 
      userId: req.userId 
    });
    return res.status(401).json({
      success: false,
      message: 'Invalid password'
    });
  }

  // Soft delete user
  await userModel.deleteUser(req.userId);

  // Revoke all tokens
  await userModel.revokeAllUserTokens(req.userId);

  logger.info('User account deleted', { userId: req.userId });

  return successResponse(res, null, 'Account deleted successfully');
});

/**
 * Get user by ID (admin only - for future use)
 * GET /api/users/:id
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await userModel.findUserById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Remove sensitive data
  const { password, ...userWithoutPassword } = user;

  return successResponse(res, userWithoutPassword, 'User retrieved successfully');
});

export default {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getUserById
};