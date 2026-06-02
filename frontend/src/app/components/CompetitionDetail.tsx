import { useState } from 'react';
import { competitions } from '../data/mockData';

interface CompetitionDetailProps {
  competitionId: string;
  onNavigate: (page: string, id?: string) => void;
}

export function CompetitionDetail({ competitionId, onNavigate }: CompetitionDetailProps) {
  const comp = competitions.find(c => c.id === competitionId) ?? competitions[0];
  const [joined, setJoined] = useState(false);
  const [tab, setTab] = useState<'overview' | 'leaderboard' | 'rules'>('overview');

  const statusColors: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(16,185,129,0.15)', color: 'var(--pg-green)' },
    upcoming: { bg: 'rgba(37,99,235,0.15)', color: 'var(--pg-accent-bright)' },
    ended: { bg: 'rgba(75,85,99,0.3)', color: 'var(--pg-text-dim)' },
  };
  const sc = statusColors[comp.status];

  const rankColors: Record<number, { bg: string; color: string }> = {
    1: { bg: 'rgba(250,204,21,0.15)', color: '#FBBF24' },
    2: { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8' },
    3: { bg: 'rgba(180,120,83,0.12)', color: '#CD7F32' },
  };

  const prizeDistribution = [50, 30, 20];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 2rem 60px' }}>
      {/* Back */}
      <button onClick={() => onNavigate('browse')} style={{ background: 'none', border: 'none', color: 'var(--pg-text-sec)', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Back to Competitions
      </button>

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{comp.category}</span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600, background: sc.bg, color: sc.color }}>{comp.status.toUpperCase()}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1rem', lineHeight: 1.2 }}>{comp.title}</h1>
          <p style={{ fontSize: '1rem', color: 'var(--pg-text-sec)', lineHeight: 1.7, maxWidth: 700 }}>{comp.description}</p>
        </div>
        <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, padding: '1.5rem', textAlign: 'center', minWidth: 200 }}>
          <div style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>PRIZE POOL</div>
          <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-accent-bright)' }}>{comp.prizePool.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginBottom: '1rem' }}>USDC · Escrowed</div>
          {comp.status === 'active' && !joined && (
            <button className="pg-btn-primary" style={{ width: '100%', padding: '12px', fontSize: 14 }} onClick={() => setJoined(true)}>
              Join Competition
            </button>
          )}
          {joined && (
            <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px', fontSize: 13, color: 'var(--pg-green)', fontWeight: 600 }}>
              ✓ You're participating
            </div>
          )}
          {comp.status === 'upcoming' && (
            <div style={{ fontSize: 13, color: 'var(--pg-accent-bright)', fontFamily: "'JetBrains Mono', monospace" }}>Starts in {comp.daysLeft}d</div>
          )}
          {comp.status === 'ended' && (
            <div style={{ fontSize: 13, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>Competition Ended</div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Participants', value: comp.participants, color: 'var(--pg-text)' },
          { label: 'Users Verified', value: comp.usersVerified.toLocaleString(), color: 'var(--pg-green)' },
          { label: 'Verify Rate', value: comp.verifyRate > 0 ? `${comp.verifyRate}%` : '—', color: 'var(--pg-accent-bright)' },
          { label: 'Days Left', value: comp.status === 'active' ? comp.daysLeft : comp.status === 'ended' ? 'Ended' : `${comp.daysLeft}d`, color: 'var(--pg-amber)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border-dim)', borderRadius: 12, padding: '1.25rem' }}>
            <div style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: '2rem', background: 'var(--pg-surface)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {(['overview', 'leaderboard', 'rules'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', fontSize: 13, fontWeight: 500, borderRadius: 7, cursor: 'pointer', border: 'none',
            background: tab === t ? 'var(--pg-accent)' : 'transparent',
            color: tab === t ? 'white' : 'var(--pg-text-sec)',
            fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Scoring Rules */}
          <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>SCORING RULES</span>
            </div>
            <div style={{ padding: '1rem' }}>
              {comp.scoringRules.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 8px', borderBottom: i < comp.scoringRules.length - 1 ? '1px solid var(--pg-border-dim)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pg-accent-bright)' }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--pg-text-sec)' }}>{r.event}</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: 'var(--pg-accent-bright)' }}>+{r.points} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prize Distribution */}
          <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>PRIZE DISTRIBUTION</span>
            </div>
            <div style={{ padding: '1rem' }}>
              {prizeDistribution.slice(0, comp.winners).map((pct, i) => {
                const rc = rankColors[i + 1] ?? { bg: 'var(--pg-surface)', color: 'var(--pg-text-dim)' };
                const amount = Math.round((comp.prizePool * pct) / 100);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px', borderBottom: i < comp.winners - 1 ? '1px solid var(--pg-border-dim)' : 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, background: rc.bg, color: rc.color }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'var(--pg-text-sec)', marginBottom: 4 }}>{pct}% of pool</div>
                      <div style={{ height: 4, background: 'rgba(37,99,235,0.15)', borderRadius: 2 }}>
                        <div style={{ height: '100%', background: i === 0 ? '#FBBF24' : i === 1 ? '#94A3B8' : '#CD7F32', borderRadius: 2, width: `${pct}%` }} />
                      </div>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: 'var(--pg-text)' }}>{amount} USDC</div>
                  </div>
                );
              })}
              {comp.winners > 3 && (
                <div style={{ padding: '10px 8px', fontSize: 12, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>
                  + {comp.winners - 3} more winners split remaining pool
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden', gridColumn: '1 / -1' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>COMPETITION TIMELINE</span>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
              {[
                { label: 'Start Date', value: comp.startDate, icon: '◎' },
                { label: 'End Date', value: comp.endDate, icon: '◉' },
                { label: 'Payout', value: 'Automatic on end', icon: '✦' },
              ].map((t, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '1rem', background: 'var(--pg-surface)', borderRadius: 10 }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{t.icon}</div>
                  <div style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: 'var(--pg-text)' }}>{t.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'leaderboard' && (
        <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>LIVE LEADERBOARD</span>
            {comp.status === 'active' && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--pg-green)' }}>● LIVE UPDATE</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 100px', padding: '10px 20px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)' }}>
            <span>RNK</span><span>PARTICIPANT</span><span style={{ textAlign: 'right' }}>POINTS</span><span style={{ textAlign: 'right' }}>ΔPTS</span><span style={{ textAlign: 'right' }}>WALLET</span>
          </div>
          {comp.leaderboard.length > 0 ? comp.leaderboard.map(p => {
            const rc = rankColors[p.rank] ?? { bg: 'var(--pg-surface)', color: 'var(--pg-text-dim)' };
            return (
              <div key={p.rank} className="pg-lb-row" style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 100px',
                padding: '14px 20px', fontSize: 13, alignItems: 'center',
                borderBottom: '1px solid var(--pg-border-dim)',
                background: p.rank === 1 ? 'rgba(37,99,235,0.06)' : 'transparent',
                transition: 'background 0.2s',
              }}>
                <div style={{ width: 24, height: 24, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, background: rc.bg, color: rc.color }}>{p.rank}</div>
                <span style={{ fontWeight: 500 }}>{p.name}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, textAlign: 'right' }}>{p.pts.toLocaleString()}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, textAlign: 'right', color: p.delta >= 0 ? 'var(--pg-green)' : 'var(--pg-red)' }}>
                  {p.delta >= 0 ? '+' : ''}{p.delta}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-text-dim)', textAlign: 'right' }}>{p.wallet}</span>
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
              No participants yet. Be the first to join.
            </div>
          )}
        </div>
      )}

      {tab === 'rules' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {[
            { title: 'Eligibility', items: ['Valid Stellar wallet required', 'One wallet per participant', 'No self-referral allowed', 'Must pass KYC verification'] },
            { title: 'Scoring', items: comp.scoringRules.map(r => `${r.event}: +${r.points} pts`) },
            { title: 'Verification', items: ['Events must originate from unique users', 'Duplicate detection via fingerprinting', 'Oracle attests to off-chain events', 'Signed attestation stored on Soroban'] },
            { title: 'Payouts', items: ['Automatic on competition end', 'Smart contract distributes to wallets', 'No manual claim required', 'USDC on Stellar network'] },
          ].map((section, i) => (
            <div key={i} style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>{section.title.toUpperCase()}</span>
              </div>
              <div style={{ padding: '1rem' }}>
                {section.items.map((item, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px', borderBottom: j < section.items.length - 1 ? '1px solid var(--pg-border-dim)' : 'none' }}>
                    <span style={{ color: 'var(--pg-green)', marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 13, color: 'var(--pg-text-sec)', fontFamily: "'JetBrains Mono', monospace" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
