import { Router } from 'express';
import { getPool } from '../db/index.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.get(
  '/global',
  asyncHandler(async (_req, res) => {
    const pool = getPool();
    const { rows } = await pool.query<{
      participant_wallet: string;
      participant_name: string | null;
      pts: string;
      approved_count: string;
      competitions: string;
    }>(
      `
      SELECT
        s.participant_wallet,
        MAX(s.participant_name) AS participant_name,
        COALESCE(SUM(s.points_awarded), 0)::int AS pts,
        COUNT(*)::int AS approved_count,
        COUNT(DISTINCT s.competition_id)::int AS competitions
      FROM submissions s
      WHERE s.status = 'approved'
      GROUP BY s.participant_wallet
      ORDER BY pts DESC, approved_count DESC
      LIMIT 100
    `,
    );

    const leaderboard = rows.map((r, i) => ({
      rank: i + 1,
      name: r.participant_name ?? r.participant_wallet.slice(0, 8) + '…',
      wallet: r.participant_wallet,
      pts: Number(r.pts),
      approvedSubmissions: Number(r.approved_count),
      competitions: Number(r.competitions),
    }));

    res.json({ leaderboard });
  }),
);

export { router as leaderboardRouter };
