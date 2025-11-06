// scripts/syncDatabase.js
import { sequelize, models } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';

const runSync = async () => {
  try {
    logger.info('🚀 Starting database synchronization...');

    // Test connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established.');

    // Check CLI options
    const force = process.argv.includes('--force');
    const alter = process.argv.includes('--alter');

    if (force) {
      logger.warn('⚠️ Force sync enabled. This will DROP and RECREATE all tables!');
    } else if (alter) {
      logger.info('🔄 Alter sync enabled. This will UPDATE existing tables.');
    } else {
      logger.info('✨ Safe sync (no destructive changes).');
    }

    // Sync models
    await sequelize.sync({ force, alter });

    logger.info('✅ All models synchronized successfully.');

    // Log model list
    logger.info('📦 Synced models:', Object.keys(models));

    // Close connection
    await sequelize.close();
    logger.info('🧹 Database connection closed gracefully.');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Database synchronization failed:', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

// Run script
runSync();
