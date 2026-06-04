import { Router } from 'express';
import { getPool } from '../db/index.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import type { SubmissionRow } from '../types.js';

const router = Router();

router.get(
  '/:wallet/submissions',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const { rows } = await pool.query<SubmissionRow & { competition_title: string }>(
      `
      SELECT s.*, c.title AS competition_title
      FROM submissions s
      JOIN competitions c ON c.id = s.competition_id
      WHERE s.participant_wallet = $1
      ORDER BY s.submitted_at DESC
    `,
      [req.params.wallet],
    );

    res.json({
      submissions: rows.map((r) => ({
        id: r.id,
        competitionId: r.competition_id,
        competitionTitle: r.competition_title,
        participantName: r.participant_name ?? r.participant_wallet,
        participantWallet: r.participant_wallet,
        submittedAt:
          r.submitted_at instanceof Date
            ? r.submitted_at.toISOString().replace('T', ' ').slice(0, 16)
            : String(r.submitted_at),
        summary: r.summary,
        claimedMetric: r.claimed_metric,
        evidence: r.evidence,
        evidenceUrl: r.evidence_url ?? undefined,
        status: r.status,
        pointsAwarded: r.points_awarded ?? undefined,
        founderNote: r.founder_note ?? undefined,
      })),
    });
  }),
);

router.get(
  '/:wallet/competitions',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const { rows } = await pool.query<{ competition_id: string }>(
      'SELECT competition_id FROM participations WHERE participant_wallet = $1',
      [req.params.wallet],
    );
    res.json({ competitionIds: rows.map((r) => r.competition_id) });
  }),
);

export { router as participantsRouter };
