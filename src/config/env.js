import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });

/**
 * Validates that required environment variables are present
 */
const validateEnv = () => {
  const required = [
    'NODE_ENV',
    'PORT',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_ADMIN_ACCESS_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Validate on load
validateEnv();

/**
 * Application configuration object
 */
export const config = {
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  app: {
    name: process.env.APP_NAME || 'nodejs-postgres-api',
    port: parseInt(process.env.PORT, 10) || 3000,
    apiPrefix: process.env.API_PREFIX || '/api',
    apiVersion: process.env.API_VERSION || 'v1'
  },

  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 20,
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 2000
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    adminAccessSecret: process.env.JWT_ADMIN_ACCESS_SECRET,
    adminRefreshSecret: process.env.JWT_ADMIN_REFRESH_SECRET
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8080'],
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 9000000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 50000
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d'
  },

  security: {
    cookieSecret: process.env.COOKIE_SECRET,
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    cookieHttpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
    cookieSameSite: process.env.COOKIE_SAME_SITE || 'strict'
  }
};

export default config;