// jobs/cleanup.job.js
import cron from 'node-cron';
import { cleanupTempFiles } from '../services/cleanup.service.js';
import { logger } from '../config/logger.js';

// Run cleanup every day at 2 AM
export const startCleanupJob = () => {
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting temp files cleanup job');
    try {
      await cleanupTempFiles(24); // Delete files older than 24 hours
      logger.info('Cleanup job completed successfully');
    } catch (error) {
      logger.error('Cleanup job failed', error);
    }
  });

  logger.info('Cleanup job scheduled');
};
