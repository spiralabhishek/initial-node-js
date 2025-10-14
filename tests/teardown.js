import { closePool } from '../src/database/pool.js';
import { logger } from '../src/config/logger.js';

/**
 * Teardown test environment
 */
const teardown = async () => {
  try {
    // Close database connections
    await closePool();
    logger.info('Test database connections closed');
    console.log('Test environment cleaned up');
  } catch (error) {
    logger.error('Error during test teardown', { error: error.message });
  }
};

export default teardown;