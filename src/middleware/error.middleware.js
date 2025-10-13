import { logger } from '../config/logger.js';
import { config } from '../config/env.js';

/**
 * Not found handler - catches 404 errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const notFoundHandler = (req, res, next) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
};

/**
 * Global error handler
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  // Set default status code
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique constraint violation
        statusCode = 409;
        message = 'Resource already exists';
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Invalid reference';
        break;
      case '23502': // Not null violation
        statusCode = 400;
        message = 'Required field missing';
        break;
      case '22P02': // Invalid text representation
        statusCode = 400;
        message = 'Invalid data format';
        break;
      case '42P01': // Undefined table
        statusCode = 500;
        message = 'Database configuration error';
        break;
      default:
        statusCode = 500;
        message = 'Database error';
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // Log error with appropriate level
  const logData = {
    error: message,
    statusCode,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.userId || 'anonymous',
    stack: err.stack
  };

  if (statusCode >= 500) {
    logger.error('Server error', logData);
  } else if (statusCode >= 400) {
    logger.warn('Client error', logData);
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    message,
    ...(config.isDevelopment && { stack: err.stack }),
    ...(err.errors && { errors: err.errors })
  };

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper - catches async errors and passes to error handler
 * This is already defined in utils/asyncHandler.js but can be re-exported here
 */
export const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error formatter
 * @param {Array} errors - Array of validation errors
 * @returns {Object} Formatted error object
 */
export const formatValidationErrors = (errors) => {
  return errors.map(error => ({
    field: error.path || error.param,
    message: error.msg,
    value: error.value
  }));
};

export default {
  notFoundHandler,
  errorHandler,
  asyncErrorHandler,
  formatValidationErrors
};