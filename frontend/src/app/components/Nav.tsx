import { useCallback, useEffect, useState } from 'react';
import { ConnectWallet } from './ConnectWallet';
import { listFounderSubmissions } from '../api/client';
import { countSubmissionsByStatus } from '../data/helpers';
import { useWallet } from '../wallet/WalletContext';

interface NavProps {
  currentPage: string;
  onNavigate: (page: string, id?: string, options?: { tab?: string }) => void;
}

export function Nav({ currentPage, onNavigate }: NavProps) {
  const { address } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingReview, setPendingReview] = useState(0);

  const loadPending = useCallback(async () => {
    if (!address) {
      setPendingReview(0);
      return;
    }
    try {
      const subs = await listFounderSubmissions({ founderWallet: address, tab: 'pending' });
      setPendingReview(countSubmissionsByStatus(subs).pending);
    } catch {
      setPendingReview(0);
    }
  }, [address]);

  useEffect(() => {
    void loadPending();
  }, [loadPending, currentPage]);

  const go = (page: string) => {
    setMenuOpen(false);
    onNavigate(page);
  };

  return (
    <nav
      className="pg-nav"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '0 2rem',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(5,8,22,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <button
        onClick={() => go('landing')}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: '#F0F4FF',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#3B82F6',
            boxShadow: '0 0 8px #3B82F6',
          }}
          className="pg-pulse-dot"
        />
        ZaoTrak
      </button>

      <div className={`pg-nav-center ${menuOpen ? 'open' : ''}`}>
        <button
          className={`pg-nav-link ${currentPage === 'browse' ? 'active' : ''}`}
          onClick={() => go('browse')}
        >
          Competitions
        </button>
        <button
          className={`pg-nav-link ${currentPage === 'leaderboard' ? 'active' : ''}`}
          onClick={() => go('leaderboard')}
        >
          Leaderboard
        </button>
        <button
          className={`pg-nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => go('dashboard')}
        >
          My competitions
        </button>
        <button
          className={`pg-nav-link ${currentPage === 'founder' ? 'active' : ''}`}
          onClick={() => go('founder')}
        >
          Founder
        </button>
        <button
          className={`pg-nav-link ${currentPage === 'review' ? 'active' : ''}`}
          onClick={() => go('review')}
          style={{ position: 'relative' }}
        >
          Review
          {pendingReview > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: -4,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: 'var(--pg-red)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}
            >
              {pendingReview}
            </span>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ConnectWallet />
        <button
          className="pg-btn-primary pg-nav-cta"
          style={{ padding: '8px 16px', fontSize: 13 }}
          onClick={() => go('create')}
        >
          Launch
        </button>
        <button
          type="button"
          className="pg-nav-toggle"
          aria-label="Menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          ☰
        </button>
      </div>
    </nav>
  );
}
