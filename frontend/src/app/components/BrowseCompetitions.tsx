import { useState } from 'react';
import { competitions } from '../data/mockData';

interface BrowseCompetitionsProps {
  onNavigate: (page: string, id?: string) => void;
}

export function BrowseCompetitions({ onNavigate }: BrowseCompetitionsProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('prize');
  const [search, setSearch] = useState('');

  const filtered = competitions
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'prize') return b.prizePool - a.prizePool;
      if (sortBy === 'participants') return b.participants - a.participants;
      if (sortBy === 'daysLeft') return a.daysLeft - b.daysLeft;
      return 0;
    });

  const statusColors: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(16,185,129,0.15)', color: 'var(--pg-green)' },
    upcoming: { bg: 'rgba(37,99,235,0.15)', color: 'var(--pg-accent-bright)' },
    ended: { bg: 'rgba(75,85,99,0.3)', color: 'var(--pg-text-dim)' },
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 2rem 60px' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-accent-bright)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '1rem' }}>
        // LIVE COMPETITIONS
      </span>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>Browse Competitions</h1>
          <p style={{ fontSize: '1rem', color: 'var(--pg-text-sec)' }}>{competitions.filter(c => c.status === 'active').length} active competitions · {competitions.reduce((s, c) => s + c.prizePool, 0).toLocaleString()} USDC in prizes</p>
        </div>
        <button className="pg-btn-primary" style={{ padding: '12px 24px', fontSize: 14 }} onClick={() => onNavigate('create')}>
          + Create Competition
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="pg-input"
          style={{ maxWidth: 280 }}
          placeholder="Search competitions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'active', 'upcoming', 'ended'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 500, borderRadius: 6, cursor: 'pointer', border: 'none',
              background: statusFilter === s ? 'var(--pg-accent)' : 'var(--pg-surface)',
              color: statusFilter === s ? 'white' : 'var(--pg-text-sec)',
              fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
            }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select
          className="pg-select"
          style={{ maxWidth: 200 }}
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="prize">Sort: Prize Pool</option>
          <option value="participants">Sort: Participants</option>
          <option value="daysLeft">Sort: Ending Soon</option>
        </select>
      </div>

      {/* Competition Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(c => {
          const sc = statusColors[c.status];
          return (
            <div key={c.id} className="pg-comp-card" style={{
              background: 'var(--pg-mid)', border: '1px solid var(--pg-border)',
              borderRadius: 14, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }} onClick={() => onNavigate('detail', c.id)}>
              <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.category}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600, background: sc.bg, color: sc.color }}>
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{c.title}</div>
                    <p style={{ fontSize: 13, color: 'var(--pg-text-sec)', lineHeight: 1.6, maxWidth: 600 }}>{c.description}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem', minWidth: 200 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>PRIZE POOL</div>
                    <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-accent-bright)' }}>{c.prizePool.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--pg-text-dim)' }}>USDC · Escrowed</div>
                  </div>
                  {c.status !== 'ended' && (
                    <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", background: 'rgba(37,99,235,0.12)', color: 'var(--pg-accent-bright)', padding: '4px 10px', borderRadius: 4, border: '1px solid var(--pg-border)' }}>
                      {c.status === 'upcoming' ? `Starts in ${c.daysLeft}d` : `⏱ ${c.daysLeft}d left`}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--pg-border-dim)', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                {[
                  { label: 'Participants', value: c.participants },
                  { label: 'Users Verified', value: c.usersVerified.toLocaleString(), color: 'var(--pg-green)' },
                  { label: 'Verify Rate', value: c.verifyRate > 0 ? `${c.verifyRate}%` : '—', color: 'var(--pg-accent-bright)' },
                  { label: 'Winners', value: `Top ${c.winners}` },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: s.color ?? 'var(--pg-text)' }}>{s.value}</div>
                  </div>
                ))}
                <div style={{ marginLeft: 'auto' }}>
                  <button className="pg-btn-primary" style={{ padding: '8px 20px', fontSize: 13 }} onClick={e => { e.stopPropagation(); onNavigate('detail', c.id); }}>
                    {c.status === 'active' ? 'Join Competition' : c.status === 'upcoming' ? 'View Details' : 'View Results'}
                  </button>
                </div>
              </div>

              {c.status === 'active' && (
                <div style={{ padding: '0 24px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', marginBottom: 6 }}>
                    <span>Competition Progress</span>
                    <span>{c.progress}%</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(37,99,235,0.15)', borderRadius: 2 }}>
                    <div style={{ height: '100%', background: 'var(--pg-accent)', borderRadius: 2, width: `${c.progress}%`, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--pg-text-dim)' }}>
            <div style={{ fontSize: 48, marginBottom: '1rem', opacity: 0.3 }}>⊘</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>No competitions found</div>
          </div>
        )}
      </div>
    </div>
  );
}
