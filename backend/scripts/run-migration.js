#!/usr/bin/env node

/**
 * Migration Runner — Exécuter une migration SQL spécifique
 * Usage: node scripts/run-migration.js V004_promises.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/database.js';
import logger from '../src/core/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration(filename) {
  const client = await pool.connect();

  try {
    // Build path
    const migrationPath = path.join(__dirname, '..', 'src', 'database', 'migrations', filename);

    // Check file exists
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    // Read SQL
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    logger.info(`Executing migration: ${filename}`, { meta: {} });

    // Execute
    const startTime = Date.now();
    await client.query(sql);
    const duration = Date.now() - startTime;

    logger.info(`✅ Migration completed successfully: ${filename} (${duration}ms)`, {
      meta: { duration },
    });

    return {
      success: true,
      filename,
      duration,
    };
  } catch (err) {
    logger.error(`❌ Migration failed: ${filename}`, {
      meta: {
        error: err.message,
        detail: err.detail,
      },
    });

    throw err;
  } finally {
    client.release();
  }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/run-migration.js <filename>');
  console.error('Example: node scripts/run-migration.js V004_promises.sql');
  process.exit(1);
}

const filename = args[0];

runMigration(filename)
  .then(result => {
    console.log(`\n✨ Migration executed successfully!`);
    console.log(`   File: ${result.filename}`);
    console.log(`   Time: ${result.duration}ms`);
    process.exit(0);
  })
  .catch(err => {
    console.error(`\n❌ Migration failed!`);
    console.error(`   Error: ${err.message}`);
    process.exit(1);
  });
