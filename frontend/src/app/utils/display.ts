export function walletInitials(wallet: string): string {
  if (wallet.length < 2) return '?';
  return wallet.slice(0, 2).toUpperCase();
}

export function displayName(wallet: string, name?: string | null): string {
  if (name && name.trim()) return name;
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
}
