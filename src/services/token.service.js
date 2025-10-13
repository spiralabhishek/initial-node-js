import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Generate access token
 * @param {string} userId - User ID
 * @returns {string} JWT access token
 */
export const generateAccessToken = (userId) => {
  try {
    const payload = {
      userId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry,
      issuer: config.app.name,
      audience: config.app.name
    });

    return token;
  } catch (error) {
    logger.error('Error generating access token', { error: error.message, userId });
    throw new Error('Error generating access token');
  }
};

/**
 * Generate refresh token
 * @param {string} userId - User ID
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (userId) => {
  try {
    const payload = {
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry,
      issuer: config.app.name,
      audience: config.app.name
    });

    return token;
  } catch (error) {
    logger.error('Error generating refresh token', { error: error.message, userId });
    throw new Error('Error generating refresh token');
  }
};

/**
 * Generate both access and refresh tokens
 * @param {string} userId - User ID
 * @returns {Object} Object containing access and refresh tokens
 */
export const generateAuthTokens = (userId) => {
  try {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    return {
      accessToken,
      refreshToken
    };
  } catch (error) {
    logger.error('Error generating auth tokens', { error: error.message, userId });
    throw error;
  }
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret, {
      issuer: config.app.name,
      audience: config.app.name
    });

    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.debug('Access token expired');
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid access token', { error: error.message });
      throw new Error('Invalid token');
    }
    logger.error('Error verifying access token', { error: error.message });
    throw error;
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  try {
    const payload = jwt.verify(token, config.jwt.refreshSecret, {
      issuer: config.app.name,
      audience: config.app.name
    });

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.debug('Refresh token expired');
      throw new Error('Refresh token expired');
    } else if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid refresh token', { error: error.message });
      throw new Error('Invalid refresh token');
    }
    logger.error('Error verifying refresh token', { error: error.message });
    throw error;
  }
};

/**
 * Decode token without verification
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token or null
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Error decoding token', { error: error.message });
    return null;
  }
};

/**
 * Get refresh token expiry date
 * @returns {Date} Expiry date
 */
export const getRefreshTokenExpiry = () => {
  const expiryString = config.jwt.refreshExpiry;
  const unit = expiryString.slice(-1);
  const value = parseInt(expiryString.slice(0, -1));

  const now = new Date();

  switch (unit) {
    case 's':
      return new Date(now.getTime() + value * 1000);
    case 'm':
      return new Date(now.getTime() + value * 60 * 1000);
    case 'h':
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd':
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
  }
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateAuthTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getRefreshTokenExpiry
};