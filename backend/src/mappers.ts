import type pg from 'pg';
import { parseJsonArray, parseJsonObject, toNumber } from './lib/jsonFields.js';
import { competitionStats, computeLeaderboard, daysLeft } from './services/leaderboard.js';
import { participationOpen, schedulePhase, submissionOpen } from './services/schedule.js';
import type { CompetitionRow, SubmissionRow } from './types.js';

export function mapSubmission(row: SubmissionRow, competitionTitle?: string) {
  return {
    id: row.id,
    competitionId: row.competition_id,
    competitionTitle: competitionTitle ?? '',
    participantName: row.participant_name ?? row.participant_wallet,
    participantWallet: row.participant_wallet,
    submittedAt: formatTimestamp(row.submitted_at),
    summary: row.summary,
    claimedMetric: row.claimed_metric,
    evidence: row.evidence,
    evidenceUrl: row.evidence_url ?? undefined,
    status: row.status,
    pointsAwarded: row.points_awarded ?? undefined,
    founderNote: row.founder_note ?? undefined,
  };
}

export async function mapCompetition(pool: pg.Pool, row: CompetitionRow) {
  const stats = await competitionStats(pool, row.id);
  const proofRequirements = parseJsonArray<string>(row.proof_requirements);
  const scoringRules = parseJsonArray<{ label: string; points: number }>(row.scoring_rules);

  return {
    id: row.id,
    onChainId: row.on_chain_id != null ? Number(row.on_chain_id) : null,
    title: row.title,
    description: row.description,
    category: row.category ?? '',
    prizePool: toNumber(row.prize_pool),
    startDate: formatDate(row.start_at),
    endDate: formatDate(row.end_at),
    daysLeft: daysLeft(row.end_at),
    participants: stats.participants,
    submissionsTotal: stats.submissions_total,
    pendingReview: stats.pending_review,
    status: row.status,
    schedulePhase: schedulePhase(row.start_at, row.end_at),
    submissionOpen: submissionOpen({
      status: row.status,
      startAt: row.start_at,
      endAt: row.end_at,
    }),
    participationOpen: participationOpen({
      status: row.status,
      startAt: row.start_at,
      endAt: row.end_at,
    }),
    winners: row.winners_count,
    goalType: row.goal_type,
    instructions: row.instructions,
    proofRequirements,
    scoringRules,
    leaderboard: await computeLeaderboard(pool, row.id),
    progress: row.progress,
    founderWallet: row.founder_wallet,
    prizeAsset: row.prize_asset,
    tokenContract: row.token_contract,
    winnerSplit: parseJsonObject(row.winner_split, { top: row.winners_count }),
    createTxHash: row.create_tx_hash ?? undefined,
    finalizeTxHash: row.finalize_tx_hash ?? undefined,
    cancelTxHash: row.cancel_tx_hash ?? undefined,
    finalizedPayouts: parseJsonArray<{ wallet: string; amount_xlm: number }>(
      row.finalized_payouts ?? null,
    ),
  };
}

function formatDate(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function formatTimestamp(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().replace('T', ' ').slice(0, 16);
  }
  return String(value);
}
