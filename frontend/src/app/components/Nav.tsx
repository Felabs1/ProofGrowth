import { ConnectWallet } from './ConnectWallet';

interface NavProps {
  currentPage: string;
  onNavigate: (page: string, id?: string) => void;
}

export function Nav({ currentPage, onNavigate }: NavProps) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 2rem', height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(5,8,22,0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <button
        onClick={() => onNavigate('landing')}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700, fontSize: 18,
          color: '#F0F4FF', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#3B82F6',
          boxShadow: '0 0 8px #3B82F6',
        }} className="pg-pulse-dot" />
        ProofGrowth
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <button
          className={`pg-nav-link ${currentPage === 'browse' ? 'active' : ''}`}
          onClick={() => onNavigate('browse')}
        >
          Competitions
        </button>
        <button
          className={`pg-nav-link ${currentPage === 'leaderboard' ? 'active' : ''}`}
          onClick={() => onNavigate('leaderboard')}
        >
          Leaderboard
        </button>
        <button
          className={`pg-nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          Dashboard
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="pg-btn-secondary"
          style={{ padding: '8px 20px', fontSize: 14 }}
          onClick={() => onNavigate('create')}
        >
          Create Competition
        </button>
        <ConnectWallet />
      </div>
    </nav>
  );
}
