import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, copyFile, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../src/config/logger.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BUILD_DIR = join(__dirname, '../dist');
const SRC_DIR = join(__dirname, '../src');

/**
 * Clean build directory
 */
const cleanBuildDir = async () => {
  try {
    logger.info('Cleaning build directory...');
    await execAsync(`rm -rf ${BUILD_DIR}`);
    await mkdir(BUILD_DIR, { recursive: true });
    logger.info('Build directory cleaned');
  } catch (error) {
    logger.error('Error cleaning build directory', { error: error.message });
    throw error;
  }
};

/**
 * Copy source files to build directory
 */
const copyFiles = async (src, dest) => {
  try {
    const entries = await readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);

      if (entry.isDirectory()) {
        await mkdir(destPath, { recursive: true });
        await copyFiles(srcPath, destPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        await copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    logger.error('Error copying files', { error: error.message });
    throw error;
  }
};

/**
 * Run linting
 */
const runLint = async () => {
  try {
    logger.info('Running ESLint...');
    await execAsync('npm run lint');
    logger.info('Linting completed successfully');
  } catch (error) {
    logger.warn('Linting found issues', { error: error.message });
    // Don't throw - continue build even with lint warnings
  }
};

/**
 * Run tests
 */
const runTests = async () => {
  try {
    logger.info('Running tests...');
    await execAsync('npm test');
    logger.info('All tests passed');
  } catch (error) {
    logger.error('Tests failed', { error: error.message });
    throw error;
  }
};

/**
 * Copy package.json and other necessary files
 */
const copyConfigFiles = async () => {
  try {
    logger.info('Copying configuration files...');
    
    const filesToCopy = [
      'package.json',
      '.env.example'
    ];

    for (const file of filesToCopy) {
      const srcPath = join(__dirname, '..', file);
      const destPath = join(BUILD_DIR, file);
      await copyFile(srcPath, destPath);
    }

    logger.info('Configuration files copied');
  } catch (error) {
    logger.error('Error copying config files', { error: error.message });
    throw error;
  }
};

/**
 * Generate build info
 */
const generateBuildInfo = async () => {
  try {
    const buildInfo = {
      buildTime: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };

    const buildInfoPath = join(BUILD_DIR, 'build-info.json');
    const { writeFile } = await import('fs/promises');
    await writeFile(buildInfoPath, JSON.stringify(buildInfo, null, 2));
    
    logger.info('Build info generated', buildInfo);
  } catch (error) {
    logger.error('Error generating build info', { error: error.message });
  }
};

/**
 * Main build process
 */
const build = async () => {
  const startTime = Date.now();
  
  try {
    logger.info('Starting build process...');

    // Run lint
    await runLint();

    // Run tests (optional - comment out if not needed)
    // await runTests();

    // Clean build directory
    await cleanBuildDir();

    // Copy source files
    logger.info('Copying source files...');
    await copyFiles(SRC_DIR, join(BUILD_DIR, 'src'));

    // Copy scripts directory
    const scriptsDir = join(__dirname);
    await mkdir(join(BUILD_DIR, 'scripts'), { recursive: true });
    await copyFiles(scriptsDir, join(BUILD_DIR, 'scripts'));

    // Copy configuration files
    await copyConfigFiles();

    // Generate build info
    await generateBuildInfo();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`Build completed successfully in ${duration}s`);
    
    console.log('\n✅ Build completed successfully!');
    console.log(`📦 Output directory: ${BUILD_DIR}`);
    console.log(`⏱️  Build time: ${duration}s\n`);
    
  } catch (error) {
    logger.error('Build failed', { error: error.message, stack: error.stack });
    console.error('\n❌ Build failed:', error.message, '\n');
    process.exit(1);
  }
};

// Run build
build();