import { body, validationResult } from 'express-validator';
import { logger } from '../config/logger.js';
import Joi from 'joi';
import { ApiError } from '../utils/apiError.js';

/**
 * Handle validation errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    logger.warn('Validation failed', {
      ip: req.ip,
      path: req.path,
      errors: formattedErrors
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }

  next();
};

/**
 * Registration validation rules
 */
export const registerValidation = [
  body('email').isEmail().withMessage('Invalid email address').normalizeEmail().toLowerCase(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),

  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters'),

  handleValidationErrors
];

/**
 * Login validation rules
 */
export const loginValidation = [
  body('email').isEmail().withMessage('Invalid email address').normalizeEmail().toLowerCase(),

  body('password').notEmpty().withMessage('Password is required'),

  handleValidationErrors
];

/**
 * Update profile validation rules
 */
export const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .toLowerCase(),

  handleValidationErrors
];

/**
 * Change password validation rules
 */
export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain uppercase, lowercase, number and special character')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('New password must be different from current password'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),

  handleValidationErrors
];

/**
 * UUID validation
 */
export const validateUUID = (paramName = 'id') => [
  (req, res, next) => {
    const uuid = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(uuid)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    next();
  }
];

/**
 * Validation middleware wrapper
 */
const validate = schema => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      throw new ApiError(400, 'Validation error', errors);
    }

    next();
  };
};

/**
 * Phone number validation schema
 */
const phoneNumberSchema = Joi.string()
  .pattern(/^\+?[1-9]\d{1,14}$/)
  .required()
  .messages({
    'string.pattern.base': 'Please enter a valid phone number with country code',
    'any.required': 'Phone number is required'
  });

/**
 * OTP validation schema
 */
const otpSchema = Joi.string()
  .length(6)
  .pattern(/^\d{6}$/)
  .required()
  .messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only digits',
    'any.required': 'OTP is required'
  });

/**
 * Send registration OTP validation
 */
export const sendRegisterOTPValidation = validate(
  Joi.object({
    phoneNumber: phoneNumberSchema,
    firstName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    })
  })
);

/**
 * Verify registration OTP validation
 */
export const verifyRegisterOTPValidation = validate(
  Joi.object({
    phoneNumber: phoneNumberSchema,
    otp: otpSchema,
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required()
  })
);

/**
 * Send login OTP validation
 */
export const sendLoginOTPValidation = validate(
  Joi.object({
    phoneNumber: phoneNumberSchema
  })
);

/**
 * Verify login OTP validation
 */
export const verifyLoginOTPValidation = validate(
  Joi.object({
    phoneNumber: phoneNumberSchema,
    otp: otpSchema
  })
);

/**
 * Refresh token validation
 */
export const refreshTokenValidation = validate(
  Joi.object({
    refreshToken: Joi.string().optional()
  })
);

export default {
  sendRegisterOTPValidation,
  verifyRegisterOTPValidation,
  sendLoginOTPValidation,
  verifyLoginOTPValidation,
  refreshTokenValidation,
  handleValidationErrors,
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  validateUUID
};
