import { config } from '../src/config/env.js';
import { logger } from '../src/config/logger.js';

/**
 * Security configuration checker
 */
const checkSecurityConfig = () => {
  const issues = [];
  const warnings = [];

  logger.info('Running security configuration check...');

  // Check JWT secrets
  if (config.jwt.accessSecret.length < 32) {
    issues.push('JWT access secret is too short (minimum 32 characters)');
  }

  if (config.jwt.refreshSecret.length < 32) {
    issues.push('JWT refresh secret is too short (minimum 32 characters)');
  }

  if (config.jwt.accessSecret === config.jwt.refreshSecret) {
    issues.push('JWT access and refresh secrets should be different');
  }

  // Check for default/weak secrets
  const weakSecrets = [
    'your_jwt_access_secret_key_here_change_this_in_production',
    'your_jwt_refresh_secret_key_here_change_this_in_production',
    'your_cookie_secret_key_here_change_this_in_production',
    'secret',
    'password',
    '12345'
  ];

  if (weakSecrets.includes(config.jwt.accessSecret)) {
    issues.push('JWT access secret is using default/weak value');
  }

  if (weakSecrets.includes(config.jwt.refreshSecret)) {
    issues.push('JWT refresh secret is using default/weak value');
  }

  if (config.security.cookieSecret && weakSecrets.includes(config.security.cookieSecret)) {
    issues.push('Cookie secret is using default/weak value');
  }

  // Production-specific checks
  if (config.isProduction) {
    if (!config.security.cookieSecure) {
      issues.push('Cookie secure flag should be true in production');
    }

    if (config.cors.origin.includes('*')) {
      issues.push('CORS should not allow all origins in production');
    }

    if (config.logging.level === 'debug') {
      warnings.push('Debug logging should be disabled in production');
    }
  }

  // Check database password
  if (config.database.password.length < 12) {
    warnings.push('Database password is weak (recommended minimum 12 characters)');
  }

  // Check bcrypt rounds
  if (config.bcrypt.rounds < 10) {
    warnings.push('Bcrypt rounds should be at least 10 for security');
  }

  if (config.bcrypt.rounds > 15) {
    warnings.push('Bcrypt rounds above 15 may impact performance');
  }

  // Report results
  console.log('\n=== Security Configuration Check ===\n');

  if (issues.length > 0) {
    console.log('❌ CRITICAL ISSUES:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
    console.log('');
  }

  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ All security checks passed!');
  }

  console.log('\n=== End Security Check ===\n');

  logger.info('Security check completed', {
    issues: issues.length,
    warnings: warnings.length
  });

  // Exit with error code if critical issues found
  if (issues.length > 0) {
    process.exit(1);
  }
};

// Run security check
try {
  checkSecurityConfig();
  process.exit(0);
} catch (error) {
  logger.error('Security check failed', { error: error.message });
  process.exit(1);
}