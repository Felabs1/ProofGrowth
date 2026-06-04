import { closePool } from './db/index.js';
import app from './app.js';

export default app;

/** Local `npm run dev` only — Vercel runs the default export as a serverless function. */
async function main() {
  const PORT = Number(process.env.PORT ?? 3001);
  const server = app.listen(PORT, () => {
    console.log(`ZaoTrak API listening on http://localhost:${PORT}`);
  });
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${PORT} is already in use. Stop the other process (e.g. lsof -i :${PORT}) or set PORT in .env.`,
      );
      process.exit(1);
    }
    throw err;
  });
}

if (!process.env.VERCEL) {
  main().catch(async (e) => {
    console.error(e);
    await closePool();
    process.exit(1);
  });

  process.on('SIGINT', () => void closePool().then(() => process.exit(0)));
  process.on('SIGTERM', () => void closePool().then(() => process.exit(0)));
}
