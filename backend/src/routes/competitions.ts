import { Router } from 'express';
import { z } from 'zod';
import { getPool } from '../db/index.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { mapCompetition } from '../mappers.js';
import { optionalEvidenceUrl, zodErrorMessage } from '../lib/validation.js';
import { NATIVE_XLM_TOKEN_CONTRACT, PRIZE_ASSET } from '../config/stellar.js';
import type { CompetitionRow, SubmissionRow } from '../types.js';

const router = Router();

const createSchema = z.object({
  founder_wallet: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().default(''),
  category: z.string().optional(),
  goal_type: z.enum(['users', 'volume', 'leads']),
  instructions: z.string().optional().default(''),
  proof_requirements: z.array(z.string()).optional().default([]),
  scoring_rules: z.array(z.object({ label: z.string(), points: z.number() })).optional().default([]),
  prize_pool: z.number().positive(),
  prize_asset: z.string().optional().default(PRIZE_ASSET),
  token_contract: z.string().optional(),
  winners_count: z.number().int().positive(),
  winner_split: z
    .union([z.object({ top: z.number() }), z.object({ split: z.array(z.number()) })])
    .optional(),
  start_at: z.string(),
  end_at: z.string(),
  on_chain_id: z.number().int().nonnegative().optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const founderWallet = req.query.founderWallet as string | undefined;
    const { rows } = founderWallet
      ? await pool.query<CompetitionRow>(
          'SELECT * FROM competitions WHERE founder_wallet = $1 ORDER BY created_at DESC',
          [founderWallet],
        )
      : await pool.query<CompetitionRow>(
          'SELECT * FROM competitions ORDER BY created_at DESC',
        );
    const competitions = await Promise.all(rows.map((r) => mapCompetition(pool, r)));
    res.json({ competitions });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const { rows } = await pool.query<CompetitionRow>('SELECT * FROM competitions WHERE id = $1', [
      req.params.id,
    ]);
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: 'Competition not found' });
      return;
    }
    res.json({ competition: await mapCompetition(pool, row) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: zodErrorMessage(parsed.error), details: parsed.error.flatten() });
      return;
    }
    const data = parsed.data;
    const id = `comp-${Date.now()}`;
    const pool = getPool();
    const winnerSplit = data.winner_split ?? { top: data.winners_count };
    const status = data.on_chain_id != null ? 'active' : 'upcoming';
    const tokenContract = data.token_contract ?? NATIVE_XLM_TOKEN_CONTRACT;
    await pool.query(
      `
      INSERT INTO competitions (
        id, on_chain_id, founder_wallet, title, description, category, goal_type,
        instructions, proof_requirements, scoring_rules, prize_pool, prize_asset,
        token_contract, winners_count, winner_split, start_at, end_at, status, progress
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,0)
    `,
      [
        id,
        data.on_chain_id ?? null,
        data.founder_wallet,
        data.title,
        data.description,
        data.category ?? null,
        data.goal_type,
        data.instructions,
        JSON.stringify(data.proof_requirements),
        JSON.stringify(data.scoring_rules),
        data.prize_pool,
        data.prize_asset,
        tokenContract,
        data.winners_count,
        JSON.stringify(winnerSplit),
        data.start_at,
        data.end_at,
        status,
      ],
    );
    const { rows } = await pool.query<CompetitionRow>('SELECT * FROM competitions WHERE id = $1', [id]);
    res.status(201).json({ competition: await mapCompetition(pool, rows[0]) });
  }),
);

router.post(
  '/:id/join',
  asyncHandler(async (req, res) => {
    const joinSchema = z.object({
      participant_wallet: z.string().min(1),
      participant_name: z.string().optional(),
    });
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: zodErrorMessage(parsed.error), details: parsed.error.flatten() });
      return;
    }
    const pool = getPool();
    const comp = await pool.query('SELECT id FROM competitions WHERE id = $1', [req.params.id]);
    if (comp.rowCount === 0) {
      res.status(404).json({ error: 'Competition not found' });
      return;
    }
    const { participant_wallet, participant_name } = parsed.data;
    await pool.query(
      `
      INSERT INTO participations (competition_id, participant_wallet, participant_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (competition_id, participant_wallet) DO UPDATE SET
        participant_name = COALESCE(EXCLUDED.participant_name, participations.participant_name)
    `,
      [req.params.id, participant_wallet, participant_name ?? null],
    );
    res.json({ joined: true, competitionId: req.params.id, participantWallet: participant_wallet });
  }),
);

const submissionInputSchema = z.object({
  participant_wallet: z.string().min(1),
  participant_name: z.string().optional(),
  summary: z.string().min(1),
  claimed_metric: z.string().min(1),
  evidence: z.string().min(1),
  evidence_url: optionalEvidenceUrl,
});

