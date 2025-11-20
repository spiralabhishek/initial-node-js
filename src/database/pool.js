// src/database/pool.js
import pkg from 'pg';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';

const { Pool } = pkg;

// Create pool instance
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  max: config.database.maxPool || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Test a simple query to ensure connection
export const connectDatabase = async () => {
  try {
    logger.info('Attempting PostgreSQL connection...');

    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('PostgreSQL connected successfully');
    return true;
  } catch (error) {
    logger.error('Error connecting to PostgreSQL', {
      error: error.message
    });
    throw error;
  }
};

// Reusable query function
export const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    logger.error('Database query error', {
      query: text,
      params,
      error: error.message
    });
    throw error;
  }
};

// Gracefully close the pool (used in shutdown)
export const closePool = async () => {
  try {
    logger.info('Closing PostgreSQL pool...');
    await pool.end();
    logger.info('PostgreSQL pool closed');
  } catch (error) {
    logger.error('Error closing pool', { error: error.message });
  }
};

export default pool;
