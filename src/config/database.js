import { Sequelize } from 'sequelize';
import { config } from './env.js';
import { logger } from './logger.js';
import { initModels } from '../models/index.js';

/**
 * Initialize Sequelize instance
 */
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: config.env === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: config.database.maxConnections || 10,
      min: 2,
      acquire: config.database.connectionTimeout || 30000,
      idle: config.database.idleTimeout || 10000,
    },
    dialectOptions: {
      ssl:
        config.isProduction || process.env.DB_SSL === 'true'
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : false,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  }
);

// Initialize models
const models = initModels(sequelize);

/**
 * Test and connect to database
 */
export const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully.');

    if (config.env === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('✅ Database models synchronized (alter mode)');
    } else {
      logger.info('ℹ️ Skipping auto-sync (use migrations in production).');
    }

    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', { error: error.message });
    throw error;
  }
};

/**
 * Graceful shutdown
 */
export const closeDatabase = async () => {
  try {
    await sequelize.close();
    logger.info('🧹 Database connection closed gracefully.');
  } catch (error) {
    logger.error('Error closing database connection:', { error: error.message });
  }
};

export { sequelize, models };
