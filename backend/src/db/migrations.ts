/** Idempotent column additions for existing databases. */
export const MIGRATION_SQL = `
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS create_tx_hash TEXT;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS finalize_tx_hash TEXT;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS cancel_tx_hash TEXT;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS finalized_payouts JSONB;
`;
