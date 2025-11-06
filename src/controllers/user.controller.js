import { models } from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/apiError.js';

const { User } = models;

/**
 * Get user profile
 * GET /api/users/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    where: {
      id: req.userId,
      deletedAt: null
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  logger.info('User profile retrieved', { userId: req.userId });

  return successResponse(res, user.toJSON(), 'Profile retrieved successfully');
});

/**
 * Update user profile
 * PUT /api/users/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, email } = req.body;

  // Find user
  const user = await User.findOne({
    where: {
      id: req.userId,
      deletedAt: null
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Build updates object
  const updates = {};
  if (firstName !== undefined) updates.firstName = firstName;
  if (lastName !== undefined) updates.lastName = lastName;
  
  // Check if email is being changed and if it already exists
  if (email && email.toLowerCase() !== user.email) {
    const emailExists = await User.findOne({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
        id: { [await import('sequelize').then(m => m.Op.ne)]: req.userId }
      }
    });

    if (emailExists) {
      throw new ApiError(409, 'Email already in use');
    }

    updates.email = email.toLowerCase();
  }

  // Check if there are any updates
  if (Object.keys(updates).length === 0) {
    return successResponse(res, user.toJSON(), 'No changes to update');
  }

  // Update user
  await user.update(updates);

  logger.info('User profile updated', { 
    userId: req.userId,
    updates: Object.keys(updates)
  });

  return successResponse(res, user.toJSON(), 'Profile updated successfully');
});

/**
 * Update phone number - Send OTP
 * POST /api/users/phone/send-otp
 */
