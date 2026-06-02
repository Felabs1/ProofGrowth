import { useEffect, useState } from 'react';
import { competitions, globalLeaderboard } from '../data/mockData';

interface ParticipantDashboardProps {
  onNavigate: (page: string, id?: string) => void;
}

const myCompetitions = [
  { ...competitions[0], myScore: 213, myRank: 2, myDelta: -4 },
  { ...competitions[1], myScore: 198, myRank: 5, myDelta: 5 },
  { ...competitions[3], myScore: 612, myRank: 2, myDelta: 22 },
];

const recentEvents = [
  { time: '09:41:02', event: 'onboarding_completed', user: 'user_2841', pts: 5, comp: 'SaaS Activation Sprint', verified: true },
  { time: '09:38:14', event: 'feature_usage_detected', user: 'user_2839', pts: 10, comp: 'SaaS Activation Sprint', verified: true },
  { time: '09:31:50', event: 'day7_retention', user: 'user_2834', pts: 40, comp: 'Fintech Retention Drive', verified: true },
  { time: '09:22:08', event: 'signup', user: 'user_2830', pts: 1, comp: 'Mobile App Install', verified: true },
  { time: '09:15:33', event: 'core_feature_used', user: 'user_2828', pts: 15, comp: 'Mobile App Install', verified: false },
];

