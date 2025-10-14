import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse, createdResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  const result = await authService.registerUser({
    email,
    password,
    firstName,
    lastName
  });

  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: config.security.cookieHttpOnly,
    secure: config.security.cookieSecure,
    sameSite: config.security.cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  logger.info('User registered successfully', { 
    userId: result.user.id,
    email: result.user.email 
  });

  return createdResponse(res, {
    user: result.user,
    accessToken: result.accessToken
  }, 'Registration successful');
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.loginUser(email, password);

  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: config.security.cookieHttpOnly,
    secure: config.security.cookieSecure,
    sameSite: config.security.cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  logger.info('User logged in successfully', { 
    userId: result.user.id,
    email: result.user.email 
  });

  return successResponse(res, {
    user: result.user,
    accessToken: result.accessToken
  }, 'Login successful');
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token required'
    });
  }

  const result = await authService.refreshAccessToken(refreshToken);

  // Set new refresh token as HTTP-only cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: config.security.cookieHttpOnly,
    secure: config.security.cookieSecure,
    sameSite: config.security.cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  logger.info('Access token refreshed');

  return successResponse(res, {
    accessToken: result.accessToken
  }, 'Token refreshed successfully');
});

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (refreshToken) {
    await authService.logoutUser(refreshToken);
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  logger.info('User logged out successfully', { userId: req.userId });

  return successResponse(res, null, 'Logout successful');
});

/**
 * Logout from all devices
 * POST /api/auth/logout-all
 */
export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAllDevices(req.userId);

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  logger.info('User logged out from all devices', { userId: req.userId });

  return successResponse(res, null, 'Logged out from all devices');
});

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  return successResponse(res, req.user, 'User retrieved successfully');
});

export default {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getCurrentUser
};