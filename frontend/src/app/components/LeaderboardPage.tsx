import { useEffect, useState } from 'react';
import { globalLeaderboard, competitions } from '../data/mockData';

interface LeaderboardPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export function LeaderboardPage({ onNavigate }: LeaderboardPageProps) {
  const [lb, setLb] = useState(globalLeaderboard);
  const [selectedComp, setSelectedComp] = useState<string>('global');

  useEffect(() => {
    const t = setInterval(() => {
      setLb(prev => prev.map(p => ({
        ...p,
        pts: p.pts + (Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0),
        delta: Math.random() > 0.5 ? Math.floor(Math.random() * 30) : -Math.floor(Math.random() * 15),
      })).sort((a, b) => b.pts - a.pts).map((p, i) => ({ ...p, rank: i + 1 })));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const activeComps = competitions.filter(c => c.status === 'active');
  const selectedCompData = selectedComp !== 'global' ? activeComps.find(c => c.id === selectedComp) : null;
  const displayLb = selectedCompData ? selectedCompData.leaderboard : lb;

  const rankColors: Record<number, { bg: string; color: string }> = {
    1: { bg: 'rgba(250,204,21,0.15)', color: '#FBBF24' },
    2: { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8' },
    3: { bg: 'rgba(180,120,83,0.12)', color: '#CD7F32' },
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 2rem 60px' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-accent-bright)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '1rem' }}>
        // GLOBAL RANKINGS
      </span>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>Leaderboard</h1>
          <p style={{ fontSize: '1rem', color: 'var(--pg-text-sec)' }}>Rankings update in real time based on verified outcomes</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-green)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pg-green)' }} className="pg-pulse-dot" />
          LIVE UPDATES
        </div>
      </div>

      {/* Podium - top 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
        {/* 2nd */}
        <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, padding: '1.5rem', textAlign: 'center', paddingBottom: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(148,163,184,0.15)', border: '2px solid #94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: '#94A3B8', margin: '0 auto 0.75rem' }}>
            {lb[1]?.name.split(' ').map(n => n[0]).join('') ?? 'BM'}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: '#94A3B8', marginBottom: 4 }}>🥈</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{lb[1]?.name}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: '#94A3B8' }}>{lb[1]?.pts.toLocaleString()} pts</div>
          <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginTop: 4 }}>{lb[1]?.wins} wins · ${lb[1]?.earned.toLocaleString()}</div>
        </div>

        {/* 1st */}
        <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))', border: '1px solid rgba(37,99,235,0.4)', borderRadius: 14, padding: '2rem', textAlign: 'center', boxShadow: '0 0 40px rgba(37,99,235,0.1)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(250,204,21,0.15)', border: '2px solid #FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: '#FBBF24', margin: '0 auto 0.75rem' }}>
            {lb[0]?.name.split(' ').map(n => n[0]).join('') ?? 'AK'}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, color: '#FBBF24', marginBottom: 4 }}>🥇</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{lb[0]?.name}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: '#FBBF24' }}>{lb[0]?.pts.toLocaleString()} pts</div>
          <div style={{ fontSize: 12, color: 'var(--pg-text-sec)', marginTop: 4 }}>{lb[0]?.wins} wins · ${lb[0]?.earned.toLocaleString()}</div>
        </div>

        {/* 3rd */}
        <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, padding: '1.5rem', textAlign: 'center', paddingBottom: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(180,120,83,0.12)', border: '2px solid #CD7F32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: '#CD7F32', margin: '0 auto 0.75rem' }}>
            {lb[2]?.name.split(' ').map(n => n[0]).join('') ?? 'FO'}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: '#CD7F32', marginBottom: 4 }}>🥉</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{lb[2]?.name}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: '#CD7F32' }}>{lb[2]?.pts.toLocaleString()} pts</div>
          <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginTop: 4 }}>{lb[2]?.wins} wins · ${lb[2]?.earned.toLocaleString()}</div>
        </div>
      </div>

      {/* Competition filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setSelectedComp('global')} style={{
          padding: '8px 16px', fontSize: 13, borderRadius: 6, cursor: 'pointer', border: 'none',
          background: selectedComp === 'global' ? 'var(--pg-accent)' : 'var(--pg-surface)',
          color: selectedComp === 'global' ? 'white' : 'var(--pg-text-sec)',
          fontFamily: "'Inter', sans-serif", fontWeight: 500, transition: 'all 0.2s',
        }}>Global</button>
        {activeComps.map(c => (
          <button key={c.id} onClick={() => setSelectedComp(c.id)} style={{
            padding: '8px 16px', fontSize: 13, borderRadius: 6, cursor: 'pointer', border: 'none',
            background: selectedComp === c.id ? 'var(--pg-accent)' : 'var(--pg-surface)',
            color: selectedComp === c.id ? 'white' : 'var(--pg-text-sec)',
            fontFamily: "'Inter', sans-serif", fontWeight: 500, transition: 'all 0.2s',
          }}>{c.title.slice(0, 25)}…</button>
        ))}
      </div>

      {/* Full table */}
      <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>
            {selectedComp === 'global' ? 'GLOBAL LEADERBOARD' : selectedCompData?.title.toUpperCase().slice(0, 40) + '…'}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--pg-green)' }}>● LIVE UPDATE</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 120px 80px 80px 100px', padding: '10px 20px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)' }}>
          <span>RNK</span>
          <span>PARTICIPANT</span>
          <span style={{ textAlign: 'right' }}>POINTS</span>
          <span style={{ textAlign: 'right' }}>WINS</span>
          <span style={{ textAlign: 'right' }}>COMPS</span>
          <span style={{ textAlign: 'right' }}>ΔPTS</span>
        </div>
        {displayLb.map((p, i) => {
          const rank = p.rank ?? i + 1;
          const rc = rankColors[rank] ?? { bg: 'transparent', color: 'var(--pg-text-dim)' };
          const isGlobal = 'wins' in p;
          return (
            <div key={rank} className="pg-lb-row" style={{
              display: 'grid', gridTemplateColumns: '48px 1fr 120px 80px 80px 100px',
              padding: '14px 20px', fontSize: 13, alignItems: 'center',
              borderBottom: '1px solid var(--pg-border-dim)',
              background: rank === 1 ? 'rgba(37,99,235,0.06)' : 'transparent',
              transition: 'background 0.2s',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, background: rc.bg, color: rc.color }}>
                {rank}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--pg-accent-dim)', border: '1px solid var(--pg-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: 'var(--pg-accent-bright)', flexShrink: 0 }}>
                  {p.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  {'wallet' in p && <div style={{ fontSize: 11, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>{(p as { wallet: string }).wallet}</div>}
                </div>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, textAlign: 'right' }}>{p.pts.toLocaleString()}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)', textAlign: 'right' }}>
                {isGlobal ? (p as { wins: number }).wins : '—'}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)', textAlign: 'right' }}>
                {isGlobal && 'competitions' in p ? (p as { competitions: number }).competitions : '—'}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, textAlign: 'right', color: p.delta >= 0 ? 'var(--pg-green)' : 'var(--pg-red)' }}>
                {p.delta >= 0 ? '+' : ''}{p.delta}
              </span>
            </div>
          );
        })}
      </div>

      {/* Historical */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Recent Competition Winners</h2>
        <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden' }}>
          {competitions.filter(c => c.status === 'ended').map((c, i, arr) => (
            <div key={c.id} style={{ padding: '16px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--pg-border-dim)' : 'none', display: 'flex', alignItems: 'center', gap: '1.5rem', cursor: 'pointer' }} onClick={() => onNavigate('detail', c.id)}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', marginBottom: 4 }}>{c.category} · {c.endDate}</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{c.title}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {c.leaderboard.slice(0, 3).map((p, pi) => (
                  <div key={pi} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, marginBottom: 2 }}>{pi === 0 ? '🥇' : pi === 1 ? '🥈' : '🥉'}</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>DISTRIBUTED</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: 'var(--pg-accent-bright)' }}>{c.prizePool.toLocaleString()} USDC</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
