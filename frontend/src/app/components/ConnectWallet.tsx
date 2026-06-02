import { useState } from 'react';
import { useWallet, truncateAddress } from '../wallet/WalletContext';

export function ConnectWallet() {
  const { address, isConnected, isConnecting, connect, disconnect } =
    useWallet();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    try {
      await connect();
    } catch (e) {
      // User closing the picker rejects the promise; ignore that case.
      const message = e instanceof Error ? e.message : String(e);
      if (!/closed|cancel|reject/i.test(message)) {
        setError('Could not connect wallet');
      }
    }
  };

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (isConnected && address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="pg-btn-secondary"
          onClick={handleCopy}
          title="Click to copy address"
          style={{
            padding: '8px 14px',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 8px #10B981',
            }}
          />
          <span className="pg-mono">
            {copied ? 'Copied!' : truncateAddress(address)}
          </span>
        </button>
        <button
          className="pg-nav-link"
          onClick={() => disconnect()}
          title="Disconnect wallet"
          style={{ fontSize: 13 }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      className="pg-btn-primary"
      style={{
        padding: '8px 20px',
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        opacity: isConnecting ? 0.7 : 1,
      }}
      onClick={handleConnect}
      disabled={isConnecting}
      title={error ?? 'Connect a Stellar wallet'}
    >
      <WalletIcon />
      {isConnecting ? 'Connecting...' : error ?? 'Connect Wallet'}
    </button>
  );
}

function WalletIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}
