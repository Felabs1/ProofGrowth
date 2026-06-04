import pg from 'pg';
import { MIGRATION_SQL } from './migrations.js';
import { SCHEMA_SQL } from './schema.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is required (e.g. postgresql://zaotrak:zaotrak@localhost:5432/zaotrak)',
    );
  }
  return url;
}

export function getPool(): pg.Pool {
  if (pool) return pool;
  pool = new Pool({
    connectionString: getDatabaseUrl(),
    // Serverless: keep a single connection per instance to avoid exhausting Postgres limits.
    max: process.env.VERCEL ? 1 : 20,
  });
  return pool;
}

export async function migrate(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(SCHEMA_SQL);
    await client.query(MIGRATION_SQL);
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
