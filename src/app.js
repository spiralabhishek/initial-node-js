import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import * as securityMiddleware from './middleware/security.middleware.js';
import * as errorMiddleware from './middleware/error.middleware.js'; 
import systemRoutes from './routes/index.js';

/**
 * Create Express application
 */
export const createApp = () => {
  const app = express();

  // Trust proxy - important for rate limiting and getting correct IP
  app.set('trust proxy', 1);

  // Security middleware - Helmet for HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:']
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parser
  app.use(cookieParser(config.security.cookieSecret));

  // Compression middleware
  app.use(compression());

  // Security middleware
  app.use(securityMiddleware.sanitizeInput);
  app.use(securityMiddleware.logSuspiciousActivity);
  app.use(securityMiddleware.preventParameterPollution);

  // Rate limiting
  // app.use(securityMiddleware.generalLimiter);

  // Request logging
  app.use((req, res, next) => {
    logger.http('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    next();
  });

  // API routes
  app.use(`${config.app.apiPrefix}`, systemRoutes);

  // 404 handler - must be after all routes
  app.use(errorMiddleware.notFoundHandler);

  // Global error handler - must be last
  app.use(errorMiddleware.errorHandler);

  return app;
};

export default createApp;
