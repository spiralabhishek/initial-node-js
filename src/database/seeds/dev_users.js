import bcrypt from 'bcrypt';
import { query } from '../pool.js';
import { logger } from '../../config/logger.js';
import { config } from '../../config/env.js';

/**
 * Seed development users
 */
export const seed = async () => {
  try {
    logger.info('Seeding development users...');

    // Sample users for development
    const users = [
      {
        email: 'admin@example.com',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'User'
      },
      {
        email: 'user@example.com',
        password: 'User123!',
        firstName: 'Test',
        lastName: 'User'
      },
      {
        email: 'john.doe@example.com',
        password: 'John123!',
        firstName: 'John',
        lastName: 'Doe'
      }
    ];

    for (const user of users) {
      // Check if user already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [user.email]
      );

      if (existingUser.rows.length > 0) {
        logger.info(`User ${user.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, config.bcrypt.rounds);

      // Insert user
      await query(
        `INSERT INTO users (email, password, first_name, last_name, is_verified)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.email, hashedPassword, user.firstName, user.lastName, true]
      );

      logger.info(`Created user: ${user.email}`);
      console.log(`   ✓ Created: ${user.email} (password: ${user.password})`);
    }

    console.log('\n   📝 You can login with any of the above credentials');
    logger.info('Development users seeded successfully');
  } catch (error) {
    logger.error('Error seeding users', { error: error.message });
    throw error;
  }
};

export default { seed };