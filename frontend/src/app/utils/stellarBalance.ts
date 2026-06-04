import { NETWORK_PASSPHRASE } from '../config/stellar';

const HORIZON_URL =
  NETWORK_PASSPHRASE.includes('Test')
    ? 'https://horizon-testnet.stellar.org'
    : 'https://horizon.stellar.org';

/** Classic account native XLM balance (same funds used for SAC transfers on testnet). */
export async function fetchAccountXlmBalance(publicKey: string): Promise<number> {
  const res = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
  if (res.status === 404) return 0;
  if (!res.ok) {
    throw new Error('Could not load wallet balance from Horizon');
  }
  const data = (await res.json()) as {
    balances?: { asset_type: string; balance: string }[];
  };
  const native = data.balances?.find((b) => b.asset_type === 'native');
  return native ? Number(native.balance) : 0;
}

/** Minimum XLM to keep for tx fees after locking the prize pool. */
export const FEE_RESERVE_XLM = 1;

export function insufficientBalanceMessage(opts: {
  balanceXlm: number;
  prizePoolXlm: number;
  wallet: string;
}): string {
  const { balanceXlm, prizePoolXlm, wallet } = opts;
  const need = prizePoolXlm + FEE_RESERVE_XLM;
  return (
    `Insufficient XLM in wallet ${wallet.slice(0, 4)}…${wallet.slice(-4)}: ` +
    `balance ~${balanceXlm.toFixed(2)} ${'XLM'}, but this competition locks ${prizePoolXlm} XLM in escrow ` +
    `(plus ~${FEE_RESERVE_XLM} XLM for network fees). ` +
    'Fund the account on testnet (Stellar Laboratory → Friendbot, network: Test) ' +
    `or lower the prize pool. Freighter and Albedo use separate accounts — fund the one you connect with.`
  );
}

export function friendlySorobanError(raw: string): string {
  if (
    raw.includes('resulting balance is not within the allowed range') ||
    (raw.includes('transfer') && raw.includes('Contract, #10'))
  ) {
    const transferMatch = raw.match(/transfer,?\s*\[[^\]]*,\s*[^\]]*,\s*(\d+)\]/);
    const stroops = transferMatch ? BigInt(transferMatch[1]) : null;
    const prize =
      stroops != null ? Number(stroops) / 1e7 : null;
    const base =
      'Insufficient XLM to lock the prize pool in escrow. The connected wallet does not have enough testnet XLM for this deposit';
    if (prize != null && Number.isFinite(prize)) {
      return `${base} (${prize} XLM). Fund this wallet on testnet or use a lower prize pool. Albedo and Freighter often use different addresses.`;
    }
    return `${base}. Fund this wallet on testnet or use a lower prize pool. Albedo and Freighter often use different addresses.`;
  }
  if (raw.includes('HostError') && raw.length > 400) {
    const short = raw.split('Event log')[0]?.trim() ?? raw;
    return short.slice(0, 280) + (short.length > 280 ? '…' : '');
  }
  return raw;
}
