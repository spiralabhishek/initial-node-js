import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir } from 'fs/promises';
import { logger } from '../src/config/logger.js';
import { query, closePool } from '../src/database/pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run database migrations
 */
const runMigrations = async () => {
  try {
    logger.info('Starting database migrations...');

    // Create migrations table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of executed migrations
    const executedResult = await query('SELECT name FROM migrations ORDER BY id');
    const executedMigrations = executedResult.rows.map(row => row.name);

    // Get all migration files
    const migrationsDir = join(__dirname, '../src/database/migrations');
    const files = await readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.js'))
      .sort();

    logger.info(`Found ${migrationFiles.length} migration files`);

    // Run pending migrations
    for (const file of migrationFiles) {
      const migrationName = file.replace('.js', '');

      if (executedMigrations.includes(migrationName)) {
        logger.info(`Migration ${migrationName} already executed, skipping...`);
        continue;
      }

      logger.info(`Running migration: ${migrationName}`);

      try {
        // Import and execute migration
        const migrationPath = join(migrationsDir, file);
        const migration = await import(`file://${migrationPath}`);
        
        await migration.up();

        // Record migration
        await query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migrationName]
        );

        logger.info(`Migration ${migrationName} completed successfully`);
      } catch (error) {
        logger.error(`Migration ${migrationName} failed`, {
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration process failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    await closePool();
  }
};

// Run migrations
runMigrations()
  .then(() => {
    logger.info('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration script failed', { error: error.message });
    process.exit(1);
  });