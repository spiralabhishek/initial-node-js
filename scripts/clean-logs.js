import { readdir, unlink, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../src/config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOGS_DIR = join(__dirname, '../logs');
const MAX_AGE_DAYS = 30; // Delete logs older than 30 days

/**
 * Get file age in days
 */
const getFileAgeDays = async (filePath) => {
  const stats = await stat(filePath);
  const ageMs = Date.now() - stats.mtime.getTime();
  return ageMs / (1000 * 60 * 60 * 24);
};

/**
 * Clean old log files
 */
const cleanLogs = async () => {
  try {
    logger.info('Starting log cleanup...');

    // Check if logs directory exists
    try {
      await stat(LOGS_DIR);
    } catch (error) {
      logger.warn('Logs directory does not exist');
      console.log('No logs directory found. Nothing to clean.');
      return;
    }

    const files = await readdir(LOGS_DIR);
    
    if (files.length === 0) {
      logger.info('No log files found');
      console.log('No log files to clean.');
      return;
    }

    let deletedCount = 0;
    let totalSize = 0;

    for (const file of files) {
      const filePath = join(LOGS_DIR, file);
      
      try {
        const fileStats = await stat(filePath);
        
        // Skip if not a file
        if (!fileStats.isFile()) {
          continue;
        }

        // Check if file is old enough to delete
        const ageDays = await getFileAgeDays(filePath);
        
        if (ageDays > MAX_AGE_DAYS) {
          totalSize += fileStats.size;
          await unlink(filePath);
          deletedCount++;
          logger.info('Deleted old log file', { 
            file, 
            ageDays: ageDays.toFixed(1),
            sizeMB: (fileStats.size / (1024 * 1024)).toFixed(2)
          });
        }
      } catch (error) {
        logger.error('Error processing log file', { 
          file, 
          error: error.message 
        });
      }
    }

    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    logger.info('Log cleanup completed', {
      deletedFiles: deletedCount,
      freedSpaceMB: totalSizeMB
    });

    console.log('\n=== Log Cleanup Summary ===');
    console.log(`Files deleted: ${deletedCount}`);
    console.log(`Space freed: ${totalSizeMB} MB`);
    console.log(`Retention period: ${MAX_AGE_DAYS} days`);
    console.log('===========================\n');

    if (deletedCount === 0) {
      console.log('✅ No old log files to clean.');
    } else {
      console.log(`✅ Successfully cleaned ${deletedCount} old log file(s).`);
    }

  } catch (error) {
    logger.error('Log cleanup failed', { error: error.message });
    console.error('❌ Log cleanup failed:', error.message);
    process.exit(1);
  }
};

/**
 * Get log directory statistics
 */
const getLogStats = async () => {
  try {
    const files = await readdir(LOGS_DIR);
    let totalSize = 0;
    let fileCount = 0;

    for (const file of files) {
      const filePath = join(LOGS_DIR, file);
      const stats = await stat(filePath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
        fileCount++;
      }
    }

    return {
      fileCount,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    return { fileCount: 0, totalSizeMB: 0 };
  }
};

// Show stats before cleanup
getLogStats()
  .then(stats => {
    console.log('\n=== Current Log Statistics ===');
    console.log(`Total files: ${stats.fileCount}`);
    console.log(`Total size: ${stats.totalSizeMB} MB`);
    console.log('==============================\n');
    return cleanLogs();
  })
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    logger.error('Script execution failed', { error: error.message });
    process.exit(1);
  });