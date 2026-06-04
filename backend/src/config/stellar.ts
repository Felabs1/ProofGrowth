/** Deployed ZaoTrak escrow on Stellar testnet. */
export const ESCROW_CONTRACT_ID =
  process.env.ESCROW_CONTRACT_ID ??
  'CC44LWA7OK6BIOHWZPZ2ES22UT4POT6KHDYU22FCVY3IXGGTGBXFBFP5';

/** Native XLM Stellar Asset Contract on testnet (7 decimals). */
export const NATIVE_XLM_TOKEN_CONTRACT =
  process.env.PRIZE_TOKEN_CONTRACT ??
  process.env.USDC_TOKEN_CONTRACT ??
  'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

export const PRIZE_ASSET = 'XLM';

export const SOROBAN_RPC_URL =
  process.env.SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
