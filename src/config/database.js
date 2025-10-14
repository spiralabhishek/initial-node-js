import { config } from './env.js';

/**
 * Database configuration object
 * This can be used for additional database utilities or ORM configuration
 */
export const databaseConfig = {
  // Connection settings
  connection: {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password
  },

  // Pool settings
  pool: {
    min: 2,
    max: config.database.maxConnections,
    idleTimeoutMillis: config.database.idleTimeout,
    connectionTimeoutMillis: config.database.connectionTimeout,
    allowExitOnIdle: false
  },

  // Query settings
  query: {
    // Default timeout for queries (30 seconds)
    timeout: 30000,
    
    // Log slow queries (queries taking more than 1 second)
    logSlowQueries: true,
    slowQueryThreshold: 1000
  },

  // Migration settings
  migrations: {
    directory: './src/database/migrations',
    tableName: 'migrations'
  },

  // Seed settings
  seeds: {
    directory: './src/database/seeds',
    tableName: 'seeds'
  },

  // SSL configuration
  ssl: config.isProduction ? {
    rejectUnauthorized: false,
    // Add more SSL options if needed
    ca: process.env.DB_SSL_CA,
    key: process.env.DB_SSL_KEY,
    cert: process.env.DB_SSL_CERT
  } : false,

  // Transaction settings
  transaction: {
    // Default isolation level
    isolationLevel: 'READ COMMITTED',
    
    // Options: READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE
    availableIsolationLevels: [
      'READ UNCOMMITTED',
      'READ COMMITTED',
      'REPEATABLE READ',
      'SERIALIZABLE'
    ]
  },

  // Retry settings for failed connections
  retry: {
    max: 3,
    delay: 1000,
    factor: 2
  },

  // Health check settings
  healthCheck: {
    enabled: true,
    interval: 60000, // Check every minute
    timeout: 5000
  }
};

/**
 * Get connection string for external tools
 * @returns {string} PostgreSQL connection string
 */
export const getConnectionString = () => {
  const { host, port, database, user, password } = config.database;
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
};

/**
 * Get database info (safe for logging - no sensitive data)
 * @returns {Object} Database information
 */
export const getDatabaseInfo = () => {
  return {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    maxConnections: config.database.maxConnections,
    ssl: config.isProduction
  };
};

/**
 * Validate database configuration
 * @throws {Error} If configuration is invalid
 */
export const validateDatabaseConfig = () => {
  const required = ['host', 'port', 'name', 'user', 'password'];
  const missing = required.filter(key => !config.database[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required database config: ${missing.join(', ')}`);
  }

  if (config.database.port < 1 || config.database.port > 65535) {
    throw new Error('Invalid database port number');
  }

  if (config.database.maxConnections < 1) {
    throw new Error('Max connections must be at least 1');
  }

  return true;
};

export default {
  databaseConfig,
  getConnectionString,
  getDatabaseInfo,
  validateDatabaseConfig
};