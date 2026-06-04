import { Networks } from '@stellar/stellar-sdk';

/** Deployed ZaoTrak escrow on Stellar testnet (2026-06). */
export const DEFAULT_ESCROW_CONTRACT_ID =
  'CC44LWA7OK6BIOHWZPZ2ES22UT4POT6KHDYU22FCVY3IXGGTGBXFBFP5';

/** Native XLM Stellar Asset Contract on testnet (7 decimals, stroops). */
export const DEFAULT_NATIVE_XLM_CONTRACT_ID =
  'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

export const PRIZE_ASSET = 'XLM' as const;

export const STELLAR_RPC_URL =
  import.meta.env.VITE_STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org';

export const ESCROW_CONTRACT_ID =
  import.meta.env.VITE_ESCROW_CONTRACT_ID ?? DEFAULT_ESCROW_CONTRACT_ID;

/** SEP-41 contract for native XLM (default prize token). */
export const NATIVE_XLM_TOKEN_CONTRACT =
  import.meta.env.VITE_PRIZE_TOKEN_CONTRACT ??
  import.meta.env.VITE_USDC_TOKEN_CONTRACT ??
  DEFAULT_NATIVE_XLM_CONTRACT_ID;

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const NETWORK_PASSPHRASE = Networks.TESTNET;

/** Native XLM uses 7 decimal places (stroops), same as classic XLM. */
export const NATIVE_DECIMALS = 7;

export function toStroops(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** NATIVE_DECIMALS));
}

export function explorerContractUrl(contractId: string): string {
  return `https://stellar.expert/explorer/testnet/contract/${contractId}`;
}

export function explorerTxUrl(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}
