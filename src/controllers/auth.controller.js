import jwt from 'jsonwebtoken';
import { models } from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse, createdResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { Op } from 'sequelize';

const { User } = models;

// Constants
const OTP_EXPIRY_MINUTES = 5;
const OTP_RATE_LIMIT_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const OTP_CLEANUP_DAYS = 1;
const TOKEN_CLEANUP_DAYS = 30;

// Helper: Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper: Send OTP via SMS
import { sendOTP as sendSMSOTP } from '../utils/smsService.js';

const sendOTP = async (phoneNumber, otp) => {
  try {
    await sendSMSOTP(phoneNumber, otp);
    return true;
  } catch (error) {
    logger.error('Failed to send OTP', { phoneNumber, error: error.message });
    throw new ApiError(500, 'Failed to send OTP. Please try again.');
  }
};

// Helper: Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiry }
  );

  const refreshToken = jwt.sign(
    { userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry }
  );

  return { accessToken, refreshToken };
};

// Helper: Set refresh token cookie
const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: config.security.cookieHttpOnly,
    secure: config.security.cookieSecure,
    sameSite: config.security.cookieSameSite,
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  });
};

// Helper: Check OTP rate limit
const checkOTPRateLimit = async (user) => {
  if (!user.otpExpiresAt) return;
  
  const lastOtpTime = new Date(user.updatedAt);
  const timeSinceLastOtp = (Date.now() - lastOtpTime.getTime()) / 1000;
  
  if (timeSinceLastOtp < OTP_RATE_LIMIT_SECONDS) {
    const waitTime = Math.ceil(OTP_RATE_LIMIT_SECONDS - timeSinceLastOtp);
    throw new ApiError(429, `Please wait ${waitTime} seconds before requesting a new OTP`);
  }
};

// Helper: Validate OTP
const validateOTP = (user, otp) => {
  // Check if OTP exists
  if (!user.currentOtp || !user.otpExpiresAt) {
    throw new ApiError(401, 'No OTP found. Please request a new OTP');
  }

  // Check if OTP is already used
  if (user.otpIsUsed) {
    throw new ApiError(401, 'OTP already used. Please request a new OTP');
  }

  // Check attempts
  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    throw new ApiError(429, 'Too many failed attempts. Please request a new OTP');
  }

  // Check expiry
  if (new Date() > user.otpExpiresAt) {
    throw new ApiError(401, 'OTP expired. Please request a new OTP');
  }

  // Check OTP match
  if (user.currentOtp !== otp) {
    return false;
  }

  return true;
};

/**
 * Send OTP for registration
 * POST /api/auth/register/send-otp
 */
export const sendRegisterOTP = asyncHandler(async (req, res) => {
  const { phoneNumber, firstName, lastName } = req.body;

  // Validate required fields
  if (!phoneNumber) {
    throw new ApiError(400, 'Phone number is required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    where: { 
      phoneNumber,
      deletedAt: null 
    }
  });

  if (existingUser && existingUser.isVerified) {
    throw new ApiError(409, 'Phone number already registered. Please login instead');
  }

  // If user exists but not verified, update their info
  let user = existingUser;

  if (user) {
    // Check rate limit
    await checkOTPRateLimit(user);
  }

  // Generate OTP
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  if (user) {
    // Update existing unverified user
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      currentOtp: otp,
      otpExpiresAt: expiresAt,
      otpAttempts: 0,
      otpIsUsed: false
    });
  } else {
    // Create new user with OTP
    user = await User.create({
      phoneNumber,
      firstName,
      lastName,
      currentOtp: otp,
      otpExpiresAt: expiresAt,
      otpAttempts: 0,
      otpIsUsed: false,
      isVerified: false
    });
  }

  // Send OTP via SMS
  await sendOTP(phoneNumber, otp);

  logger.info('Registration OTP sent', { phoneNumber, userId: user.id });

  return successResponse(res, {
    phoneNumber,
    expiresIn: OTP_EXPIRY_MINUTES * 60
  }, 'OTP sent successfully');
});

/**
 * Verify OTP and register user
 * POST /api/auth/register/verify-otp
 */
