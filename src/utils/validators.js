import { logger } from '../config/logger.js';

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Validation result
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with details
 */
export const validatePassword = (password) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (!password || typeof password !== 'string') {
    result.isValid = false;
    result.errors.push('Password is required');
    return result;
  }

  if (password.length < 8) {
    result.isValid = false;
    result.errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    result.isValid = false;
    result.errors.push('Password must not exceed 128 characters');
  }

  if (!/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one number');
  }

  if (!/[@$!%*?&#]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one special character (@$!%*?&#)');
  }

  return result;
};

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} Validation result
 */
export const isValidUUID = (uuid) => {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate phone number (international format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Validation result
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Basic international phone validation (E.164 format)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Validation result
 */
export const isValidURL = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

/**
 * Validate date string
 * @param {string} dateString - Date string to validate
 * @returns {boolean} Validation result
 */
export const isValidDate = (dateString) => {
  if (!dateString) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Validate age (must be 18+)
 * @param {string|Date} birthDate - Birth date
 * @returns {boolean} Validation result
 */
export const isValidAge = (birthDate) => {
  if (!birthDate) {
    return false;
  }

  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 18;
  }

  return age >= 18;
};

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {Object} Validation result
 */
export const validateUsername = (username) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (!username || typeof username !== 'string') {
    result.isValid = false;
    result.errors.push('Username is required');
    return result;
  }

  if (username.length < 3) {
    result.isValid = false;
    result.errors.push('Username must be at least 3 characters long');
  }

  if (username.length > 30) {
    result.isValid = false;
    result.errors.push('Username must not exceed 30 characters');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    result.isValid = false;
    result.errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }

  if (/^[0-9]/.test(username)) {
    result.isValid = false;
    result.errors.push('Username cannot start with a number');
  }

  return result;
};

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

/**
 * Validate file extension
 * @param {string} filename - Filename to validate
 * @param {Array} allowedExtensions - Allowed extensions
 * @returns {boolean} Validation result
 */
export const isValidFileExtension = (filename, allowedExtensions) => {
  if (!filename || !Array.isArray(allowedExtensions)) {
    return false;
  }

  const extension = filename.split('.').pop().toLowerCase();
  return allowedExtensions.includes(extension);
};

/**
 * Validate file size
 * @param {number} size - File size in bytes
 * @param {number} maxSize - Maximum allowed size in bytes
 * @returns {boolean} Validation result
 */
export const isValidFileSize = (size, maxSize) => {
  return typeof size === 'number' && size > 0 && size <= maxSize;
};

/**
 * Validate credit card number (Luhn algorithm)
 * @param {string} cardNumber - Card number to validate
 * @returns {boolean} Validation result
 */
export const isValidCreditCard = (cardNumber) => {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return false;
  }

  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validate postal code (generic)
 * @param {string} postalCode - Postal code to validate
 * @param {string} country - Country code (US, CA, UK, etc.)
 * @returns {boolean} Validation result
 */
export const isValidPostalCode = (postalCode, country = 'US') => {
  if (!postalCode || typeof postalCode !== 'string') {
    return false;
  }

  const patterns = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
    UK: /^[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}$/i,
    IN: /^\d{6}$/,
    AU: /^\d{4}$/
  };

  const pattern = patterns[country.toUpperCase()];
  return pattern ? pattern.test(postalCode) : false;
};

/**
 * Validate IP address (v4 and v6)
 * @param {string} ip - IP address to validate
 * @returns {boolean} Validation result
 */
export const isValidIP = (ip) => {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    return ip.split('.').every(num => parseInt(num) <= 255);
  }

  // IPv6
  const ipv6Regex = /^([0-9a-f]{0,4}:){7}[0-9a-f]{0,4}$/i;
  return ipv6Regex.test(ip);
};

/**
 * Validate JSON string
 * @param {string} jsonString - JSON string to validate
 * @returns {boolean} Validation result
 */