router.post(
  '/:id/submissions',
  asyncHandler(async (req, res) => {
    const parsed = submissionInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: zodErrorMessage(parsed.error), details: parsed.error.flatten() });
      return;
    }
    const pool = getPool();
    const comp = await pool.query<{ id: string; title: string }>(
      'SELECT id, title FROM competitions WHERE id = $1',
      [req.params.id],
    );
    if (comp.rowCount === 0) {
      res.status(404).json({ error: 'Competition not found' });
      return;
    }
    const data = parsed.data;
    const participation = await pool.query(
      'SELECT 1 FROM participations WHERE competition_id = $1 AND participant_wallet = $2',
      [req.params.id, data.participant_wallet],
    );
    if (participation.rowCount === 0) {
      res.status(400).json({
        error: 'Join the competition before submitting proof',
      });
      return;
    }
    const id = `sub-${Date.now()}`;
    await pool.query(
      `
      INSERT INTO submissions (
        id, competition_id, participant_wallet, participant_name, summary,
        claimed_metric, evidence, evidence_url, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
    `,
      [
        id,
        req.params.id,
        data.participant_wallet,
        data.participant_name ?? null,
        data.summary,
        data.claimed_metric,
        data.evidence,
        data.evidence_url || null,
      ],
    );
    const { rows } = await pool.query<SubmissionRow>('SELECT * FROM submissions WHERE id = $1', [id]);
    res.status(201).json({
      submission: mapSubmissionFromDb(rows[0], comp.rows[0].title),
    });
  }),
);

router.get(
  '/:id/submissions',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const comp = await pool.query<{ id: string; title: string }>(
      'SELECT id, title FROM competitions WHERE id = $1',
      [req.params.id],
    );
    if (comp.rowCount === 0) {
      res.status(404).json({ error: 'Competition not found' });
      return;
    }
    const params: unknown[] = [req.params.id];
    let sql = 'SELECT * FROM submissions WHERE competition_id = $1';
    const tab = req.query.tab as string | undefined;
    const status = req.query.status as string | undefined;
    const wallet = req.query.wallet as string | undefined;

    if (wallet) {
      params.push(wallet);
      sql += ` AND participant_wallet = $${params.length}`;
    }
    if (tab === 'pending') {
      sql += " AND status IN ('pending', 'revision_requested')";
    } else if (tab === 'approved') {
      sql += " AND status IN ('approved', 'rejected')";
    } else if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    sql += ' ORDER BY submitted_at DESC';
    const { rows } = await pool.query<SubmissionRow>(sql, params);
    res.json({
      submissions: rows.map((r) => mapSubmissionFromDb(r, comp.rows[0].title)),
    });
  }),
);

const finalizeSchema = z.object({
  founder_wallet: z.string().min(1),
  payouts: z.array(
    z.object({
      wallet: z.string().min(1),
      amount_xlm: z.number().positive(),
    }),
  ),
});

router.post(
  '/:id/finalize',
  asyncHandler(async (req, res) => {
    const parsed = finalizeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: zodErrorMessage(parsed.error), details: parsed.error.flatten() });
      return;
    }
    const pool = getPool();
    const { rows } = await pool.query<CompetitionRow>('SELECT * FROM competitions WHERE id = $1', [
      req.params.id,
    ]);
    const comp = rows[0];
    if (!comp) {
      res.status(404).json({ error: 'Competition not found' });
      return;
    }
    if (comp.founder_wallet !== parsed.data.founder_wallet) {
      res.status(403).json({ error: 'Only the competition founder can finalize' });
      return;
    }
    const prizePool = typeof comp.prize_pool === 'string' ? parseFloat(comp.prize_pool) : comp.prize_pool;
    const payoutSum = parsed.data.payouts.reduce((s, p) => s + p.amount_xlm, 0);
    if (Math.abs(payoutSum - prizePool) > 0.0001) {
      res.status(400).json({
        error: 'Payout amounts must sum to prize_pool',
        expected: prizePool,
        got: payoutSum,
      });
      return;
    }
    if (comp.on_chain_id == null) {
      res.status(400).json({
        error: 'Competition has no on_chain_id — run create_competition on Soroban first and save the id',
      });
      return;
    }

    await pool.query("UPDATE competitions SET status = 'ended' WHERE id = $1", [req.params.id]);
    res.json({
      finalized: true,
      competitionId: req.params.id,
      onChainId: Number(comp.on_chain_id),
      payouts: parsed.data.payouts,
    });
  }),
);

function mapSubmissionFromDb(row: SubmissionRow, competitionTitle: string) {
  return {
    id: row.id,
    competitionId: row.competition_id,
    competitionTitle,
    participantName: row.participant_name ?? row.participant_wallet,
    participantWallet: row.participant_wallet,
    submittedAt:
      row.submitted_at instanceof Date
        ? row.submitted_at.toISOString().replace('T', ' ').slice(0, 16)
        : String(row.submitted_at),
    summary: row.summary,
    claimedMetric: row.claimed_metric,
    evidence: row.evidence,
    evidenceUrl: row.evidence_url ?? undefined,
    status: row.status,
    pointsAwarded: row.points_awarded ?? undefined,
    founderNote: row.founder_note ?? undefined,
  };
}

export { router as competitionsRouter };
