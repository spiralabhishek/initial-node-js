import pg from 'pg';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

const { Pool } = pg;

/**
 * PostgreSQL connection pool configuration
 */
const poolConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: config.database.maxConnections,
  idleTimeoutMillis: config.database.idleTimeout,
  connectionTimeoutMillis: config.database.connectionTimeout,
  // Security: Use SSL in production
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
};

/**
 * Create database connection pool
 */
export const pool = new Pool(poolConfig);

/**
 * Pool error handling
 */
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle database client', { error: err.message });
});

pool.on('connect', () => {
  logger.info('New database connection established');
});

pool.on('remove', () => {
  logger.info('Database connection removed from pool');
});

/**
 * Execute a query with error handling
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
export const query = async (text, params = []) => {
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    logger.debug('Executed query', {
      query: text,
      duration: `${duration}ms`,
      rows: result.rowCount
    });

    return result;
  } catch (error) {
    logger.error('Database query error', {
      error: error.message,
      query: text,
      params
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Database client
 */
export const getClient = async () => {
  try {
    const client = await pool.connect();

    const originalRelease = client.release;
    let released = false;

    // Override release to prevent double-release
    client.release = () => {
      if (released) {
        logger.warn('Attempted to release already released client');
        return;
      }
      released = true;
      originalRelease.apply(client);
    };

    return client;
  } catch (error) {
    logger.error('Error getting database client', { error: error.message });
    throw error;
  }
};

/**
 * Execute a transaction
 * @param {Function} callback - Async function to execute within transaction
 * @returns {Promise<any>} Transaction result
 */
export const transaction = async callback => {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');

    logger.debug('Transaction committed successfully');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
export const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time');
    logger.info('Database connection successful', {
      time: result.rows[0].current_time
    });
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    return false;
  }
};

/**
 * Close all database connections
 * @returns {Promise<void>}
 */
export const closePool = async () => {
  try {
    await pool.end();
    logger.info('Database pool has been closed');
  } catch (error) {
    logger.error('Error closing database pool', { error: error.message });
    throw error;
  }
};

export default {
  pool,
  query,
  getClient,
  transaction,
  testConnection,
  closePool
};
