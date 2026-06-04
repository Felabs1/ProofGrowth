export type SubmissionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revision_requested';

export type CompetitionStatus = 'upcoming' | 'active' | 'ended' | 'cancelled';

export type GoalType = 'users' | 'volume' | 'leads';

export type ReviewTab = 'pending' | 'approved' | 'all';

export interface ScoringRule {
  label: string;
  points: number;
}

export interface WinnerSplit {
  top?: number;
  split?: number[];
}

export interface CompetitionRow {
  id: string;
  on_chain_id: number | null;
  founder_wallet: string;
  title: string;
  description: string;
  category: string | null;
  goal_type: GoalType;
  instructions: string;
  proof_requirements: unknown;
  scoring_rules: unknown;
  prize_pool: number | string;
  prize_asset: string;
  token_contract: string | null;
  winners_count: number;
  winner_split: unknown;
  start_at: string | Date;
  end_at: string | Date;
  status: CompetitionStatus;
  progress: number;
  created_at: string;
}

export interface SubmissionRow {
  id: string;
  competition_id: string;
  participant_wallet: string;
  participant_name: string | null;
  summary: string;
  claimed_metric: string;
  evidence: string;
  evidence_url: string | null;
  status: SubmissionStatus;
  points_awarded: number | null;
  founder_note: string | null;
  submitted_at: string | Date;
  reviewed_at: string | Date | null;
}

export interface ParticipationRow {
  competition_id: string;
  participant_wallet: string;
  participant_name: string | null;
  joined_at: string;
}

export interface PayoutInput {
  wallet: string;
  amount_xlm: number;
}
