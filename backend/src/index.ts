import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { closePool, getPool, migrate } from './db/index.js';
import { competitionsRouter } from './routes/competitions.js';
import { submissionsRouter } from './routes/submissions.js';
import { participantsRouter } from './routes/participants.js';
import { leaderboardRouter } from './routes/leaderboard.js';

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get('/health', async (_req, res, next) => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    const { ESCROW_CONTRACT_ID, NATIVE_XLM_TOKEN_CONTRACT, PRIZE_ASSET } = await import(
      './config/stellar.js'
    );
    res.json({
      ok: true,
      service: 'zaotrak-api',
      database: 'postgresql',
      escrowContractId: ESCROW_CONTRACT_ID,
      prizeTokenContract: NATIVE_XLM_TOKEN_CONTRACT,
      prizeAsset: PRIZE_ASSET,
    });
  } catch (e) {
    next(e);
  }
});

app.use('/competitions', competitionsRouter);
app.use('/submissions', submissionsRouter);
app.use('/participants', participantsRouter);
app.use('/leaderboard', leaderboardRouter);

app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message });
  },
);

async function main() {
  await migrate();
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

main().catch(async (e) => {
  console.error(e);
  await closePool();
  process.exit(1);
});

process.on('SIGINT', () => void closePool().then(() => process.exit(0)));
process.on('SIGTERM', () => void closePool().then(() => process.exit(0)));
