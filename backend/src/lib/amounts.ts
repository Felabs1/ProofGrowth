/** Native XLM (and most Stellar assets) use 7 decimal places (stroops). */
export const NATIVE_DECIMALS = 7;

export function toStroops(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** NATIVE_DECIMALS));
}

export function stroopsToAmount(stroops: bigint): number {
  return Number(stroops) / 10 ** NATIVE_DECIMALS;
}
