import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { KitEventType } from '@creit.tech/stellar-wallets-kit';
import { StellarWalletsKit, initWalletKit, STELLAR_NETWORK } from './walletKit';

interface WalletContextValue {
  /** The connected Stellar public key (G...), or null when disconnected. */
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  network: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** Opens the profile modal (copy address, disconnect) for the active wallet. */
  openProfile: () => Promise<void>;
  /** Signs a transaction XDR with the connected wallet. */
  signTransaction: (
    xdr: string,
  ) => Promise<{ signedTxXdr: string; signerAddress?: string }>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    initWalletKit();

    // The kit fires STATE_UPDATED on launch and whenever the active wallet,
    // account or network changes, so this keeps React in sync with the wallet.
    const unsubscribe = StellarWalletsKit.on(
      KitEventType.STATE_UPDATED,
      (event) => {
        setAddress(event.payload.address ?? null);
      },
    );

    return () => unsubscribe?.();
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { address: connected } = await StellarWalletsKit.authModal();
      setAddress(connected);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await StellarWalletsKit.disconnect();
    setAddress(null);
  }, []);

  const openProfile = useCallback(async () => {
    await StellarWalletsKit.profileModal();
  }, []);

  const signTransaction = useCallback(
    async (xdr: string) =>
      StellarWalletsKit.signTransaction(xdr, {
        address: address ?? undefined,
        networkPassphrase: STELLAR_NETWORK,
      }),
    [address],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      isConnected: Boolean(address),
      isConnecting,
      network: STELLAR_NETWORK,
      connect,
      disconnect,
      openProfile,
      signTransaction,
    }),
    [address, isConnecting, connect, disconnect, openProfile, signTransaction],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a <WalletProvider>');
  }
  return ctx;
}

/** Shortens a Stellar address: GABC...WXYZ */
export function truncateAddress(address: string, visible = 4): string {
  if (address.length <= visible * 2 + 3) return address;
  return `${address.slice(0, visible)}...${address.slice(-visible)}`;
}
