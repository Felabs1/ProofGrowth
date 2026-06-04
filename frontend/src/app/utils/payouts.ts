import type { Competition } from '../api/types';

export interface PayoutLine {
  wallet: string;
  amount_xlm: number;
}

/** Build winner payouts from leaderboard + prize pool (must sum to prizePool). */
export function buildPayoutsFromCompetition(comp: Competition): PayoutLine[] {
  const winners = (comp.leaderboard ?? []).slice(0, comp.winners);
  if (winners.length === 0) {
    throw new Error('Leaderboard has no ranked participants to pay');
  }

  const pool = comp.prizePool;
  const split = comp.winnerSplit;

  let percents: number[];
  if (split && 'split' in split && split.split?.length) {
    percents = split.split.slice(0, winners.length);
    const sum = percents.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 100) > 0.01) {
      throw new Error('Winner split must total 100%');
    }
  } else {
    const n = winners.length;
    const each = Math.floor((100 / n) * 100) / 100;
    percents = Array(n).fill(each);
    percents[0] += 100 - percents.reduce((a, b) => a + b, 0);
  }

  const lines: PayoutLine[] = winners.map((w, i) => ({
    wallet: w.wallet,
    amount_xlm: Math.round(pool * (percents[i] / 100) * 1e7) / 1e7,
  }));

  const total = lines.reduce((s, p) => s + p.amount_xlm, 0);
  const drift = pool - total;
  if (Math.abs(drift) > 0.0000001) {
    lines[0] = { ...lines[0], amount_xlm: lines[0].amount_xlm + drift };
  }

  return lines;
}
