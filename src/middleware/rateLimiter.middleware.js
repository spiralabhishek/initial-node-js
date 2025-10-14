import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Create a custom rate limit handler
 */
const createRateLimitHandler = (limitName) => {
  return (req, res) => {
    logger.warn(`Rate limit exceeded: ${limitName}`, {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.userId || 'anonymous'
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: res.getHeader('Retry-After')
    });
  };
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('API General'),
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Authentication'),
  keyGenerator: (req) => {
    // Use IP + email combination for more precise rate limiting
    const email = req.body?.email || '';
    return `${req.ip}-${email}`;
  }
});

/**
 * Registration rate limiter
 * 3 registrations per hour per IP
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many accounts created from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Registration'),
  skipFailedRequests: false
});

/**
 * Password reset rate limiter
 * 3 requests per hour per IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Password Reset'),
  keyGenerator: (req) => {
    const email = req.body?.email || '';
    return `${req.ip}-${email}`;
  }
});

/**
 * Email sending rate limiter
 * 10 emails per hour per user
 */
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many emails sent, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Email'),
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.userId ? `user-${req.userId}` : req.ip;
  }
});

/**
 * File upload rate limiter
 * 20 uploads per hour per user
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many file uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('File Upload'),
  keyGenerator: (req) => {
    return req.userId ? `user-${req.userId}` : req.ip;
  }
});

/**
 * Search/Query rate limiter
 * 60 requests per minute per user
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: 'Too many search requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Search'),
  keyGenerator: (req) => {
    return req.userId ? `user-${req.userId}` : req.ip;
  }
});

/**
 * Slow down middleware - progressively increases delay
 * Good for brute force protection
 */
export const createSlowDown = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 10,
    delayAfter: options.delayAfter || 5,
    delayMs: options.delayMs || 500,
    maxDelayMs: options.maxDelayMs || 5000,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler(options.name || 'SlowDown')
  });
};

/**
 * Create custom rate limiter
 * @param {Object} options - Rate limiter options
 * @returns {Function} Rate limiter middleware
 */
export const createCustomLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler(options.name || 'Custom'),
    ...options
  });
};

export default {
  apiLimiter,
  authRateLimiter,
  registrationLimiter,
  passwordResetLimiter,
  emailLimiter,
  uploadLimiter,
  searchLimiter,
  createSlowDown,
  createCustomLimiter
};