export const sendPhoneUpdateOTP = asyncHandler(async (req, res) => {
  const { newPhoneNumber } = req.body;

  if (!newPhoneNumber) {
    throw new ApiError(400, 'New phone number is required');
  }

  // Find current user
  const user = await User.findOne({
    where: {
      id: req.userId,
      deletedAt: null
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check if new phone number is same as current
  if (user.phoneNumber === newPhoneNumber) {
    throw new ApiError(400, 'New phone number is same as current phone number');
  }

  // Check if new phone number already exists
  const phoneExists = await User.findOne({
    where: {
      phoneNumber: newPhoneNumber,
      deletedAt: null
    }
  });

  if (phoneExists) {
    throw new ApiError(409, 'Phone number already in use');
  }

  // Check rate limit
  if (user.otpExpiresAt) {
    const lastOtpTime = new Date(user.updatedAt);
    const timeSinceLastOtp = (Date.now() - lastOtpTime.getTime()) / 1000;
    
    if (timeSinceLastOtp < 60) {
      const waitTime = Math.ceil(60 - timeSinceLastOtp);
      throw new ApiError(429, `Please wait ${waitTime} seconds before requesting a new OTP`);
    }
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Store OTP and new phone number temporarily
  await user.update({
    currentOtp: otp,
    otpExpiresAt: expiresAt,
    otpAttempts: 0,
    otpIsUsed: false,
    // Store new phone in a temp field - we'll use email field temporarily
    // In production, you might want to add a 'pendingPhoneNumber' field
    tempData: JSON.stringify({ newPhoneNumber })
  });

  // Send OTP via SMS (implement your SMS service)
  // await sendSMSOTP(newPhoneNumber, otp);

  logger.info('Phone update OTP sent', { 
    userId: req.userId,
    newPhoneNumber 
  });

  return successResponse(res, {
    expiresIn: 300
  }, 'OTP sent to new phone number');
});

/**
 * Update phone number - Verify OTP
 * POST /api/users/phone/verify-otp
 */
export const verifyPhoneUpdateOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    throw new ApiError(400, 'OTP is required');
  }

  // Find user
  const user = await User.findOne({
    where: {
      id: req.userId,
      deletedAt: null
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Validate OTP
  if (!user.currentOtp || !user.otpExpiresAt) {
    throw new ApiError(401, 'No OTP found. Please request a new OTP');
  }

  if (user.otpIsUsed) {
    throw new ApiError(401, 'OTP already used. Please request a new OTP');
  }

  if (user.otpAttempts >= 5) {
    throw new ApiError(429, 'Too many failed attempts. Please request a new OTP');
  }

  if (new Date() > user.otpExpiresAt) {
    throw new ApiError(401, 'OTP expired. Please request a new OTP');
  }

  if (user.currentOtp !== otp) {
    await user.increment('otpAttempts');
    const remainingAttempts = 5 - (user.otpAttempts + 1);
    throw new ApiError(401, `Invalid OTP. ${remainingAttempts} attempts remaining`);
  }

  // Get new phone number from temp storage
  let tempData;
  try {
    tempData = JSON.parse(user.tempData || '{}');
  } catch (e) {
    throw new ApiError(400, 'Invalid request. Please start over');
  }

  const { newPhoneNumber } = tempData;

  if (!newPhoneNumber) {
    throw new ApiError(400, 'No pending phone update found');
  }

  // Update phone number and clear OTP data
  await user.update({
    phoneNumber: newPhoneNumber,
    currentOtp: null,
    otpExpiresAt: null,
    otpAttempts: 0,
    otpIsUsed: false,
    tempData: null
  });

  logger.info('Phone number updated successfully', { 
    userId: req.userId,
    newPhoneNumber 
  });

  return successResponse(res, user.toJSON(), 'Phone number updated successfully');
});

/**
 * Deactivate account (soft disable)
 * PUT /api/users/deactivate
 */
export const deactivateAccount = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    where: {
      id: req.userId,
      deletedAt: null
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!user.isActive) {
    throw new ApiError(400, 'Account is already deactivated');
  }

  // Deactivate account
  await user.update({ 
    isActive: false,
    refreshTokenRevokedAt: new Date()
  });

  logger.info('User account deactivated', { userId: req.userId });

  return successResponse(res, null, 'Account deactivated successfully');
});

/**
 * Reactivate account
 * PUT /api/users/reactivate
 */
export const reactivateAccount = asyncHandler(async (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    throw new ApiError(400, 'Phone number and OTP are required');
  }

  const user = await User.findOne({
    where: {
      phoneNumber,
      deletedAt: null
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.isActive) {
    throw new ApiError(400, 'Account is already active');
  }

  // Validate OTP (similar to login)
  if (!user.currentOtp || !user.otpExpiresAt) {
    throw new ApiError(401, 'No OTP found. Please request OTP first');
  }

  if (user.otpIsUsed) {
    throw new ApiError(401, 'OTP already used. Please request a new OTP');
  }

  if (user.otpAttempts >= 5) {
    throw new ApiError(429, 'Too many failed attempts. Please request a new OTP');
  }

  if (new Date() > user.otpExpiresAt) {
    throw new ApiError(401, 'OTP expired. Please request a new OTP');
  }

  if (user.currentOtp !== otp) {
    await user.increment('otpAttempts');
    const remainingAttempts = 5 - (user.otpAttempts + 1);
    throw new ApiError(401, `Invalid OTP. ${remainingAttempts} attempts remaining`);
  }

  // Reactivate account
  await user.update({ 
    isActive: true,
    otpIsUsed: true 
  });

  logger.info('User account reactivated', { userId: user.id });

  return successResponse(res, user.toJSON(), 'Account reactivated successfully');
});

/**
 * Delete user account (soft delete)
 * DELETE /api/users/account
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    throw new ApiError(400, 'OTP is required for account deletion');
  }

  // Find user
  const user = await User.findOne({
    where: {
      id: req.userId,
      deletedAt: null
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Validate OTP
  if (!user.currentOtp || !user.otpExpiresAt) {
    throw new ApiError(401, 'No OTP found. Please request OTP first');
  }

  if (user.otpIsUsed) {
    throw new ApiError(401, 'OTP already used. Please request a new OTP');
  }

  if (user.otpAttempts >= 5) {
    throw new ApiError(429, 'Too many failed attempts. Please request a new OTP');
  }

  if (new Date() > user.otpExpiresAt) {
    throw new ApiError(401, 'OTP expired. Please request a new OTP');
  }

  if (user.currentOtp !== otp) {
    await user.increment('otpAttempts');
    const remainingAttempts = 5 - (user.otpAttempts + 1);
    throw new ApiError(401, `Invalid OTP. ${remainingAttempts} attempts remaining`);
  }

  // Soft delete user
  await user.update({ 
    deletedAt: new Date(),
    isActive: false,
    refreshTokenRevokedAt: new Date()
  });

  logger.info('User account deleted', { userId: req.userId });

  return successResponse(res, null, 'Account deleted successfully');
});

/**
 * Request account deletion OTP
 * POST /api/users/account/delete-otp
 */
export const sendDeleteAccountOTP = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    where: {
      id: req.userId,
      deletedAt: null
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check rate limit
  if (user.otpExpiresAt) {
    const lastOtpTime = new Date(user.updatedAt);
    const timeSinceLastOtp = (Date.now() - lastOtpTime.getTime()) / 1000;
    
    if (timeSinceLastOtp < 60) {
      const waitTime = Math.ceil(60 - timeSinceLastOtp);
      throw new ApiError(429, `Please wait ${waitTime} seconds before requesting a new OTP`);
    }
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await user.update({
    currentOtp: otp,
    otpExpiresAt: expiresAt,
    otpAttempts: 0,
    otpIsUsed: false
  });

  // Send OTP via SMS
  // await sendSMSOTP(user.phoneNumber, otp);

  logger.info('Account deletion OTP sent', { userId: req.userId });

  return successResponse(res, {
    expiresIn: 300
  }, 'OTP sent to your phone number');
});

/**
 * Get user by ID (admin only - for future use)
 * GET /api/users/:id
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findOne({
    where: {
      id,
      deletedAt: null
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return successResponse(res, user.toJSON(), 'User retrieved successfully');
});

export default {
  getProfile,
  updateProfile,
  sendPhoneUpdateOTP,
  verifyPhoneUpdateOTP,
  deactivateAccount,
  reactivateAccount,
  sendDeleteAccountOTP,
  deleteAccount,
  getUserById
};