// services/cleanup.service.js
import { cloudinary } from '../utils/fileUpload.js';
import { logger } from '../config/logger.js';

/**
 * Delete temp files older than specified hours
 * Run this as a cron job
 */
export const cleanupTempFiles = async (hoursOld = 24) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursOld);

    // List all files in temp folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'uploads/temp',
      max_results: 500,
      resource_type: 'image'
    });

    const videoResult = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'uploads/temp',
      max_results: 500,
      resource_type: 'video'
    });

    const allResources = [...result.resources, ...videoResult.resources];
    const oldFiles = allResources.filter(resource => {
      const createdAt = new Date(resource.created_at);
      return createdAt < cutoffDate;
    });

    if (oldFiles.length > 0) {
      const publicIds = oldFiles.map(f => f.public_id);

      // Delete in batches of 100
      for (let i = 0; i < publicIds.length; i += 100) {
        const batch = publicIds.slice(i, i + 100);
        await cloudinary.api.delete_resources(batch, {
          resource_type: 'auto'
        });
      }

      logger.info(`Cleaned up ${oldFiles.length} temp files older than ${hoursOld} hours`);
    }

    return { deleted: oldFiles.length };
  } catch (error) {
    logger.error('Cleanup service error', error);
    throw error;
  }
};
