import type { Competition, ReviewTab, Submission, SubmissionStatus } from '../api/types';

export function submissionStatusStyle(status: SubmissionStatus): {
  bg: string;
  color: string;
  label: string;
} {
  switch (status) {
    case 'approved':
      return { bg: 'rgba(16,185,129,0.15)', color: 'var(--pg-green)', label: 'Approved' };
    case 'rejected':
      return { bg: 'rgba(239,68,68,0.12)', color: 'var(--pg-red)', label: 'Rejected' };
    case 'revision_requested':
      return { bg: 'rgba(245,158,11,0.12)', color: 'var(--pg-amber)', label: 'Needs revision' };
    default:
      return { bg: 'rgba(37,99,235,0.12)', color: 'var(--pg-accent-bright)', label: 'Pending review' };
  }
}

export function filterFounderSubmissions(
  submissions: Submission[],
  opts: { competitionId?: string | null; tab?: ReviewTab },
): Submission[] {
  let list = submissions;
  if (opts.competitionId) {
    list = list.filter((s) => s.competitionId === opts.competitionId);
  }
  if (opts.tab === 'pending') {
    list = list.filter((s) => s.status === 'pending' || s.status === 'revision_requested');
  } else if (opts.tab === 'approved') {
    list = list.filter((s) => s.status === 'approved' || s.status === 'rejected');
  }
  return list;
}

export function countSubmissionsByStatus(
  submissions: Submission[],
  competitionId?: string | null,
): { pending: number; approved: number; rejected: number; total: number } {
  const list = competitionId
    ? submissions.filter((s) => s.competitionId === competitionId)
    : submissions;
  return {
    pending: list.filter((s) => s.status === 'pending' || s.status === 'revision_requested').length,
    approved: list.filter((s) => s.status === 'approved').length,
    rejected: list.filter((s) => s.status === 'rejected').length,
    total: list.length,
  };
}

export function isFounderOfCompetition(comp: Competition, wallet: string | null): boolean {
  return Boolean(wallet && comp.founderWallet === wallet);
}