export const isValidJSON = (jsonString) => {
  if (!jsonString || typeof jsonString !== 'string') {
    return false;
  }

  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate array with constraints
 * @param {Array} arr - Array to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateArray = (arr, options = {}) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (!Array.isArray(arr)) {
    result.isValid = false;
    result.errors.push('Value must be an array');
    return result;
  }

  if (options.minLength && arr.length < options.minLength) {
    result.isValid = false;
    result.errors.push(`Array must have at least ${options.minLength} items`);
  }

  if (options.maxLength && arr.length > options.maxLength) {
    result.isValid = false;
    result.errors.push(`Array must have at most ${options.maxLength} items`);
  }

  if (options.uniqueItems && new Set(arr).size !== arr.length) {
    result.isValid = false;
    result.errors.push('Array items must be unique');
  }

  return result;
};

/**
 * Validate object has required fields
 * @param {Object} obj - Object to validate
 * @param {Array} requiredFields - Required field names
 * @returns {Object} Validation result
 */
export const validateRequiredFields = (obj, requiredFields) => {
  const result = {
    isValid: true,
    errors: [],
    missingFields: []
  };

  if (!obj || typeof obj !== 'object') {
    result.isValid = false;
    result.errors.push('Value must be an object');
    return result;
  }

  for (const field of requiredFields) {
    if (!(field in obj) || obj[field] === null || obj[field] === undefined || obj[field] === '') {
      result.isValid = false;
      result.missingFields.push(field);
      result.errors.push(`Field '${field}' is required`);
    }
  }

  return result;
};

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {Object} Validation result
 */
export const validateStringLength = (str, min, max) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (typeof str !== 'string') {
    result.isValid = false;
    result.errors.push('Value must be a string');
    return result;
  }

  if (str.length < min) {
    result.isValid = false;
    result.errors.push(`String must be at least ${min} characters long`);
  }

  if (str.length > max) {
    result.isValid = false;
    result.errors.push(`String must be at most ${max} characters long`);
  }

  return result;
};

/**
 * Validate number is within range
 * @param {number} num - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} Validation result
 */
export const isNumberInRange = (num, min, max) => {
  return typeof num === 'number' && !isNaN(num) && num >= min && num <= max;
};

/**
 * Check if string contains only alphanumeric characters
 * @param {string} str - String to check
 * @returns {boolean} Validation result
 */
export const isAlphanumeric = (str) => {
  if (!str || typeof str !== 'string') {
    return false;
  }
  return /^[a-zA-Z0-9]+$/.test(str);
};

/**
 * Check if string contains only letters
 * @param {string} str - String to check
 * @returns {boolean} Validation result
 */
export const isAlpha = (str) => {
  if (!str || typeof str !== 'string') {
    return false;
  }
  return /^[a-zA-Z]+$/.test(str);
};

/**
 * Validate hex color code
 * @param {string} color - Color code to validate
 * @returns {boolean} Validation result
 */
export const isValidHexColor = (color) => {
  if (!color || typeof color !== 'string') {
    return false;
  }
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ObjectId to validate
 * @returns {boolean} Validation result
 */
export const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') {
    return false;
  }
  return /^[a-f\d]{24}$/i.test(id);
};

/**
 * Check if value is empty
 * @param {*} value - Value to check
 * @returns {boolean} Is empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
};

export default {
  isValidEmail,
  validatePassword,
  isValidUUID,
  isValidPhone,
  isValidURL,
  isValidDate,
  isValidAge,
  validateUsername,
  sanitizeString,
  isValidFileExtension,
  isValidFileSize,
  isValidCreditCard,
  isValidPostalCode,
  isValidIP,
  isValidJSON,
  validateArray,
  validateRequiredFields,
  validateStringLength,
  isNumberInRange,
  isAlphanumeric,
  isAlpha,
  isValidHexColor,
  isValidObjectId,
  isEmpty
};