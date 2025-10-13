import bcrypt from 'bcrypt';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import * as userModel from '../models/user.model.js';
import * as tokenService from './token.service.js';

/**
 * Hash password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(config.bcrypt.rounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    logger.error('Error hashing password', { error: error.message });
    throw new Error('Error processing password');
  }
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Match result
 */
export const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Error comparing password', { error: error.message });
    throw new Error('Error verifying password');
  }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User and tokens
 */
export const registerUser = async ({ email, password, firstName, lastName }) => {
  try {
    // Check if email already exists
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await userModel.createUser({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName
    });

    // Generate tokens
    const { accessToken, refreshToken } = await tokenService.generateAuthTokens(user.id);

    // Store refresh token
    const refreshTokenExpiry = tokenService.getRefreshTokenExpiry();
    await userModel.storeRefreshToken(user.id, refreshToken, refreshTokenExpiry);

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  } catch (error) {
    logger.error('Registration error', { error: error.message, email });
    throw error;
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User and tokens
 */
export const loginUser = async (email, password) => {
  try {
    // Find user by email
    const user = await userModel.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Failed login attempt', { email });
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await tokenService.generateAuthTokens(user.id);

    // Store refresh token
    const refreshTokenExpiry = tokenService.getRefreshTokenExpiry();
    await userModel.storeRefreshToken(user.id, refreshToken, refreshTokenExpiry);

    // Update last login
    await userModel.updateLastLogin(user.id);

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  } catch (error) {
    logger.error('Login error', { error: error.message, email });
    throw error;
  }
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New tokens
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const payload = tokenService.verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const storedToken = await userModel.findRefreshToken(refreshToken);
    if (!storedToken) {
      throw new Error('Invalid refresh token');
    }

    // Check if token is expired
    if (new Date(storedToken.expires_at) < new Date()) {
      throw new Error('Refresh token expired');
    }

    // Get user
    const user = await userModel.findUserById(payload.userId);
    if (!user || !user.is_active) {
      throw new Error('User not found or inactive');
    }

    // Revoke old refresh token
    await userModel.revokeRefreshToken(refreshToken);

    // Generate new tokens
    const newTokens = await tokenService.generateAuthTokens(user.id);

    // Store new refresh token
    const refreshTokenExpiry = tokenService.getRefreshTokenExpiry();
    await userModel.storeRefreshToken(user.id, newTokens.refreshToken, refreshTokenExpiry);

    logger.info('Access token refreshed', { userId: user.id });

    return newTokens;
  } catch (error) {
    logger.error('Token refresh error', { error: error.message });
    throw error;
  }
};

/**
 * Logout user
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<void>}
 */
export const logoutUser = async (refreshToken) => {
  try {
    if (refreshToken) {
      await userModel.revokeRefreshToken(refreshToken);
      logger.info('User logged out successfully');
    }
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    throw error;
  }
};

/**
 * Logout user from all devices
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const logoutAllDevices = async (userId) => {
  try {
    await userModel.revokeAllUserTokens(userId);
    logger.info('User logged out from all devices', { userId });
  } catch (error) {
    logger.error('Logout all devices error', { error: error.message, userId });
    throw error;
  }
};

export default {
  hashPassword,
  comparePassword,
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices
};