import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import { config } from '../config/env.js';

const router = express.Router();

/**
 * API Health Check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: '1.0.0'
  });
});

/**
 * API Info
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: config.app.name,
      version: '1.0.0',
      environment: config.env,
      apiPrefix: config.app.apiPrefix,
      apiVersion: config.app.apiVersion
    }
  });
});

/**
 * Mount route modules
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;