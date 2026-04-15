#!/usr/bin/env node

/**
 * Simple migration runner for local development.
 * Reads all .sql files from migrations/ in order and executes them.
 *
 * Usage: node infrastructure/sql/run-migrations.js
 * Requires DATABASE_URL env var or uses default local dev connection.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://hotel_api_user:localdev123@localhost:5432/hotel_ops';

async function runMigrations() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database.\n');

    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Get already-applied migrations
    const { rows: applied } = await client.query(
      'SELECT filename FROM _migrations ORDER BY filename',
    );
    const appliedSet = new Set(applied.map((r) => r.filename));

    // Read migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  SKIP  ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`  RUN   ${file}...`);

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        count++;
        console.log(`  DONE  ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`\n  FAIL  ${file}`);
        console.error(`  Error: ${err.message}\n`);
        process.exit(1);
      }
    }

    if (count === 0) {
      console.log('\nAll migrations already applied. Database is up to date.');
    } else {
      console.log(`\nApplied ${count} migration(s) successfully.`);
    }
  } catch (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
