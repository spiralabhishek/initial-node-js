import { config } from '../src/config/env.js';
import { logger } from '../src/config/logger.js';

/**
 * Setup test environment
 */
const setup = () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Disable logging during tests (optional)
  logger.transports.forEach(transport => {
    transport.silent = true;
  });

  // Set test database (make sure to use a separate test database)
  if (!process.env.DB_NAME?.includes('test')) {
    console.warn('\n⚠️  WARNING: Not using a test database!\n');
  }

  // Global test timeout
  jest.setTimeout(10000);

  console.log('Test environment initialized');
};

// Run setup
setup();

export default setup;