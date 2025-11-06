// src\server.js
import { createApp } from './app.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, closeDatabase } from './config/database.js';

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    await connectDatabase();
 
    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(config.app.port, () => {
      logger.info(`Server started successfully`, {
        environment: config.env,
        port: config.app.port,
        nodeVersion: process.version,
        pid: process.pid
      });
      
      if (config.isDevelopment) {
        logger.info(`API Documentation: http://localhost:${config.app.port}${config.app.apiPrefix}`);
      }
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await closePool();
          logger.info('Database connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error: error.message });
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
      });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason,
        promise
      });
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Start the server
startServer();