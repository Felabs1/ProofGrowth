export type SubmissionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revision_requested';

export type ReviewTab = 'pending' | 'approved' | 'all';

export interface Submission {
  id: string;
  competitionId: string;
  competitionTitle: string;
  participantName: string;
  participantWallet: string;
  submittedAt: string;
  summary: string;
  claimedMetric: string;
  evidence: string;
  evidenceUrl?: string;
  status: SubmissionStatus;
  pointsAwarded?: number;
  founderNote?: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  pts: number;
  approvedSubmissions: number;
  wallet: string;
}

export interface Competition {
  id: string;
  onChainId?: number | null;
  title: string;
  description: string;
  category: string;
  prizePool: number;
  startDate: string;
  endDate: string;
  daysLeft: number;
  participants: number;
  submissionsTotal: number;
  pendingReview: number;
  status: 'active' | 'ended' | 'upcoming';
  winners: number;
  goalType: 'users' | 'volume' | 'leads';
  instructions: string;
  proofRequirements: string[];
  scoringRules: { label: string; points: number }[];
  leaderboard: LeaderboardEntry[];
  progress: number;
  founderWallet: string;
  winnerSplit?: { top?: number } | { split?: number[] };
}

export interface GlobalLeaderboardEntry {
  rank: number;
  name: string;
  wallet: string;
  pts: number;
  approvedSubmissions: number;
  competitions: number;
}