export const verifyRegisterOTP = asyncHandler(async (req, res) => {
  const { phoneNumber, otp } = req.body;

  // Validate required fields
  if (!phoneNumber || !otp) {
    throw new ApiError(400, 'Phone number and OTP are required');
  }

  // Find user
  const user = await User.findOne({
    where: {
      phoneNumber,
      deletedAt: null
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found. Please request OTP first');
  }

  if (user.isVerified) {
    throw new ApiError(409, 'User already verified. Please login instead');
  }

  // Validate OTP
  const isValidOTP = validateOTP(user, otp);

  if (!isValidOTP) {
    // Increment failed attempts
    await user.increment('otpAttempts');
    const remainingAttempts = MAX_OTP_ATTEMPTS - (user.otpAttempts + 1);
    throw new ApiError(401, `Invalid OTP. ${remainingAttempts} attempts remaining`);
  }

  // Mark OTP as used and verify user
  await user.update({
    otpIsUsed: true,
    isVerified: true, 
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Store refresh token
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await user.update({
    refreshToken,
    refreshTokenExpiresAt: tokenExpiresAt,
    refreshTokenRevokedAt: null
  });

  // Set refresh token cookie
  setRefreshTokenCookie(res, refreshToken);

  logger.info('User registered successfully', { 
    userId: user.id,
    phoneNumber: user.phoneNumber 
  });

  return createdResponse(res, {
    user: user.toJSON(),
    accessToken
  }, 'Registration successful');
});

/**
 * Send OTP for login
 * POST /api/auth/login/send-otp
 */
export const sendLoginOTP = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;

  // Validate required fields
  if (!phoneNumber) {
    throw new ApiError(400, 'Phone number is required');
  }

  // Find user
  const user = await User.findOne({
    where: { 
      phoneNumber,
      deletedAt: null 
    }
  });

  if (!user) {
    throw new ApiError(404, 'Phone number not registered. Please register first');
  }

  // Check if user is verified
  if (!user.isVerified) {
    throw new ApiError(403, 'Please complete registration first');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated. Please contact support');
  }

  // Check rate limit
  await checkOTPRateLimit(user);

  // Generate OTP
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Update user with new OTP
  await user.update({
    currentOtp: otp,
    otpExpiresAt: expiresAt,
    otpAttempts: 0,
    otpIsUsed: false
  });

  // Send OTP via SMS
  await sendOTP(phoneNumber, otp);

  logger.info('Login OTP sent', { phoneNumber, userId: user.id });

  return successResponse(res, {
    phoneNumber,
    expiresIn: OTP_EXPIRY_MINUTES * 60
  }, 'OTP sent successfully');
});

/**
 * Verify OTP and login user
 * POST /api/auth/login/verify-otp
 */
export const verifyLoginOTP = asyncHandler(async (req, res) => {
  const { phoneNumber, otp } = req.body;

  // Validate required fields
  if (!phoneNumber || !otp) {
    throw new ApiError(400, 'Phone number and OTP are required');
  }

  // Find user
  const user = await User.findOne({
    where: { 
      phoneNumber,
      deletedAt: null 
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check if user is verified
  if (!user.isVerified) {
    throw new ApiError(403, 'Please complete registration first');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated. Please contact support');
  }

  // Validate OTP
  const isValidOTP = validateOTP(user, otp);

  if (!isValidOTP) {
    // Increment failed attempts
    await user.increment('otpAttempts');
    const remainingAttempts = MAX_OTP_ATTEMPTS - (user.otpAttempts + 1);
    throw new ApiError(401, `Invalid OTP. ${remainingAttempts} attempts remaining`);
  }

  // Mark OTP as used
  await user.update({ otpIsUsed: true });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Store refresh token
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await user.update({
    refreshToken,
    refreshTokenExpiresAt: tokenExpiresAt,
    refreshTokenRevokedAt: null,
    lastLogin: new Date()
  });

  // Set refresh token cookie
  setRefreshTokenCookie(res, refreshToken);

  logger.info('User logged in successfully', { 
    userId: user.id,
    phoneNumber: user.phoneNumber 
  });

  return successResponse(res, {
    user: user.toJSON(),
    accessToken
  }, 'Login successful');
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token required');
  }

  // Verify refresh token JWT
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  // Find user with matching refresh token
  const user = await User.findOne({
    where: {
      id: decoded.userId,
      refreshToken,
      deletedAt: null
    }
  });

  if (!user) {
    throw new ApiError(401, 'Refresh token not found or invalid');
  }

  // Check if token is revoked
  if (user.refreshTokenRevokedAt) {
    throw new ApiError(401, 'Refresh token has been revoked');
  }

  // Check if token is expired
  if (user.refreshTokenExpiresAt && new Date() > user.refreshTokenExpiresAt) {
    throw new ApiError(401, 'Refresh token expired');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated');
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

  // Store new refresh token and revoke old one
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await user.update({
    refreshToken: newRefreshToken,
    refreshTokenExpiresAt: expiresAt,
    refreshTokenRevokedAt: null
  });

  // Set new refresh token cookie
  setRefreshTokenCookie(res, newRefreshToken);

  logger.info('Access token refreshed', { userId: user.id });

  return successResponse(res, {
    accessToken
  }, 'Token refreshed successfully');
});

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const userId = req.userId;

  if (refreshToken && userId) {
    // Revoke refresh token
    await User.update(
      { 
        refreshTokenRevokedAt: new Date() 
      },
      {
        where: {
          id: userId,
          refreshToken,
          refreshTokenRevokedAt: null
        }
      }
    );
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: config.security.cookieHttpOnly,
    secure: config.security.cookieSecure,
    sameSite: config.security.cookieSameSite
  });

  logger.info('User logged out successfully', { userId });

  return successResponse(res, null, 'Logout successful');
});

/**
 * Logout from all devices
 * POST /api/auth/logout-all
 */
export const logoutAll = asyncHandler(async (req, res) => {
  const userId = req.userId;

  // Revoke refresh token (effectively logging out from all devices)
  await User.update(
    { 
      refreshTokenRevokedAt: new Date(),
      refreshToken: null,
      refreshTokenExpiresAt: null
    },
    {
      where: {
        id: userId
      }
    }
  );

  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: config.security.cookieHttpOnly,
    secure: config.security.cookieSecure,
    sameSite: config.security.cookieSameSite
  });

  logger.info('User logged out from all devices', { userId });

  return successResponse(res, null, 'Logged out from all devices successfully');
});

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    where: {
      id: req.userId,
      deletedAt: null
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return successResponse(res, user.toJSON(), 'User retrieved successfully');
});

