import crypto from 'crypto';
import { logger } from '../config/logger.js';

/**
 * Encryption algorithm
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derive encryption key from password
 * @param {string} password - Password to derive key from
 * @param {Buffer} salt - Salt for key derivation
 * @returns {Buffer} Derived key
 */
const deriveKey = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
};

/**
 * Encrypt data using AES-256-GCM
 * @param {string} text - Text to encrypt
 * @param {string} secretKey - Secret key for encryption
 * @returns {string} Encrypted data in format: salt:iv:encrypted:tag
 */
export const encrypt = (text, secretKey) => {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from secret
    const key = deriveKey(secretKey, salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const tag = cipher.getAuthTag();

    // Return combined string: salt:iv:encrypted:tag
    return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
  } catch (error) {
    logger.error('Encryption error', { error: error.message });
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedData - Encrypted data in format: salt:iv:encrypted:tag
 * @param {string} secretKey - Secret key for decryption
 * @returns {string} Decrypted text
 */
export const decrypt = (encryptedData, secretKey) => {
  try {
    // Split the encrypted data
    const parts = encryptedData.split(':');
    
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltHex, ivHex, encrypted, tagHex] = parts;

    // Convert from hex
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    // Derive key from secret
    const key = deriveKey(secretKey, salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Decryption error', { error: error.message });
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash data using SHA-256
 * @param {string} data - Data to hash
 * @returns {string} Hashed data (hex)
 */
export const hash = (data) => {
  try {
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch (error) {
    logger.error('Hashing error', { error: error.message });
    throw new Error('Failed to hash data');
  }
};

/**
 * Hash data using SHA-512
 * @param {string} data - Data to hash
 * @returns {string} Hashed data (hex)
 */
export const hashSHA512 = (data) => {
  try {
    return crypto.createHash('sha512').update(data).digest('hex');
  } catch (error) {
    logger.error('Hashing error', { error: error.message });
    throw new Error('Failed to hash data');
  }
};

/**
 * Generate random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} Random token (hex)
 */
export const generateToken = (length = 32) => {
  try {
    return crypto.randomBytes(length).toString('hex');
  } catch (error) {
    logger.error('Token generation error', { error: error.message });
    throw new Error('Failed to generate token');
  }
};

/**
 * Generate random alphanumeric string
 * @param {number} length - String length (default: 16)
 * @returns {string} Random alphanumeric string
 */
export const generateRandomString = (length = 16) => {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }
    
    return result;
  } catch (error) {
    logger.error('Random string generation error', { error: error.message });
    throw new Error('Failed to generate random string');
  }
};

/**
 * Generate UUID v4
 * @returns {string} UUID
 */
export const generateUUID = () => {
  try {
    return crypto.randomUUID();
  } catch (error) {
    logger.error('UUID generation error', { error: error.message });
    throw new Error('Failed to generate UUID');
  }
};

/**
 * Create HMAC signature
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @returns {string} HMAC signature (hex)
 */
export const createHMAC = (data, secret) => {
  try {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  } catch (error) {
    logger.error('HMAC creation error', { error: error.message });
    throw new Error('Failed to create HMAC');
  }
};

/**
 * Verify HMAC signature
 * @param {string} data - Original data
 * @param {string} signature - HMAC signature to verify
 * @param {string} secret - Secret key
 * @returns {boolean} Verification result
 */
export const verifyHMAC = (data, signature, secret) => {
  try {
    const expectedSignature = createHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    logger.error('HMAC verification error', { error: error.message });
    return false;
  }
};

/**
 * Generate secure random number within range
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} Random number
 */
export const randomInt = (min, max) => {
  try {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValue = Math.pow(256, bytesNeeded);
    const randomBytes = crypto.randomBytes(bytesNeeded);
    const randomValue = randomBytes.readUIntBE(0, bytesNeeded);
    
    return min + (randomValue % range);
  } catch (error) {
    logger.error('Random int generation error', { error: error.message });
    throw new Error('Failed to generate random number');
  }
};

/**
 * Constant-time string comparison
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} Comparison result
 */
export const secureCompare = (a, b) => {
  try {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch (error) {
    return false;
  }
};

export default {
  encrypt,
  decrypt,
  hash,
  hashSHA512,
  generateToken,
  generateRandomString,
  generateUUID,
  createHMAC,
  verifyHMAC,
  randomInt,
  secureCompare
};