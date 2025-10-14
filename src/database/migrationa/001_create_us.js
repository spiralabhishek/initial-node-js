import { query } from '../pool.js';
import { logger } from '../../config/logger.js';

/**
 * Create users and refresh_tokens tables
 */
export const up = async () => {
  try {
    // Enable UUID extension
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        CONSTRAINT email_lowercase CHECK (email = LOWER(email))
      )
    `);

    // Create index on email for faster lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email 
      ON users(email) 
      WHERE deleted_at IS NULL
    `);

    // Create index on active users
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_active 
      ON users(is_active) 
      WHERE deleted_at IS NULL
    `);

    // Create refresh_tokens table
    await query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        revoked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user
          FOREIGN KEY(user_id) 
          REFERENCES users(id)
          ON DELETE CASCADE
      )
    `);

    // Create index on token for faster lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token 
      ON refresh_tokens(token) 
      WHERE revoked_at IS NULL
    `);

    // Create index on user_id
    await query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id 
      ON refresh_tokens(user_id)
    `);

    // Create index on expires_at for cleanup
    await query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at 
      ON refresh_tokens(expires_at)
    `);

    // Create updated_at trigger function
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Create trigger for users table
    await query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    logger.info('Migration 001_create_users_table executed successfully');
  } catch (error) {
    logger.error('Migration 001_create_users_table failed', { error: error.message });
    throw error;
  }
};

/**
 * Rollback users and refresh_tokens tables
 */
export const down = async () => {
  try {
    await query(`DROP TABLE IF EXISTS refresh_tokens CASCADE`);
    await query(`DROP TABLE IF EXISTS users CASCADE`);
    await query(`DROP FUNCTION IF EXISTS update_updated_at_column CASCADE`);
    
    logger.info('Migration 001_create_users_table rolled back successfully');
  } catch (error) {
    logger.error('Migration 001_create_users_table rollback failed', { error: error.message });
    throw error;
  }
};

export default { up, down };