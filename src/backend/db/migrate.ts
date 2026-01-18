import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './connection.js';

async function migrate() {
  console.log('🔄 Starting database migration...');

  try {
    const schemaPath = join(import.meta.dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate();