/**
 * Resend OTP (works for both registration and login)
 * POST /api/auth/resend-otp
 */
export const resendOTP = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    throw new ApiError(400, 'Phone number is required');
  }

  // Find user
  const user = await User.findOne({
    where: { 
      phoneNumber,
      deletedAt: null 
    }
  });

  if (!user) {
    throw new ApiError(404, 'Phone number not registered');
  }

  // Check rate limit
  await checkOTPRateLimit(user);

  // Generate new OTP
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Update user with new OTP
  await user.update({
    currentOtp: otp,
    otpExpiresAt: expiresAt,
    otpAttempts: 0,
    otpIsUsed: false
  });

  // Send OTP via SMS
  await sendOTP(phoneNumber, otp);

  logger.info('OTP resent', { phoneNumber, userId: user.id });

  return successResponse(res, {
    phoneNumber,
    expiresIn: OTP_EXPIRY_MINUTES * 60
  }, 'OTP resent successfully');
});

/**
 * Cleanup expired OTPs and tokens (run as cron job)
 * This can be called manually or scheduled
 */
export const cleanupExpiredData = async () => {
  try {
    // Cleanup expired/used OTPs (older than 1 day)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - OTP_CLEANUP_DAYS);
    
    const otpCleanupResult = await User.update(
      {
        currentOtp: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        otpIsUsed: false
      },
      {
        where: {
          [Op.or]: [
            { otpExpiresAt: { [Op.lt]: new Date() } },
            { otpIsUsed: true },
            { updatedAt: { [Op.lt]: oneDayAgo } }
          ],
          currentOtp: { [Op.ne]: null }
        }
      }
    );

    // Cleanup revoked refresh tokens (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - TOKEN_CLEANUP_DAYS);
    
    const tokenCleanupResult = await User.update(
      {
        refreshToken: null,
        refreshTokenExpiresAt: null
      },
      {
        where: {
          [Op.or]: [
            { refreshTokenExpiresAt: { [Op.lt]: new Date() } },
            { refreshTokenRevokedAt: { [Op.lt]: thirtyDaysAgo } }
          ],
          refreshToken: { [Op.ne]: null }
        }
      }
    );

    logger.info('Expired data cleaned up', { 
      otpsCleared: otpCleanupResult[0],
      tokensCleared: tokenCleanupResult[0]
    });
    
    return { 
      otpsCleared: otpCleanupResult[0],
      tokensCleared: tokenCleanupResult[0]
    };
  } catch (error) {
    logger.error('Error cleaning up expired data', { error: error.message });
    throw error;
  }
};

export default {
  sendRegisterOTP,
  verifyRegisterOTP,
  sendLoginOTP,
  verifyLoginOTP,
  refreshToken,
  resendOTP,
  logout,
  logoutAll,
  getCurrentUser,
  cleanupExpiredData
};