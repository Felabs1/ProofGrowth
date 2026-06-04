import { Router } from 'express';
import { z } from 'zod';
import { getPool } from '../db/index.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { zodErrorMessage } from '../lib/validation.js';
import type { SubmissionRow } from '../types.js';

const router = Router();

const reviewSchema = z.object({
  founder_wallet: z.string().min(1),
  status: z.enum(['approved', 'rejected', 'revision_requested']),
  points_awarded: z.number().int().nonnegative().optional(),
  founder_note: z.string().optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const founderWallet = req.query.founderWallet as string | undefined;
    const competitionId = req.query.competitionId as string | undefined;
    const tab = req.query.tab as string | undefined;

    if (!founderWallet) {
      res.status(400).json({ error: 'Query param founderWallet is required' });
      return;
    }

    const pool = getPool();
    const params: unknown[] = [founderWallet];
    let sql = `
      SELECT s.*, c.title AS competition_title
      FROM submissions s
      JOIN competitions c ON c.id = s.competition_id
      WHERE c.founder_wallet = $1
    `;

    if (competitionId) {
      params.push(competitionId);
      sql += ` AND s.competition_id = $${params.length}`;
    }
    if (tab === 'pending') {
      sql += " AND s.status IN ('pending', 'revision_requested')";
    } else if (tab === 'approved') {
      sql += " AND s.status IN ('approved', 'rejected')";
    }
    sql += ' ORDER BY s.submitted_at DESC';

    const { rows } = await pool.query<SubmissionRow & { competition_title: string }>(sql, params);
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

router.patch(
  '/:id/review',
  asyncHandler(async (req, res) => {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: zodErrorMessage(parsed.error), details: parsed.error.flatten() });
      return;
    }
    const { founder_wallet, status, points_awarded, founder_note } = parsed.data;
    if (status === 'approved' && (points_awarded === undefined || points_awarded < 0)) {
      res.status(400).json({ error: 'points_awarded is required when status is approved' });
      return;
    }

    const pool = getPool();
    const found = await pool.query<SubmissionRow & { founder_wallet: string; competition_title: string }>(
      `
      SELECT s.*, c.founder_wallet, c.title AS competition_title
      FROM submissions s
      JOIN competitions c ON c.id = s.competition_id
      WHERE s.id = $1
    `,
      [req.params.id],
    );
    const sub = found.rows[0];
    if (!sub) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }
    if (sub.founder_wallet !== founder_wallet) {
      res.status(403).json({ error: 'Only the competition founder can review' });
      return;
    }

    await pool.query(
      `
      UPDATE submissions
      SET status = $1, points_awarded = $2, founder_note = $3, reviewed_at = NOW()
      WHERE id = $4
    `,
      [
        status,
        status === 'approved' ? (points_awarded ?? 0) : null,
        founder_note ?? null,
        req.params.id,
      ],
    );

    const { rows } = await pool.query<SubmissionRow>('SELECT * FROM submissions WHERE id = $1', [
      req.params.id,
    ]);
    const updated = rows[0];
    res.json({
      submission: {
        id: updated.id,
        competitionId: updated.competition_id,
        competitionTitle: sub.competition_title,
        participantName: updated.participant_name ?? updated.participant_wallet,
        participantWallet: updated.participant_wallet,
        submittedAt:
          updated.submitted_at instanceof Date
            ? updated.submitted_at.toISOString().replace('T', ' ').slice(0, 16)
            : String(updated.submitted_at),
        summary: updated.summary,
        claimedMetric: updated.claimed_metric,
        evidence: updated.evidence,
        evidenceUrl: updated.evidence_url ?? undefined,
        status: updated.status,
        pointsAwarded: updated.points_awarded ?? undefined,
        founderNote: updated.founder_note ?? undefined,
      },
    });
  }),
);

export { router as submissionsRouter };
