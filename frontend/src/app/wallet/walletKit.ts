import {
  StellarWalletsKit,
  Networks,
  type SwkAppTheme,
} from '@creit.tech/stellar-wallets-kit';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';

// Switch to Networks.PUBLIC when going to mainnet.
export const STELLAR_NETWORK = Networks.TESTNET;

// Matches the ProofGrowth dark theme (see styles/proofgrowth.css :root).
const PG_MODAL_THEME: SwkAppTheme = {
  background: '#0d1b2e',
  'background-secondary': '#111827',
  'foreground-strong': '#F0F4FF',
  foreground: '#F0F4FF',
  'foreground-secondary': '#94A3B8',
  primary: '#2563EB',
  'primary-foreground': '#FFFFFF',
  transparent: 'rgba(0, 0, 0, 0)',
  lighter: '#1a2942',
  light: '#152133',
  'light-gray': '#94A3B8',
  gray: '#4B5563',
  danger: '#EF4444',
  border: 'rgba(37,99,235,0.18)',
  shadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
  'border-radius': '12px',
  'font-family': "'Inter', sans-serif",
};

let initialized = false;

/**
 * Initializes the Stellar Wallets Kit singleton exactly once. The kit is a
 * static singleton in v2.x, so calling init again would re-register modules.
 */
export function initWalletKit(): void {
  if (initialized) return;
  initialized = true;

  StellarWalletsKit.init({
    network: STELLAR_NETWORK,
    // defaultModules() returns every wallet that needs no extra config
    // (Freighter, Albedo, xBull, Rabet, Lobstr, Hana, ...).
    modules: defaultModules(),
    theme: PG_MODAL_THEME,
  });
}

export { StellarWalletsKit };
