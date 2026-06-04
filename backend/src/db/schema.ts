/** PostgreSQL DDL — run via migrate() on startup. */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS competitions (
  id TEXT PRIMARY KEY,
  on_chain_id BIGINT,
  founder_wallet TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('users', 'volume', 'leads')),
  instructions TEXT NOT NULL DEFAULT '',
  proof_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  scoring_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  prize_pool NUMERIC(18, 7) NOT NULL,
  prize_asset TEXT NOT NULL DEFAULT 'XLM',
  token_contract TEXT,
  winners_count INTEGER NOT NULL DEFAULT 3,
  winner_split JSONB,
  start_at DATE NOT NULL,
  end_at DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'active', 'ended', 'cancelled')),
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  competition_id TEXT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  participant_wallet TEXT NOT NULL,
  participant_name TEXT,
  summary TEXT NOT NULL,
  claimed_metric TEXT NOT NULL,
  evidence TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  points_awarded INTEGER,
  founder_note TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS participations (
  competition_id TEXT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  participant_wallet TEXT NOT NULL,
  participant_name TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (competition_id, participant_wallet)
);

CREATE INDEX IF NOT EXISTS idx_submissions_competition ON submissions(competition_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_founder ON competitions(founder_wallet);
`;
