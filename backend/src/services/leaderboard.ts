import type pg from 'pg';
import { toNumber } from '../lib/jsonFields.js';

export interface LeaderboardRow {
  participant_wallet: string;
  participant_name: string | null;
  pts: string | number;
  approved_count: string | number;
}

export async function computeLeaderboard(
  pool: pg.Pool,
  competitionId: string,
): Promise<{ rank: number; name: string; pts: number; approvedSubmissions: number; wallet: string }[]> {
  const { rows } = await pool.query<LeaderboardRow>(
    `
    SELECT
      s.participant_wallet,
      MAX(s.participant_name) AS participant_name,
      COALESCE(SUM(s.points_awarded), 0) AS pts,
      COUNT(*)::int AS approved_count
    FROM submissions s
    WHERE s.competition_id = $1 AND s.status = 'approved'
    GROUP BY s.participant_wallet
    ORDER BY pts DESC, approved_count DESC
  `,
    [competitionId],
  );

  return rows.map((r, i) => ({
    rank: i + 1,
    name: r.participant_name ?? r.participant_wallet.slice(0, 8) + '…',
    pts: toNumber(r.pts),
    approvedSubmissions: Number(r.approved_count),
    wallet: r.participant_wallet,
  }));
}

export async function competitionStats(pool: pg.Pool, competitionId: string) {
  const { rows } = await pool.query<{
    participants: string;
    submissions_total: string;
    pending_review: string;
  }>(
    `
    SELECT
      (SELECT COUNT(*)::int FROM participations WHERE competition_id = $1) AS participants,
      (SELECT COUNT(*)::int FROM submissions WHERE competition_id = $1) AS submissions_total,
      (SELECT COUNT(*)::int FROM submissions WHERE competition_id = $1
        AND status IN ('pending', 'revision_requested')) AS pending_review
  `,
    [competitionId],
  );
  const row = rows[0];
  return {
    participants: Number(row?.participants ?? 0),
    submissions_total: Number(row?.submissions_total ?? 0),
    pending_review: Number(row?.pending_review ?? 0),
  };
}

export function daysLeft(endAt: string | Date): number {
  const end = endAt instanceof Date ? endAt : new Date(endAt);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}
