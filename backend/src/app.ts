import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { migrate } from './db/index.js';
import { competitionsRouter } from './routes/competitions.js';
import { submissionsRouter } from './routes/submissions.js';
import { participantsRouter } from './routes/participants.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { aiRouter } from './routes/ai.js';

let ready: Promise<void> | null = null;

function ensureReady(): Promise<void> {
  if (!ready) {
    ready = migrate().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.use(async (_req, _res, next) => {
  try {
    await ensureReady();
    next();
  } catch (e) {
    next(e);
  }
});

app.get('/health', async (_req, res, next) => {
  try {
    const { getPool } = await import('./db/index.js');
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
app.use('/ai', aiRouter);

app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message });
  },
);

export default app;
