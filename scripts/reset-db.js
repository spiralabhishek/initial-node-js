import { query, closePool } from '../src/database/pool.js';
import { logger } from '../src/config/logger.js';
import { config } from '../src/config/env.js';
import readline from 'readline';

/**
 * Create readline interface for user confirmation
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Ask for user confirmation
 */
const askConfirmation = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
};

/**
 * Drop all tables
 */
const dropAllTables = async () => {
  try {
    logger.info('Dropping all tables...');

    // Get all table names
    const result = await query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    const tables = result.rows.map(row => row.tablename);

    if (tables.length === 0) {
      logger.info('No tables to drop');
      return;
    }

    // Drop each table
    for (const table of tables) {
      await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      logger.info(`Dropped table: ${table}`);
    }

    logger.info('All tables dropped successfully');
  } catch (error) {
    logger.error('Error dropping tables', { error: error.message });
    throw error;
  }
};

/**
 * Drop all functions
 */
const dropAllFunctions = async () => {
  try {
    logger.info('Dropping all functions...');

    const result = await query(`
      SELECT proname, pg_get_function_identity_arguments(oid) as args
      FROM pg_proc
      WHERE pronamespace = 'public'::regnamespace
    `);

    for (const row of result.rows) {
      const funcName = row.proname;
      const funcArgs = row.args || '';
      
      try {
        await query(`DROP FUNCTION IF EXISTS ${funcName}(${funcArgs}) CASCADE`);
        logger.info(`Dropped function: ${funcName}`);
      } catch (error) {
        logger.warn(`Could not drop function ${funcName}`, { error: error.message });
      }
    }

    logger.info('All functions dropped successfully');
  } catch (error) {
    logger.error('Error dropping functions', { error: error.message });
    // Don't throw - continue even if function drop fails
  }
};

/**
 * Run migrations after reset
 */
const runMigrations = async () => {
  try {
    logger.info('Running migrations...');
    
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    const { readdir } = await import('fs/promises');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    const migrationsDir = join(__dirname, '../src/database/migrations');
    const files = await readdir(migrationsDir);
    const migrationFiles = files.filter(file => file.endsWith('.js')).sort();

    for (const file of migrationFiles) {
      const migrationPath = join(migrationsDir, file);
      const migration = await import(`file://${migrationPath}`);
      
      logger.info(`Running migration: ${file}`);
      await migration.up();
      logger.info(`Migration completed: ${file}`);
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Error running migrations', { error: error.message });
    throw error;
  }
};

/**
 * Main reset function
 */
const resetDatabase = async () => {
  try {
    console.log('\n⚠️  DATABASE RESET WARNING ⚠️\n');
    console.log('This will:');
    console.log('1. Drop all tables');
    console.log('2. Drop all functions');
    console.log('3. Delete all data');
    console.log('4. Run migrations to recreate tables\n');
    console.log(`Database: ${config.database.name}`);
    console.log(`Host: ${config.database.host}\n`);

    // Don't allow reset in production without explicit confirmation
    if (config.isProduction) {
      console.log('❌ Production environment detected!');
      console.log('For safety, please run this manually with extra confirmation.\n');
      process.exit(1);
    }

    const confirmed = await askConfirmation(
      'Are you sure you want to reset the database? (yes/no): '
    );

    if (!confirmed) {
      console.log('\n✅ Database reset cancelled.\n');
      process.exit(0);
    }

    const doubleConfirmed = await askConfirmation(
      'This action cannot be undone. Type "yes" again to confirm: '
    );

    if (!doubleConfirmed) {
      console.log('\n✅ Database reset cancelled.\n');
      process.exit(0);
    }

    console.log('\n🔄 Starting database reset...\n');

    // Drop all tables
    await dropAllTables();

    // Drop all functions
    await dropAllFunctions();

    // Run migrations
    await runMigrations();

    console.log('\n✅ Database reset completed successfully!\n');
    logger.info('Database reset completed successfully');

  } catch (error) {
    console.error('\n❌ Database reset failed:', error.message, '\n');
    logger.error('Database reset failed', { 
      error: error.message, 
      stack: error.stack 
    });
    process.exit(1);
  } finally {
    rl.close();
    await closePool();
  }
};

// Run reset
resetDatabase();