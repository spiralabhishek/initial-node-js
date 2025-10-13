import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from './env.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  })
);

/**
 * Create transports array
 */
const createTransports = () => {
  const transports = [];

  // Console transport for all environments
  if (config.isDevelopment || config.isTest) {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: config.logging.level
      })
    );
  }

  // File transports for production
  if (config.isProduction || config.isDevelopment) {
    // All logs
    transports.push(
      new DailyRotateFile({
        filename: join(__dirname, '../../logs/application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: config.logging.maxSize,
        maxFiles: config.logging.maxFiles,
        format: logFormat,
        level: config.logging.level
      })
    );

    // Error logs
    transports.push(
      new DailyRotateFile({
        filename: join(__dirname, '../../logs/error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: config.logging.maxSize,
        maxFiles: config.logging.maxFiles,
        format: logFormat,
        level: 'error'
      })
    );

    // Security logs
    transports.push(
      new DailyRotateFile({
        filename: join(__dirname, '../../logs/security-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: config.logging.maxSize,
        maxFiles: config.logging.maxFiles,
        format: logFormat,
        level: 'warn'
      })
    );
  }

  return transports;
};

/**
 * Create Winston logger instance
 */
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: config.app.name },
  transports: createTransports(),
  exitOnError: false
});

/**
 * Stream for Morgan HTTP logging
 */
export const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

/**
 * Log levels for reference
 */
export const logLevels = {
  error: 'error',
  warn: 'warn',
  info: 'info',
  http: 'http',
  debug: 'debug'
};

export default logger;