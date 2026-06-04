import 'dotenv/config';
import { getPool, closePool } from './index.js';

async function main() {
  const pool = getPool();
  await pool.query('TRUNCATE submissions, participations, competitions CASCADE');
  console.log('Cleared competitions, submissions, and participations.');
  await closePool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
