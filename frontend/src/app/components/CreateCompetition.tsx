import { useState } from 'react';

interface CreateCompetitionProps {
  onNavigate: (page: string, id?: string) => void;
}

const defaultRules = [
  { event: 'signup', points: 1 },
  { event: 'onboarding_completed', points: 5 },
  { event: 'core_action_completed', points: 10 },
  { event: 'returned_after_24h', points: 20 },
  { event: 'paid_conversion', points: 50 },
];

export function CreateCompetition({ onNavigate }: CreateCompetitionProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'SaaS',
    prizePool: '',
    startDate: '',
    endDate: '',
    winners: '3',
  });
  const [rules, setRules] = useState(defaultRules);
  const [newRule, setNewRule] = useState({ event: '', points: '' });
  const [submitted, setSubmitted] = useState(false);

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const addRule = () => {
    if (!newRule.event || !newRule.points) return;
    setRules(r => [...r, { event: newRule.event, points: parseInt(newRule.points) }]);
    setNewRule({ event: '', points: '' });
  };

  const removeRule = (i: number) => setRules(r => r.filter((_, idx) => idx !== i));

  if (submitted) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '120px 2rem 60px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid var(--pg-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 2rem' }}>✓</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Competition Created!</h2>
        <p style={{ color: 'var(--pg-text-sec)', lineHeight: 1.7, marginBottom: '2rem' }}>
          Your competition <strong style={{ color: 'var(--pg-text)' }}>{form.title || 'Untitled'}</strong> has been deployed to Soroban and is now live. Prize pool of <strong style={{ color: 'var(--pg-accent-bright)' }}>{form.prizePool || '0'} USDC</strong> is in escrow.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="pg-btn-primary" style={{ padding: '12px 24px', fontSize: 14 }} onClick={() => onNavigate('browse')}>
            View Competitions
          </button>
          <button className="pg-btn-secondary" style={{ padding: '12px 24px', fontSize: 14 }} onClick={() => { setSubmitted(false); setStep(1); setForm({ title: '', description: '', category: 'SaaS', prizePool: '', startDate: '', endDate: '', winners: '3' }); setRules(defaultRules); }}>
            Create Another
          </button>
        </div>
      </div>
    );
  }

  const steps = ['Competition Info', 'Scoring Rules', 'Prize & Deploy'];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '100px 2rem 60px' }}>
      <button onClick={() => onNavigate('browse')} style={{ background: 'none', border: 'none', color: 'var(--pg-text-sec)', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Back
      </button>

      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-accent-bright)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '1rem' }}>
        // CREATE COMPETITION
      </span>
      <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '2rem' }}>Launch a Growth Competition</h1>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '3rem' }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
                background: step > i + 1 ? 'var(--pg-green)' : step === i + 1 ? 'var(--pg-accent)' : 'var(--pg-surface)',
                color: step >= i + 1 ? 'white' : 'var(--pg-text-dim)',
                border: step === i + 1 ? '2px solid var(--pg-accent-bright)' : '2px solid transparent',
                transition: 'all 0.3s',
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, background: step > i + 1 ? 'var(--pg-green)' : 'var(--pg-border-dim)', transition: 'background 0.3s', margin: '0 4px' }} />
              )}
            </div>
            <span style={{ fontSize: 12, color: step === i + 1 ? 'var(--pg-text)' : 'var(--pg-text-dim)', fontWeight: step === i + 1 ? 600 : 400 }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Info */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--pg-text-sec)', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 400 }}>Competition Title *</label>
            <input className="pg-input" placeholder="e.g. Acquire 20 Active Users for SaaS Tool" value={form.title} onChange={e => update('title', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--pg-text-sec)', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 400 }}>Description *</label>
            <textarea className="pg-textarea" placeholder="Describe what participants need to do and what success looks like..." value={form.description} onChange={e => update('description', e.target.value)} style={{ minHeight: 100 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--pg-text-sec)', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 400 }}>Category</label>
              <select className="pg-select" value={form.category} onChange={e => update('category', e.target.value)}>
                {['SaaS', 'Fintech', 'B2B', 'Mobile', 'E-commerce', 'Web3', 'Consumer', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--pg-text-sec)', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 400 }}>Number of Winners</label>
              <select className="pg-select" value={form.winners} onChange={e => update('winners', e.target.value)}>
                {['1', '2', '3', '5', '10'].map(n => <option key={n} value={n}>Top {n}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--pg-text-sec)', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 400 }}>Start Date</label>
              <input className="pg-input" type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--pg-text-sec)', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 400 }}>End Date</label>
              <input className="pg-input" type="date" value={form.endDate} onChange={e => update('endDate', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="pg-btn-primary" style={{ padding: '12px 28px', fontSize: 14 }} onClick={() => setStep(2)}>
              Next: Scoring Rules →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Scoring */}
      {step === 2 && (
        <div>
          <p style={{ fontSize: 14, color: 'var(--pg-text-sec)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Define what user actions count and how many points they're worth. Only verified events will contribute to scores.
          </p>

          <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>SCORING RULES</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-text-dim)' }}>{rules.length} events defined</span>
            </div>
            {rules.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--pg-border-dim)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pg-accent-bright)' }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--pg-text-sec)' }}>{r.event}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: 'var(--pg-accent-bright)' }}>+{r.points} pts</span>
                  <button onClick={() => removeRule(i)} style={{ background: 'none', border: 'none', color: 'var(--pg-text-dim)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
                </div>
              </div>
            ))}
            <div style={{ padding: '12px 20px', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input className="pg-input" style={{ flex: 2 }} placeholder="event_name (e.g. feature_used)" value={newRule.event} onChange={e => setNewRule(r => ({ ...r, event: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addRule()} />
              <input className="pg-input" style={{ flex: 1 }} placeholder="Points" type="number" min="1" value={newRule.points} onChange={e => setNewRule(r => ({ ...r, points: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addRule()} />
              <button className="pg-btn-secondary" style={{ padding: '10px 16px', fontSize: 13, whiteSpace: 'nowrap' }} onClick={addRule}>+ Add Rule</button>
            </div>
          </div>

          <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid var(--pg-border)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ color: 'var(--pg-accent-bright)', marginTop: 2 }}>ℹ</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>How scoring works</div>
                <p style={{ fontSize: 12, color: 'var(--pg-text-sec)', lineHeight: 1.6 }}>
                  Events are emitted by your app via the ProofGrowth SDK. Each verified event adds points to the participant who referred that user. The verification engine deduplicates and validates events before scoring.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button className="pg-btn-secondary" style={{ padding: '12px 28px', fontSize: 14 }} onClick={() => setStep(1)}>← Back</button>
            <button className="pg-btn-primary" style={{ padding: '12px 28px', fontSize: 14 }} onClick={() => setStep(3)}>Next: Prize & Deploy →</button>
          </div>
        </div>
      )}

      {/* Step 3: Prize & Deploy */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--pg-text-sec)', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 400 }}>Prize Pool (USDC) *</label>
            <input className="pg-input" type="number" min="1" placeholder="e.g. 500" value={form.prizePool} onChange={e => update('prizePool', e.target.value)} />
            <p style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginTop: 6 }}>Funds will be locked in a Soroban escrow contract until the competition ends</p>
          </div>

          {/* Summary */}
          <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--pg-border-dim)', background: 'var(--pg-surface)' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>COMPETITION SUMMARY</span>
            </div>
            <div style={{ padding: '1.25rem' }}>
              {[
                { label: 'Title', value: form.title || '—' },
                { label: 'Category', value: form.category },
                { label: 'Prize Pool', value: form.prizePool ? `${form.prizePool} USDC` : '—' },
                { label: 'Duration', value: form.startDate && form.endDate ? `${form.startDate} → ${form.endDate}` : '—' },
                { label: 'Winners', value: `Top ${form.winners}` },
                { label: 'Scoring Events', value: `${rules.length} rules defined` },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--pg-border-dim)' : 'none' }}>
                  <span style={{ fontSize: 13, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: 'var(--pg-text)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blockchain info */}
          <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, padding: '1.25rem' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '0.75rem' }}>Deployment Details</div>
            {[
              { label: 'Network', value: 'Stellar Mainnet' },
              { label: 'Contract', value: 'Soroban Escrow' },
              { label: 'Token', value: 'USDC (Centre Consortium)' },
              { label: 'Oracle', value: 'ProofGrowth Verification Oracle' },
            ].map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 3 ? '1px solid var(--pg-border-dim)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>{d.label}</span>
                <span style={{ fontSize: 12, color: 'var(--pg-accent-bright)', fontFamily: "'JetBrains Mono', monospace" }}>{d.value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button className="pg-btn-secondary" style={{ padding: '12px 28px', fontSize: 14 }} onClick={() => setStep(2)}>← Back</button>
            <button className="pg-btn-primary" style={{ padding: '14px 36px', fontSize: 15, fontWeight: 700 }} onClick={() => setSubmitted(true)}>
              Deploy to Soroban & Fund Escrow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
