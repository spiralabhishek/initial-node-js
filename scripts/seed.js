import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir } from 'fs/promises';
import { logger } from '../src/config/logger.js';
import { query, closePool } from '../src/database/pool.js';
import { config } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run database seeds
 */
const runSeeds = async () => {
  try {
    logger.info('Starting database seeding...');

    // Prevent seeding in production
    if (config.isProduction) {
      console.log('\n⚠️  Cannot seed database in production environment!');
      console.log('Seeds are for development/testing only.\n');
      process.exit(1);
    }

    // Create seeds table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS seeds (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of executed seeds
    const executedResult = await query('SELECT name FROM seeds ORDER BY id');
    const executedSeeds = executedResult.rows.map(row => row.name);

    // Get all seed files
    const seedsDir = join(__dirname, '../src/database/seeds');
    const files = await readdir(seedsDir);
    const seedFiles = files
      .filter(file => file.endsWith('.js'))
      .sort();

    if (seedFiles.length === 0) {
      logger.info('No seed files found');
      console.log('\n✅ No seed files to execute.\n');
      return;
    }

    logger.info(`Found ${seedFiles.length} seed files`);

    // Run pending seeds
    let executedCount = 0;

    for (const file of seedFiles) {
      const seedName = file.replace('.js', '');

      if (executedSeeds.includes(seedName)) {
        logger.info(`Seed ${seedName} already executed, skipping...`);
        continue;
      }

      logger.info(`Running seed: ${seedName}`);
      console.log(`\n🌱 Seeding: ${seedName}...`);

      try {
        // Import and execute seed
        const seedPath = join(seedsDir, file);
        const seed = await import(`file://${seedPath}`);
        
        if (typeof seed.seed !== 'function') {
          logger.warn(`Seed ${seedName} does not export a seed function`);
          continue;
        }

        await seed.seed();

        // Record seed execution
        await query(
          'INSERT INTO seeds (name) VALUES ($1)',
          [seedName]
        );

        executedCount++;
        logger.info(`Seed ${seedName} completed successfully`);
        console.log(`✅ ${seedName} completed`);
      } catch (error) {
        logger.error(`Seed ${seedName} failed`, {
          error: error.message,
          stack: error.stack
        });
        console.error(`❌ Seed ${seedName} failed: ${error.message}`);
        throw error;
      }
    }

    if (executedCount === 0) {
      console.log('\n✅ All seeds already executed.\n');
    } else {
      console.log(`\n✅ Successfully executed ${executedCount} seed(s).\n`);
    }

    logger.info('Database seeding completed', { executedCount });
  } catch (error) {
    logger.error('Database seeding failed', { 
      error: error.message, 
      stack: error.stack 
    });
    console.error('\n❌ Database seeding failed:', error.message, '\n');
    throw error;
  } finally {
    await closePool();
  }
};

// Run seeds
runSeeds()
  .then(() => {
    logger.info('Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Seed script failed', { error: error.message });
    process.exit(1);
  });