export function ParticipantDashboard({ onNavigate }: ParticipantDashboardProps) {
  const me = globalLeaderboard[1]; // Bob M.
  const [totalPts, setTotalPts] = useState(me.pts);

  useEffect(() => {
    const t = setInterval(() => {
      setTotalPts(p => p + Math.floor(Math.random() * 3));
    }, 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 2rem 60px' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-accent-bright)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '1rem' }}>
        // PARTICIPANT DASHBOARD
      </span>

      {/* Profile header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--pg-accent-dim)', border: '2px solid var(--pg-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: 'var(--pg-accent-bright)' }}>
            BM
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>{me.name}</h1>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-dim)' }}>{me.wallet}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="pg-btn-secondary" style={{ padding: '10px 20px', fontSize: 13 }} onClick={() => onNavigate('browse')}>
            Browse Competitions
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Global Rank', value: `#${me.rank}`, color: 'var(--pg-accent-bright)', sub: '↑ up 0 this week' },
          { label: 'Total Points', value: totalPts.toLocaleString(), color: 'var(--pg-text)', sub: `+${me.delta} today` },
          { label: 'Competitions Won', value: me.wins, color: 'var(--pg-green)', sub: 'All time' },
          { label: 'USDC Earned', value: `$${me.earned.toLocaleString()}`, color: 'var(--pg-amber)', sub: 'Lifetime earnings' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border-dim)', borderRadius: 12, padding: '1.25rem' }}>
            <div style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
        <div>
          {/* Active Competitions */}
          <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>ACTIVE COMPETITIONS</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-text-dim)' }}>{myCompetitions.length} joined</span>
            </div>
            {myCompetitions.map((c, i) => (
              <div key={c.id} style={{ padding: '16px 20px', borderBottom: i < myCompetitions.length - 1 ? '1px solid var(--pg-border-dim)' : 'none', cursor: 'pointer' }} onClick={() => onNavigate('detail', c.id)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{c.category}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{c.title}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>PRIZE</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: 'var(--pg-accent-bright)' }}>{c.prizePool.toLocaleString()} USDC</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', marginBottom: 2 }}>My Rank</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: c.myRank <= 3 ? '#FBBF24' : 'var(--pg-text)' }}>#{c.myRank}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', marginBottom: 2 }}>My Score</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700 }}>{c.myScore.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', marginBottom: 2 }}>Days Left</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: 'var(--pg-amber)' }}>{c.daysLeft}d</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', marginBottom: 4 }}>
                      <span>My score vs leader</span>
                      <span>{Math.round((c.myScore / c.leaderboard[0].pts) * 100)}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(37,99,235,0.15)', borderRadius: 2 }}>
                      <div style={{ height: '100%', background: 'var(--pg-accent)', borderRadius: 2, width: `${(c.myScore / c.leaderboard[0].pts) * 100}%` }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: c.myDelta >= 0 ? 'var(--pg-green)' : 'var(--pg-red)' }}>
                    {c.myDelta >= 0 ? '↑' : '↓'}{Math.abs(c.myDelta)} today
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Event Feed */}
          <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>RECENT EVENTS</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--pg-green)' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--pg-green)' }} className="pg-pulse-dot" />
                LIVE
              </div>
            </div>
            {recentEvents.map((ev, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < recentEvents.length - 1 ? '1px solid var(--pg-border-dim)' : 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: ev.verified ? 'var(--pg-green)' : 'var(--pg-amber)', flexShrink: 0 }} />
                <span style={{ color: 'var(--pg-text-dim)', minWidth: 60 }}>{ev.time}</span>
                <span style={{ color: ev.verified ? 'var(--pg-green)' : 'var(--pg-amber)', fontSize: 10, padding: '1px 5px', background: ev.verified ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', borderRadius: 3, fontWeight: 600 }}>
                  {ev.verified ? '[VERIFIED]' : '[PENDING]'}
                </span>
                <span style={{ color: 'var(--pg-text-sec)', flex: 1 }}>{ev.event} · {ev.user}</span>
                <span style={{ color: 'var(--pg-text-dim)', fontSize: 11 }}>{ev.comp.slice(0, 20)}…</span>
                <span style={{ color: 'var(--pg-accent-bright)', fontWeight: 700 }}>+{ev.pts}pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Rank tracker */}
          <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>GLOBAL RANK TRACKER</span>
            </div>
            <div style={{ padding: '1rem' }}>
              {globalLeaderboard.slice(0, 5).map((p, i) => {
                const isMe = p.name === me.name;
                return (
                  <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 6, background: isMe ? 'rgba(37,99,235,0.1)' : 'transparent', marginBottom: 2, border: isMe ? '1px solid var(--pg-border)' : '1px solid transparent' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: i < 2 ? '#FBBF24' : 'var(--pg-text-dim)', width: 20 }}>#{p.rank}</span>
                    <span style={{ fontSize: 13, flex: 1, fontWeight: isMe ? 700 : 400 }}>{p.name}{isMe && ' (you)'}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>{p.pts.toLocaleString()}</span>
                  </div>
                );
              })}
              <button className="pg-btn-secondary" style={{ width: '100%', padding: '9px', fontSize: 13, marginTop: '0.75rem' }} onClick={() => onNavigate('leaderboard')}>
                View Full Leaderboard →
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, padding: '1.25rem' }}>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>PERFORMANCE THIS WEEK</div>
            {[
              { label: 'Events Generated', value: '47', color: 'var(--pg-text)' },
              { label: 'Users Verified', value: '38', color: 'var(--pg-green)' },
              { label: 'Points Earned', value: '+214', color: 'var(--pg-accent-bright)' },
              { label: 'USDC Potential', value: '~$180', color: 'var(--pg-amber)' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--pg-border-dim)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--pg-text-sec)' }}>{s.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Suggested */}
          <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>SUGGESTED FOR YOU</span>
            </div>
            <div style={{ padding: '0.75rem' }}>
              {competitions.filter(c => c.status === 'active' && !myCompetitions.find(m => m.id === c.id)).slice(0, 2).map(c => (
                <div key={c.id} style={{ padding: '10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4 }} onClick={() => onNavigate('detail', c.id)}>
                  <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', marginBottom: 2 }}>{c.category}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>{c.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-accent-bright)' }}>{c.prizePool.toLocaleString()} USDC</span>
                    <span style={{ fontSize: 11, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>{c.daysLeft}d left</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
