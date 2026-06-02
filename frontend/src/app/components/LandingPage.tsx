import { useEffect, useRef, useState } from 'react';
import { competitions, globalLeaderboard } from '../data/mockData';

interface LandingPageProps {
  onNavigate: (page: string, id?: string) => void;
}

function HeroDashboard() {
  const [prizeVal, setPrizeVal] = useState('$84K');
  const [partCount, setPartCount] = useState(2841);
  const [deltas, setDeltas] = useState(['+18', '−4', '+32']);
  const prizes = ['$84K', '$84.2K', '$83.8K', '$84.4K', '$84.1K'];
  const prizeIdx = useRef(0);

  useEffect(() => {
    const pi = setInterval(() => {
      prizeIdx.current = (prizeIdx.current + 1) % prizes.length;
      setPrizeVal(prizes[prizeIdx.current]);
    }, 4000);
    const parti = setInterval(() => {
      setPartCount(p => p + Math.floor(Math.random() * 3));
    }, 6000);
    const di = setInterval(() => {
      setDeltas(prev => prev.map(d => {
        if (Math.random() > 0.6) {
          return Math.random() > 0.5 ? `+${Math.floor(Math.random() * 40 + 1)}` : `−${Math.floor(Math.random() * 15 + 1)}`;
        }
        return d;
      }));
    }, 3200);
    return () => { clearInterval(pi); clearInterval(parti); clearInterval(di); };
  }, []);

  const [now, setNow] = useState(new Date().toTimeString().slice(0, 8));
  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toTimeString().slice(0, 8)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: 'var(--pg-mid)', border: '1px solid var(--pg-border)',
      borderRadius: 16, overflow: 'hidden', position: 'relative',
    }}>
      <div className="pg-scan" style={{
        position: 'absolute', left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent)',
      }} />

      {/* Header */}
      <div style={{
        padding: '14px 18px', background: 'var(--pg-surface)',
        borderBottom: '1px solid var(--pg-border-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>
          PROOFGROWTH / LIVE SYSTEM
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-green)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pg-green)' }} className="pg-pulse-dot" />
          LIVE
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid var(--pg-border-dim)' }}>
        {[
          { label: 'Prize Pools', value: prizeVal, change: '↑ +$2.4K' },
          { label: 'Competitions', value: '47', change: '↑ +3 today' },
          { label: 'Participants', value: partCount.toLocaleString(), change: '↑ +124' },
        ].map((m, i) => (
          <div key={i} style={{ padding: 16, borderRight: i < 2 ? '1px solid var(--pg-border-dim)' : 'none' }}>
            <div style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text)' }}>{m.value}</div>
            <div style={{ fontSize: 10, marginTop: 2, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-green)' }}>{m.change}</div>
          </div>
        ))}
      </div>

      {/* Competitions */}
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {competitions.slice(0, 3).map(c => (
          <div key={c.id} style={{
            background: 'var(--pg-card)', border: '1px solid var(--pg-border-dim)',
            borderRadius: 8, padding: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pg-text)', marginBottom: 2 }}>{c.title.slice(0, 30)}…</div>
              <div style={{ fontSize: 11, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>
                {c.participants} participants · {c.daysLeft}d left
              </div>
              <div style={{ height: 3, background: 'rgba(37,99,235,0.2)', borderRadius: 2, marginTop: 8 }}>
                <div style={{ height: '100%', background: 'var(--pg-accent)', borderRadius: 2, width: `${c.progress}%`, transition: 'width 1s ease' }} />
              </div>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--pg-accent-bright)', fontWeight: 600, marginLeft: 16 }}>
              {c.prizePool.toLocaleString()} USDC
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div style={{ borderTop: '1px solid var(--pg-border-dim)', padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live Rankings</span>
          <span style={{ fontSize: 10, color: 'var(--pg-accent-bright)', fontFamily: "'JetBrains Mono', monospace" }}>UPDATING</span>
        </div>
        {globalLeaderboard.slice(0, 3).map((p, i) => (
          <div key={p.rank} className="pg-lb-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: i < 2 ? 'var(--pg-accent-bright)' : 'var(--pg-text-dim)', width: 20 }}>
              0{p.rank}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{p.name}</span>
            <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-sec)' }}>{p.pts.toLocaleString()} pts</span>
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: deltas[i]?.startsWith('+') ? 'var(--pg-green)' : 'var(--pg-red)' }}>
              {deltas[i]}
            </span>
          </div>
        ))}
      </div>

      {/* Feed */}
      <div style={{ borderTop: '1px solid var(--pg-border-dim)', padding: '10px 12px' }}>
        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', padding: '2px 0' }}>
          <span style={{ color: 'var(--pg-green)' }}>[VERIFIED]</span> onboarding_complete · alice@— · +5pts
        </div>
        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', padding: '2px 0' }}>
          <span style={{ color: 'var(--pg-accent-bright)' }}>[UPDATED]</span> leaderboard_position_changed · #3→#2
        </div>
        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-sec)', padding: '2px 0' }}>
          <span style={{ color: 'var(--pg-text-dim)' }}>{now}</span>
          {' '}$ monitoring active
          <span className="pg-blink" style={{ display: 'inline-block', width: 7, height: 12, background: 'var(--pg-green)', marginLeft: 4, verticalAlign: 'middle' }} />
        </div>
      </div>
    </div>
  );
}

function VerificationTerminal() {
  const [logs, setLogs] = useState([
    { time: '09:41:02', tag: 'VERIFIED', color: 'var(--pg-green)', bg: 'rgba(16,185,129,0.12)', msg: 'onboarding_completed · user_2841' },
    { time: '09:41:04', tag: 'VERIFIED', color: 'var(--pg-green)', bg: 'rgba(16,185,129,0.12)', msg: 'feature_usage_detected · user_2840' },
    { time: '09:41:07', tag: 'UPDATED', color: 'var(--pg-accent-bright)', bg: 'rgba(37,99,235,0.12)', msg: 'leaderboard_position #3→#2 · felix_o' },
    { time: '09:41:09', tag: 'PROCESS', color: 'var(--pg-amber)', bg: 'rgba(245,158,11,0.12)', msg: 'activation_score computed · +24pts' },
    { time: '09:41:12', tag: 'VERIFIED', color: 'var(--pg-green)', bg: 'rgba(16,185,129,0.12)', msg: 'day7_retention confirmed · user_2839' },
    { time: '09:41:15', tag: 'UPDATED', color: 'var(--pg-accent-bright)', bg: 'rgba(37,99,235,0.12)', msg: 'escrow_balance checked · 500 USDC' },
    { time: '09:41:18', tag: 'VERIFIED', color: 'var(--pg-green)', bg: 'rgba(16,185,129,0.12)', msg: 'payment_method_added · user_2838' },
    { time: '09:41:21', tag: 'UPDATED', color: 'var(--pg-accent-bright)', bg: 'rgba(37,99,235,0.12)', msg: 'ranking_recalculated · 78 participants' },
  ]);

  const [now, setNow] = useState(new Date().toTimeString().slice(0, 8));
  const events = [
    { tag: 'VERIFIED', color: 'var(--pg-green)', bg: 'rgba(16,185,129,0.12)', msgs: ['signup_completed · user_', 'onboarding_step · user_', 'feature_used · user_', 'day7_return · user_'] },
    { tag: 'UPDATED', color: 'var(--pg-accent-bright)', bg: 'rgba(37,99,235,0.12)', msgs: ['score_recalculated', 'rank_updated', 'leaderboard_refreshed', 'escrow_checked'] },
    { tag: 'PROCESS', color: 'var(--pg-amber)', bg: 'rgba(245,158,11,0.12)', msgs: ['computing_score', 'validating_event', 'oracle_request'] },
  ];

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toTimeString().slice(0, 8)), 1000);
    const l = setInterval(() => {
      const ev = events[Math.floor(Math.random() * events.length)];
      const msg = ev.msgs[Math.floor(Math.random() * ev.msgs.length)];
      const fullMsg = ev.tag === 'VERIFIED' ? msg + (2800 + Math.floor(Math.random() * 100)) : msg;
      setLogs(prev => [...prev.slice(-7), {
        time: new Date().toTimeString().slice(0, 8),
        tag: ev.tag, color: ev.color, bg: ev.bg, msg: fullMsg
      }]);
    }, 2500);
    return () => { clearInterval(t); clearInterval(l); };
  }, []);

  return (
    <div style={{
      background: '#020408', border: '1px solid rgba(16,185,129,0.2)',
      borderRadius: 12, padding: '1.25rem', overflow: 'hidden',
      fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {['#FF5F56','#FFBD2E','#27C93F'].map((c, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
        ))}
        <span style={{ fontSize: 11, color: 'var(--pg-text-dim)', marginLeft: 8 }}>proof-verify · stdout</span>
      </div>
      {logs.map((l, i) => (
        <div key={i} style={{ padding: '3px 0', display: 'flex', gap: 10 }}>
          <span style={{ color: 'var(--pg-text-dim)', minWidth: 60, fontSize: 11 }}>{l.time}</span>
          <span style={{ fontWeight: 600, fontSize: 11, padding: '1px 5px', borderRadius: 3, color: l.color, background: l.bg }}>[{l.tag}]</span>
          <span style={{ color: 'var(--pg-text-sec)', fontSize: 11 }}>{l.msg}</span>
        </div>
      ))}
      <div style={{ padding: '6px 0 0', display: 'flex', gap: 10 }}>
        <span style={{ color: 'var(--pg-text-dim)', minWidth: 60, fontSize: 11 }}>{now}</span>
        <span style={{ color: 'var(--pg-green)', fontSize: 11 }}>$ monitoring active</span>
        <span className="pg-blink" style={{ display: 'inline-block', width: 7, height: 12, background: 'var(--pg-green)', verticalAlign: 'middle' }} />
      </div>
    </div>
  );
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const maxW = { maxWidth: 1200, margin: '0 auto', padding: '100px 2rem' };
  const activeComps = competitions.filter(c => c.status === 'active');

  return (
    <div>
      {/* Hero */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '160px 2rem 80px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center',
        minHeight: '100vh',
      }}>
        <div>
          <div className="pg-animate" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px',
            background: 'var(--pg-accent-dim)', border: '1px solid var(--pg-border)',
            borderRadius: 100, fontSize: 12, fontWeight: 500,
            color: 'var(--pg-accent-bright)', marginBottom: '1.5rem',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pg-green)' }} className="pg-pulse-dot" />
            SYSTEM OPERATIONAL · 47 ACTIVE COMPETITIONS
          </div>

          <h1 className="pg-animate pg-delay-1" style={{
            fontSize: 'clamp(2.8rem, 5vw, 4.2rem)',
            fontWeight: 700, lineHeight: 1.08,
            letterSpacing: '-0.03em', marginBottom: '1.5rem',
          }}>
            Turn Startup Growth<br />Into <span style={{ color: 'var(--pg-accent-bright)' }}>Competition</span>
          </h1>

          <p className="pg-animate pg-delay-2" style={{
            fontSize: '1.05rem', color: 'var(--pg-text-sec)',
            lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 480,
          }}>
            ProofGrowth lets startups launch escrow-backed competitions where participants compete to acquire and activate real users. Rewards distributed based on verified outcomes.
          </p>

          <div className="pg-animate pg-delay-3" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="pg-btn-primary" style={{ padding: '14px 28px', fontSize: 15 }} onClick={() => onNavigate('create')}>
              Create Competition
            </button>
            <button className="pg-btn-secondary" style={{ padding: '14px 28px', fontSize: 15 }} onClick={() => onNavigate('leaderboard')}>
              View Live Leaderboard →
            </button>
          </div>
        </div>

        <div className="pg-animate pg-delay-2">
          <HeroDashboard />
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--pg-border-dim)', maxWidth: 1200, margin: '0 auto' }} />

      {/* Problem */}
      <div style={maxW}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-accent-bright)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem', display: 'block' }}>
          // DIAGNOSTIC
        </span>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
          Growth Is Currently<br />Unreliable
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--pg-text-sec)', maxWidth: 520, lineHeight: 1.7 }}>
          Traditional growth methods produce noise, not signal. The metrics look good. The users don't stick.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem', marginTop: '3rem' }}>
          {[
            { icon: '⊘', title: 'Paid Ads Generate Low-Quality Users', desc: 'Click-through rates optimize for traffic, not activation. Acquisition cost rises. Retention stays flat.' },
            { icon: '◈', title: 'Incentives Attract Fake Engagement', desc: 'Referral schemes and bonuses surface bots and churners. Verified intent is impossible to measure.' },
            { icon: '◇', title: 'Growth Hacks Lack Measurable Retention', desc: 'Viral loops and growth hacks produce spikes. No mechanism enforces outcome quality or user durability.' },
          ].map((p, i) => (
            <div key={i} style={{
              background: 'var(--pg-mid)', border: '1px solid var(--pg-border-dim)',
              borderRadius: 12, padding: '1.75rem', transition: 'border-color 0.3s',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '1rem', opacity: 0.7 }}>{p.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: '0.5rem' }}>{p.title}</div>
              <p style={{ fontSize: 13, color: 'var(--pg-text-sec)', lineHeight: 1.6 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--pg-border-dim)', maxWidth: 1200, margin: '0 auto' }} />

      {/* Solution */}
      <div style={maxW}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-accent-bright)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem', display: 'block' }}>
          // PROTOCOL
        </span>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '3rem' }}>
          A Competitive Model<br />for Growth
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { num: '01', title: 'Define Rules & Fund Escrow', desc: 'Founders set competition parameters — acquisition targets, activation criteria, scoring rules — and deposit the prize pool into a secured escrow contract.' },
              { num: '02', title: 'Participants Compete', desc: 'Growth operators, marketers, and agencies join competitions and execute acquisition strategies. Every action is tracked against defined scoring metrics.' },
              { num: '03', title: 'Verification & Automated Payout', desc: 'The verification engine validates user actions via oracle layer. Smart contracts rank participants and distribute rewards to winners — no manual settlement.' },
            ].map((s, i) => (
              <div key={i} className="pg-step" style={{
                display: 'flex', gap: '1.25rem', padding: '1.5rem',
                borderLeft: '1px solid var(--pg-border-dim)', transition: 'background 0.2s',
              }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-accent-bright)', fontWeight: 700, minWidth: 28, paddingTop: 2 }}>{s.num}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: '0.4rem' }}>{s.title}</div>
                  <p style={{ fontSize: 13, color: 'var(--pg-text-sec)', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 12, padding: '1.5rem' }}>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>EXECUTION PIPELINE</div>
            {[
              { label: 'Competition Created', status: 'LIVE', active: true },
              { label: 'User Action Captured', status: 'STREAMING', active: true },
              { label: 'Verification Engine', status: 'PROCESSING', active: true },
              { label: 'Oracle Confirmation', status: 'CONFIRMED', active: true },
              { label: 'Score Updated', status: 'RANKED', active: false },
              { label: 'Smart Contract Payout', status: 'AUTO', active: true },
            ].map((n, i) => (
              <div key={i}>
                <div style={{
                  background: 'var(--pg-surface)', border: '1px solid var(--pg-border)',
                  borderRadius: 8, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                }}>
                  <span style={{ color: 'var(--pg-text-sec)' }}>{n.label}</span>
                  <span style={{
                    fontSize: 10, padding: '3px 8px', borderRadius: 4, fontWeight: 600,
                    background: n.active ? 'rgba(16,185,129,0.15)' : 'rgba(37,99,235,0.15)',
                    color: n.active ? 'var(--pg-green)' : 'var(--pg-accent-bright)',
                  }}>{n.status}</span>
                </div>
                {i < 5 && <div style={{ textAlign: 'center', color: 'var(--pg-accent)', fontSize: 12, padding: '4px 0' }}>↓</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--pg-border-dim)', maxWidth: 1200, margin: '0 auto' }} />

      {/* Live Competitions */}
      <div style={maxW}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-accent-bright)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem', display: 'block' }}>
          // LIVE COMPETITIONS
        </span>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1rem' }}>Active Right Now</h2>
            <p style={{ fontSize: '1rem', color: 'var(--pg-text-sec)', maxWidth: 520, lineHeight: 1.7 }}>Verified competitions with escrowed prize pools. Join and compete.</p>
          </div>
          <button className="pg-btn-secondary" style={{ height: 44, padding: '0 20px', fontSize: 14 }} onClick={() => onNavigate('browse')}>
            View All {activeComps.length} →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1.5rem', marginTop: '3rem' }}>
          {activeComps.slice(0, 2).map(c => (
            <div key={c.id} className="pg-comp-card" style={{
              background: 'var(--pg-mid)', border: '1px solid var(--pg-border)',
              borderRadius: 14, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }} onClick={() => onNavigate('detail', c.id)}>
              <div style={{ padding: 20, borderBottom: '1px solid var(--pg-border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.category}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, margin: '6px 0', maxWidth: 240, lineHeight: 1.4 }}>{c.title}</div>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", background: 'rgba(37,99,235,0.12)', color: 'var(--pg-accent-bright)', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--pg-border)' }}>
                    ⏱ {c.daysLeft} days remaining
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>PRIZE POOL</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-accent-bright)' }}>{c.prizePool.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--pg-text-dim)' }}>USDC · Escrowed</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', padding: 16, gap: 1 }}>
                {[
                  { label: 'Participants', value: c.participants, color: 'var(--pg-text)' },
                  { label: 'Users Verified', value: c.usersVerified.toLocaleString(), color: 'var(--pg-green)' },
                  { label: 'Verify Rate', value: `${c.verifyRate}%`, color: 'var(--pg-accent-bright)' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '0 12px', paddingLeft: i === 0 ? 0 : undefined, borderRight: i < 2 ? '1px solid var(--pg-border-dim)' : 'none' }}>
                    <div style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 16, borderTop: '1px solid var(--pg-border-dim)' }}>
                <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Live Leaderboard</div>
                {c.leaderboard.slice(0, 3).map(p => (
                  <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--pg-border-dim)' }}>
                    <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: p.rank === 1 ? '#FBBF24' : p.rank === 2 ? '#94A3B8' : 'var(--pg-text-dim)', width: 16 }}>{p.rank}</span>
                    <span style={{ fontSize: 12, flex: 1 }}>{p.name}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 2, background: 'rgba(37,99,235,0.15)', borderRadius: 1 }}>
                        <div style={{ height: '100%', background: 'var(--pg-accent-bright)', borderRadius: 1, width: `${(p.pts / c.leaderboard[0].pts) * 100}%` }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-sec)' }}>{p.pts} pts</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--pg-border-dim)', maxWidth: 1200, margin: '0 auto' }} />

      {/* Verification */}
      <div style={maxW}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-accent-bright)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem', display: 'block' }}>
          // VERIFICATION ENGINE
        </span>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
          Every Action Verified,<br />Every Reward Earned
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--pg-text-sec)', maxWidth: 520, lineHeight: 1.7 }}>
          A multi-layer verification pipeline ensures only genuine user actions contribute to scores. No manual review. No dispute resolution.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '3rem', alignItems: 'start' }}>
          <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 12, overflow: 'hidden' }}>
            {[
              { icon: '#94A3B8', label: '01 · User Action Triggered' },
              { icon: 'var(--pg-accent-bright)', label: '02 · Event Capture Layer' },
              { icon: 'var(--pg-amber)', label: '03 · Verification Engine' },
              { icon: '#A78BFA', label: '04 · Oracle Confirmation' },
              { icon: 'var(--pg-green)', label: '05 · Smart Contract Update' },
              { icon: 'var(--pg-accent-bright)', label: '06 · Leaderboard Reflects' },
            ].map((n, i, arr) => (
              <div key={i} className="pg-pipeline-node" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--pg-border-dim)' : 'none',
                fontFamily: "'JetBrains Mono', monospace", transition: 'background 0.2s',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.icon }} />
                <div style={{ flex: 1, color: 'var(--pg-text-sec)', fontSize: 12 }}>{n.label}</div>
                <div style={{ color: 'var(--pg-accent)', fontSize: 11 }}>{i === arr.length - 1 ? '✓' : '→'}</div>
              </div>
            ))}
          </div>
          <VerificationTerminal />
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--pg-border-dim)', maxWidth: 1200, margin: '0 auto' }} />

      {/* Leaderboard preview */}
      <div style={maxW}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-accent-bright)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem', display: 'block' }}>
          // GLOBAL RANKINGS
        </span>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1rem' }}>Competitive Intelligence</h2>
        <p style={{ fontSize: '1rem', color: 'var(--pg-text-sec)', maxWidth: 520, lineHeight: 1.7 }}>Rankings update in real time based on verified outcomes across all active competitions.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '2.5rem', marginTop: '3rem', alignItems: 'start' }}>
          <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>GLOBAL LEADERBOARD</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--pg-green)' }}>● LIVE UPDATE</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 80px', padding: '10px 16px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)' }}>
              <span>RNK</span><span>PARTICIPANT</span><span style={{ textAlign: 'right' }}>POINTS</span><span style={{ textAlign: 'right' }}>WINS</span><span style={{ textAlign: 'right' }}>ΔPTS</span>
            </div>
            {globalLeaderboard.slice(0, 7).map(p => {
              const rankColors: Record<number, { bg: string; color: string }> = {
                1: { bg: 'rgba(250,204,21,0.15)', color: '#FBBF24' },
                2: { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8' },
                3: { bg: 'rgba(180,120,83,0.12)', color: '#CD7F32' },
              };
              const rc = rankColors[p.rank] ?? { bg: 'var(--pg-surface)', color: 'var(--pg-text-dim)' };
              return (
                <div key={p.rank} className="pg-lb-row" style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 80px',
                  padding: '13px 16px', fontSize: 13, alignItems: 'center',
                  borderBottom: '1px solid var(--pg-border-dim)',
                  background: p.rank === 1 ? 'rgba(37,99,235,0.06)' : 'transparent',
                  transition: 'background 0.2s', cursor: 'default',
                }}>
                  <span style={{ width: 24, height: 24, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, background: rc.bg, color: rc.color }}>{p.rank}</span>
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, textAlign: 'right' }}>{p.pts.toLocaleString()}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)', textAlign: 'right' }}>{p.wins}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, textAlign: 'right', color: p.delta >= 0 ? 'var(--pg-green)' : 'var(--pg-red)' }}>{p.delta >= 0 ? '+' : ''}{p.delta}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Your Current Rank', value: '#—', color: 'var(--pg-accent-bright)', sub: 'Connect wallet to track rank' },
              { label: 'Competitions Joined', value: '0', color: 'var(--pg-text)', sub: 'Join a competition to start earning' },
              { label: 'Points This Week', value: '+0', color: 'var(--pg-green)', sub: 'System tracking when active' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border-dim)', borderRadius: 10, padding: '1.25rem', transition: 'border-color 0.2s' }}>
                <div style={{ fontSize: 11, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
            <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 10, padding: '1.25rem' }}>
              <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>TOP EARNER THIS WEEK</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--pg-accent-dim)', border: '1px solid var(--pg-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-accent-bright)' }}>AK</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Alice K.</div>
                  <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>+218 pts · $420 earned</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 700, color: '#FBBF24' }}>🥇</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--pg-border-dim)', maxWidth: 1200, margin: '0 auto' }} />

      {/* Metrics */}
      <div style={maxW}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-accent-bright)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem', display: 'block', textAlign: 'center' }}>
          // SYSTEM METRICS
        </span>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1rem' }}>Infrastructure Built<br />for Verified Growth</h2>
          <p style={{ fontSize: '1rem', color: 'var(--pg-text-sec)', lineHeight: 1.7 }}>Every number verified on-chain. Every payout automatic. Every competition outcome provable.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.5rem', marginTop: '4rem' }}>
          {[
            { num: '$2.4M', label: 'Total Prize Pools\nDistributed' },
            { num: '94,200', label: 'Verified Users\nAcquired' },
            { num: '47', label: 'Active Competitions\nRight Now' },
            { num: '98.4%', label: 'Verification\nSuccess Rate' },
          ].map((m, i) => (
            <div key={i} className="pg-trust-card" style={{
              background: 'var(--pg-mid)', border: '1px solid var(--pg-border-dim)',
              borderRadius: 14, padding: '2rem 1.5rem',
              textAlign: 'center', transition: 'border-color 0.3s, transform 0.2s',
            }}>
              <div style={{ fontSize: '2.8rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-accent-bright)', lineHeight: 1, marginBottom: '0.5rem' }}>{m.num}</div>
              <div style={{ fontSize: 13, color: 'var(--pg-text-sec)', fontWeight: 500, lineHeight: 1.4, whiteSpace: 'pre-line' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--pg-mid)', borderTop: '1px solid var(--pg-border-dim)' }}>
        <div className="pg-grid-bg" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)', zIndex: 1 }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 2rem', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-accent-bright)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '1.5rem' }}>// LAUNCH</span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 700, letterSpacing: '-0.02em', maxWidth: 640, margin: '0 auto 1.5rem', lineHeight: 1.15 }}>
            Stop Buying Traffic.<br />Start Competing for Real Growth.
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--pg-text-sec)', maxWidth: 480, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Fund a prize pool, define your metrics, and let the best growth operators compete to deliver verified users for your product.
          </p>
          <button className="pg-btn-primary" style={{ padding: '16px 36px', fontSize: 16, fontWeight: 700, borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 10 }} onClick={() => onNavigate('create')}>
            Launch Your First Competition
            <span style={{ fontSize: 18 }}>→</span>
          </button>
          <div style={{ marginTop: '2rem', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-dim)', display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span>✓ Escrow-secured prizes</span>
            <span>✓ Automated verification</span>
            <span>✓ Smart contract payouts</span>
          </div>
        </div>
      </div>

      <footer style={{ background: 'var(--pg-deep)', borderTop: '1px solid var(--pg-border-dim)', padding: '2rem', textAlign: 'center', fontSize: 13, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>
        ProofGrowth — Competitive Growth Infrastructure · All competitions escrow-secured · Powered by verified outcomes
      </footer>
    </div>
  );
}
