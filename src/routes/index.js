import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import districtRoutes from "./district.routes.js";
import talukaRoutes from "./taluka.routes.js";
import categoryRoutes from "./category.routes.js";
import postRoutes from "./post.routes.js";
import newsRoutes from "./news.routes.js";
import uploadRoutes from "./upload.routes.js";

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
router.use('/districts', districtRoutes);
router.use("/talukas", talukaRoutes);
router.use("/categories", categoryRoutes);
router.use("/posts", postRoutes);
router.use("/news", newsRoutes);
router.use("/upload", uploadRoutes);

export default router;