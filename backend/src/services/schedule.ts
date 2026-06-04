import type { CompetitionStatus } from '../types.js';

export type SchedulePhase = 'before_start' | 'open' | 'after_end';

function dateOnly(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function schedulePhase(startAt: string | Date, endAt: string | Date): SchedulePhase {
  const today = todayUtc();
  const start = dateOnly(startAt);
  const end = dateOnly(endAt);
  if (today < start) return 'before_start';
  if (today > end) return 'after_end';
  return 'open';
}

export function submissionOpen(opts: {
  status: CompetitionStatus;
  startAt: string | Date;
  endAt: string | Date;
}): boolean {
  if (opts.status !== 'active') return false;
  return schedulePhase(opts.startAt, opts.endAt) === 'open';
}

export function participationOpen(opts: {
  status: CompetitionStatus;
  startAt: string | Date;
  endAt: string | Date;
}): boolean {
  if (opts.status === 'ended' || opts.status === 'cancelled') return false;
  return schedulePhase(opts.startAt, opts.endAt) !== 'after_end';
}
