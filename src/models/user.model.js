import { query, transaction } from '../database/pool.js';
import { logger } from '../config/logger.js';

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
export const createUser = async ({ email, password, firstName, lastName }) => {
  const text = `
    INSERT INTO users (email, password, first_name, last_name)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, first_name, last_name, created_at, updated_at
  `;
  
  const values = [email, password, firstName, lastName];
  
  try {
    const result = await query(text, values);
    logger.info('User created', { userId: result.rows[0].id, email });
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating user', { error: error.message, email });
    throw error;
  }
};

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
export const findUserById = async (userId) => {
  const text = `
    SELECT id, email, password, first_name, last_name, 
           is_active, is_verified, last_login, created_at, updated_at
    FROM users
    WHERE id = $1 AND deleted_at IS NULL
  `;
  
  try {
    const result = await query(text, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error finding user by ID', { error: error.message, userId });
    throw error;
  }
};

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
export const findUserByEmail = async (email) => {
  const text = `
    SELECT id, email, password, first_name, last_name, 
           is_active, is_verified, last_login, created_at, updated_at
    FROM users
    WHERE email = $1 AND deleted_at IS NULL
  `;
  
  try {
    const result = await query(text, [email.toLowerCase()]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error finding user by email', { error: error.message, email });
    throw error;
  }
};

/**
 * Update user by ID
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (userId, updates) => {
  const allowedFields = ['first_name', 'last_name', 'email', 'password'];
  const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  const values = [userId, ...fields.map(field => updates[field])];
  
  const text = `
    UPDATE users
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, email, first_name, last_name, updated_at
  `;
  
  try {
    const result = await query(text, values);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    logger.info('User updated', { userId });
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating user', { error: error.message, userId });
    throw error;
  }
};

/**
 * Soft delete user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteUser = async (userId) => {
  const text = `
    UPDATE users
    SET deleted_at = CURRENT_TIMESTAMP, is_active = false
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id
  `;
  
  try {
    const result = await query(text, [userId]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    logger.info('User deleted (soft)', { userId });
    return true;
  } catch (error) {
    logger.error('Error deleting user', { error: error.message, userId });
    throw error;
  }
};

/**
 * Update user's last login timestamp
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const updateLastLogin = async (userId) => {
  const text = `
    UPDATE users
    SET last_login = CURRENT_TIMESTAMP
    WHERE id = $1
  `;
  
  try {
    await query(text, [userId]);
    logger.debug('Updated last login', { userId });
  } catch (error) {
    logger.error('Error updating last login', { error: error.message, userId });
    // Don't throw - this is not critical
  }
};

/**
 * Check if email exists
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} Exists status
 */
export const emailExists = async (email) => {
  const text = `
    SELECT EXISTS(
      SELECT 1 FROM users 
      WHERE email = $1 AND deleted_at IS NULL
    ) as exists
  `;
  
  try {
    const result = await query(text, [email.toLowerCase()]);
    return result.rows[0].exists;
  } catch (error) {
    logger.error('Error checking email existence', { error: error.message, email });
    throw error;
  }
};

/**
 * Store refresh token for user
 * @param {string} userId - User ID
 * @param {string} token - Refresh token
 * @param {Date} expiresAt - Token expiration date
 * @returns {Promise<void>}
 */
export const storeRefreshToken = async (userId, token, expiresAt) => {
  const text = `
    INSERT INTO refresh_tokens (user_id, token, expires_at)
    VALUES ($1, $2, $3)
  `;
  
  try {
    await query(text, [userId, token, expiresAt]);
    logger.debug('Refresh token stored', { userId });
  } catch (error) {
    logger.error('Error storing refresh token', { error: error.message, userId });
    throw error;
  }
};

/**
 * Find refresh token
 * @param {string} token - Refresh token
 * @returns {Promise<Object|null>} Token data or null
 */
export const findRefreshToken = async (token) => {
  const text = `
    SELECT id, user_id, token, expires_at, revoked_at, created_at
    FROM refresh_tokens
    WHERE token = $1 AND revoked_at IS NULL
  `;
  
  try {
    const result = await query(text, [token]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error finding refresh token', { error: error.message });
    throw error;
  }
};

/**
 * Revoke refresh token
 * @param {string} token - Refresh token
 * @returns {Promise<boolean>} Success status
 */
export const revokeRefreshToken = async (token) => {
  const text = `
    UPDATE refresh_tokens
    SET revoked_at = CURRENT_TIMESTAMP
    WHERE token = $1 AND revoked_at IS NULL
    RETURNING id
  `;
  
  try {
    const result = await query(text, [token]);
    logger.info('Refresh token revoked');
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Error revoking refresh token', { error: error.message });
    throw error;
  }
};

/**
 * Revoke all refresh tokens for user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const revokeAllUserTokens = async (userId) => {
  const text = `
    UPDATE refresh_tokens
    SET revoked_at = CURRENT_TIMESTAMP
    WHERE user_id = $1 AND revoked_at IS NULL
  `;
  
  try {
    await query(text, [userId]);
    logger.info('All user tokens revoked', { userId });
  } catch (error) {
    logger.error('Error revoking user tokens', { error: error.message, userId });
    throw error;
  }
};

/**
 * Clean up expired tokens
 * @returns {Promise<number>} Number of tokens deleted
 */
export const cleanupExpiredTokens = async () => {
  const text = `
    DELETE FROM refresh_tokens
    WHERE expires_at < CURRENT_TIMESTAMP OR revoked_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
  `;
  
  try {
    const result = await query(text);
    logger.info('Expired tokens cleaned up', { count: result.rowCount });
    return result.rowCount;
  } catch (error) {
    logger.error('Error cleaning up tokens', { error: error.message });
    throw error;
  }
};

export default {
  createUser,
  findUserById,
  findUserByEmail,
  updateUser,
  deleteUser,
  updateLastLogin,
  emailExists,
  storeRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens
};