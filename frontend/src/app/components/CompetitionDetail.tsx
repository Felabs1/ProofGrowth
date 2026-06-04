import { useCallback, useEffect, useState } from 'react';
import {
  getCompetition,
  joinCompetition,
  listCompetitionSubmissions,
  listFounderSubmissions,
  listJoinedCompetitionIds,
  submitProof,
} from '../api/client';
import type { Competition, Submission } from '../api/types';
import { ESCROW_CONTRACT_ID, explorerContractUrl, explorerTxUrl, PRIZE_ASSET } from '../config/stellar';
import { fetchOnChainEscrow, type OnChainEscrowView } from '../contracts/escrow';
import {
  countSubmissionsByStatus,
  isFounderOfCompetition,
  submissionStatusStyle,
} from '../data/helpers';
import { displayName } from '../utils/display';
import { useWallet } from '../wallet/WalletContext';
import { StellarWalletsKit } from '../wallet/walletKit';
import { ErrorBlock, LoadingBlock } from './ApiState';

interface CompetitionDetailProps {
  competitionId: string;
  onNavigate: (page: string, id?: string, options?: { tab?: string }) => void;
}

const emptySubmit = { summary: '', claimedMetric: '', evidence: '', evidenceUrl: '' };

export function CompetitionDetail({ competitionId, onNavigate }: CompetitionDetailProps) {
  const { address, connect } = useWallet();
  const [comp, setComp] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [tab, setTab] = useState<'overview' | 'submit' | 'leaderboard' | 'rules'>('overview');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptySubmit);
  const [localSubs, setLocalSubs] = useState<Submission[]>([]);
  const [founderQueue, setFounderQueue] = useState<Submission[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [onChain, setOnChain] = useState<OnChainEscrowView | null>(null);
  const [onChainError, setOnChainError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await getCompetition(competitionId);
      setComp(c);
      if (address) {
        const ids = await listJoinedCompetitionIds(address);
        setJoined(ids.includes(competitionId));
        const subs = await listCompetitionSubmissions(competitionId, { wallet: address });
        setLocalSubs(subs);
        if (c.founderWallet === address) {
          const q = await listFounderSubmissions({ founderWallet: address, competitionId });
          setFounderQueue(q);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load competition');
    } finally {
      setLoading(false);
    }
  }, [competitionId, address]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!comp?.onChainId || !address) {
      setOnChain(null);
      return;
    }
    setOnChainError(null);
    void fetchOnChainEscrow({ onChainId: comp.onChainId, sourcePublicKey: address })
      .then(setOnChain)
      .catch((e) => {
        setOnChain(null);
        setOnChainError(e instanceof Error ? e.message : 'Could not read escrow');
      });
  }, [comp?.onChainId, address]);

  if (loading) {
    return (
      <div className="pg-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 2rem 60px' }}>
        <LoadingBlock />
      </div>
    );
  }
  if (error || !comp) {
    return (
      <div className="pg-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 2rem 60px' }}>
        <ErrorBlock message={error ?? 'Competition not found'} onRetry={load} />
      </div>
    );
  }

  const statusColors: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(16,185,129,0.15)', color: 'var(--pg-green)' },
    upcoming: { bg: 'rgba(37,99,235,0.15)', color: 'var(--pg-accent-bright)' },
    ended: { bg: 'rgba(75,85,99,0.3)', color: 'var(--pg-text-dim)' },
    cancelled: { bg: 'rgba(239,68,68,0.15)', color: 'var(--pg-red)' },
  };
  const sc = statusColors[comp.status] ?? statusColors.ended;

  const rankColors: Record<number, { bg: string; color: string }> = {
    1: { bg: 'rgba(250,204,21,0.15)', color: '#FBBF24' },
    2: { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8' },
    3: { bg: 'rgba(180,120,83,0.12)', color: '#CD7F32' },
  };

  const prizeDistribution = [50, 30, 20];
  const canSubmit = joined && (comp.submissionOpen ?? comp.status === 'active');
  const canJoin = comp.participationOpen ?? (comp.status === 'active' || comp.status === 'upcoming');
  const isHost = isFounderOfCompetition(comp, address);
  const hostCounts = isHost ? countSubmissionsByStatus(founderQueue, comp.id) : null;

  const handleJoin = async () => {
    let wallet = address;
    if (!wallet) {
      await connect();
      wallet = (await StellarWalletsKit.getAddress()).address;
    }
    if (!wallet) return;
    await joinCompetition(comp.id, {
      participant_wallet: wallet,
      participant_name: displayName(wallet),
    });
    setJoined(true);
    await load();
  };

  const handleSubmit = async () => {
    if (!form.summary.trim() || !form.claimedMetric.trim() || !form.evidence.trim()) return;
    let wallet = address;
    if (!wallet) {
      await connect();
      wallet = (await StellarWalletsKit.getAddress()).address;
    }
    if (!wallet) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const sub = await submitProof(comp.id, {
        participant_wallet: wallet,
        participant_name: displayName(wallet),
        summary: form.summary.trim(),
        claimed_metric: form.claimedMetric.trim(),
        evidence: form.evidence.trim(),
        evidence_url: form.evidenceUrl.trim() || undefined,
      });
      setLocalSubs((prev) => [sub, ...prev]);
      setForm(emptySubmit);
      setShowForm(false);
      setTab('submit');
      await load();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pg-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 2rem 60px' }}>
      <button
        onClick={() => onNavigate('browse')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--pg-text-sec)',
          cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        ← Back to Competitions
      </button>

      {isHost && hostCounts && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(37,99,235,0.04))',
            border: '1px solid var(--pg-border)',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--pg-accent-bright)',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              You host this competition
            </div>
            <p style={{ fontSize: 14, color: 'var(--pg-text-sec)', margin: 0, lineHeight: 1.5 }}>
              {hostCounts.pending} submission{hostCounts.pending !== 1 ? 's' : ''} need review · {hostCounts.total} total
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="pg-btn-primary"
              style={{ padding: '10px 18px', fontSize: 13 }}
              onClick={() => onNavigate('review', comp.id, { tab: 'pending' })}
            >
              Review pending ({hostCounts.pending})
            </button>
            <button
              className="pg-btn-secondary"
              style={{ padding: '10px 18px', fontSize: 13 }}
              onClick={() => onNavigate('founder')}
            >
              Founder dashboard
            </button>
          </div>
        </div>
      )}

      <div
        className="pg-stack"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '2rem',
          alignItems: 'flex-start',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--pg-text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {comp.category}
            </span>
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 4,
                fontWeight: 600,
                background: sc.bg,
                color: sc.color,
              }}
            >
              {comp.status.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 4,
                fontWeight: 600,
                background: 'rgba(245,158,11,0.12)',
                color: 'var(--pg-amber)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              FOUNDER-VERIFIED
            </span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: '1rem',
              lineHeight: 1.2,
            }}
          >
            {comp.title}
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--pg-text-sec)', lineHeight: 1.7, maxWidth: 700 }}>
            {comp.description}
          </p>
        </div>
        <div
          style={{
            background: 'var(--pg-mid)',
            border: '1px solid var(--pg-border)',
            borderRadius: 14,
            padding: '1.5rem',
            textAlign: 'center',
            minWidth: 220,
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
            PRIZE POOL
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--pg-accent-bright)',
            }}
          >
            {comp.prizePool.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginBottom: '1rem' }}>{PRIZE_ASSET} · Escrowed</div>
          {comp.status === 'active' && !joined && (
            <button
              className="pg-btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 14 }}
              onClick={() => void handleJoin()}
            >
              Join Competition
            </button>
          )}
          {joined && comp.status === 'active' && (
            <>
              <div
                style={{
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 8,
                  padding: '10px',
                  fontSize: 13,
                  color: 'var(--pg-green)',
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                ✓ You're participating
              </div>
              <button
                className="pg-btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: 14 }}
                onClick={() => {
                  setTab('submit');
                  setShowForm(true);
                }}
              >
                + New submission
              </button>
            </>
          )}
          {joined && comp.status !== 'active' && (
            <div
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 8,
                padding: '10px',
                fontSize: 13,
                color: 'var(--pg-green)',
                fontWeight: 600,
              }}
            >
              ✓ Participated
            </div>
          )}
          {comp.status === 'upcoming' && (
            <div style={{ fontSize: 13, color: 'var(--pg-accent-bright)', fontFamily: "'JetBrains Mono', monospace" }}>
              Starts in {comp.daysLeft}d
            </div>
          )}
          {comp.status === 'ended' && (
            <div style={{ fontSize: 13, color: 'var(--pg-text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>
              Competition ended
            </div>
          )}
        </div>
      </div>

      <div
        className="pg-grid-stats"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}
      >
        {[
          { label: 'Participants', value: comp.participants, color: 'var(--pg-text)' },
          { label: 'Submissions', value: comp.submissionsTotal, color: 'var(--pg-text)' },
          { label: 'Pending review', value: comp.pendingReview, color: 'var(--pg-amber)' },
          {
            label: 'Days left',
            value: comp.status === 'active' ? comp.daysLeft : comp.status === 'ended' ? 'Ended' : `${comp.daysLeft}d`,
            color: 'var(--pg-amber)',
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: 'var(--pg-mid)',
              border: '1px solid var(--pg-border-dim)',
              borderRadius: 12,
              padding: '1.25rem',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: 'var(--pg-text-dim)',
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 6,
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 2,
          marginBottom: '2rem',
          background: 'var(--pg-surface)',
          borderRadius: 10,
          padding: 4,
          width: 'fit-content',
          flexWrap: 'wrap',
        }}
      >
        {(['overview', 'submit', 'leaderboard', 'rules'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 7,
              cursor: 'pointer',
              border: 'none',
              background: tab === t ? 'var(--pg-accent)' : 'transparent',
              color: tab === t ? 'white' : 'var(--pg-text-sec)',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s',
            }}
          >
            {t === 'submit' ? 'My submissions' : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'submit' && localSubs.some((s) => s.status === 'pending') && (
              <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--pg-amber)' }}>●</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="pg-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {comp.onChainId != null && (
            <div
              style={{
                background: 'var(--pg-mid)',
                border: '1px solid var(--pg-border)',
                borderRadius: 14,
                padding: '1.25rem',
                gridColumn: '1 / -1',
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: 'var(--pg-text-sec)',
                  marginBottom: 12,
                }}
              >
                ON-CHAIN ESCROW
              </div>
              {onChainError && (
                <p style={{ fontSize: 13, color: 'var(--pg-red)', margin: 0 }}>{onChainError}</p>
              )}
              {onChain && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: 12,
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--pg-text-dim)', fontSize: 11 }}>Competition #</div>
                    {onChain.onChainId}
                  </div>
                  <div>
                    <div style={{ color: 'var(--pg-text-dim)', fontSize: 11 }}>Status</div>
                    {onChain.onChainStatus}
                  </div>
                  <div>
                    <div style={{ color: 'var(--pg-text-dim)', fontSize: 11 }}>Pool (locked)</div>
                    {onChain.prizePoolXlm} XLM
                  </div>
                  {onChain.escrowBalanceXlm != null && (
                    <div>
                      <div style={{ color: 'var(--pg-text-dim)', fontSize: 11 }}>Contract balance</div>
                      {onChain.escrowBalanceXlm} XLM
                    </div>
                  )}
                </div>
              )}
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--pg-text-dim)' }}>
                {comp.createTxHash && (
                  <a href={explorerTxUrl(comp.createTxHash)} target="_blank" rel="noreferrer">
                    Create tx
                  </a>
                )}
                {comp.finalizeTxHash && (
                  <>
                    {' · '}
                    <a href={explorerTxUrl(comp.finalizeTxHash)} target="_blank" rel="noreferrer">
                      Finalize tx
                    </a>
                  </>
                )}
                {comp.cancelTxHash && (
                  <>
                    {' · '}
                    <a href={explorerTxUrl(comp.cancelTxHash)} target="_blank" rel="noreferrer">
                      Cancel tx
                    </a>
                  </>
                )}
                {' · '}
                <a href={explorerContractUrl(ESCROW_CONTRACT_ID)} target="_blank" rel="noreferrer">
                  Contract
                </a>
              </div>
            </div>
          )}
          <div
            style={{
              background: 'var(--pg-mid)',
              border: '1px solid var(--pg-border)',
              borderRadius: 14,
              overflow: 'hidden',
              gridColumn: '1 / -1',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--pg-border-dim)',
                background: 'var(--pg-surface)',
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>
                FOUNDER INSTRUCTIONS
              </span>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: 14, color: 'var(--pg-text-sec)', lineHeight: 1.7, marginBottom: '1rem' }}>
                {comp.instructions}
              </p>
              <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--pg-text-dim)', marginBottom: 8 }}>
                REQUIRED PROOF
              </div>
              {(comp.proofRequirements ?? []).map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', fontSize: 13, color: 'var(--pg-text-sec)' }}>
                  <span style={{ color: 'var(--pg-accent-bright)' }}>•</span>
                  {p}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: 'var(--pg-mid)',
              border: '1px solid var(--pg-border)',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--pg-border-dim)',
                background: 'var(--pg-surface)',
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>
                SCORING RUBRIC
              </span>
            </div>
            <div style={{ padding: '1rem' }}>
              {(comp.scoringRules ?? []).map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 8px',
                    borderBottom: i < (comp.scoringRules ?? []).length - 1 ? '1px solid var(--pg-border-dim)' : 'none',
                  }}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--pg-text-sec)' }}>
                    {r.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--pg-accent-bright)',
                    }}
                  >
                    +{r.points} pts
                  </span>
                </div>
              ))}
              <p style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginTop: 12, lineHeight: 1.5 }}>
                Points are assigned when the founder approves your submission — not automatically.
              </p>
            </div>
          </div>

          <div
            style={{
              background: 'var(--pg-mid)',
              border: '1px solid var(--pg-border)',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--pg-border-dim)',
                background: 'var(--pg-surface)',
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>
                PRIZE DISTRIBUTION
              </span>
            </div>
            <div style={{ padding: '1rem' }}>
              {prizeDistribution.slice(0, comp.winners).map((pct, i) => {
                const rc = rankColors[i + 1] ?? { bg: 'var(--pg-surface)', color: 'var(--pg-text-dim)' };
                const amount = Math.round((comp.prizePool * pct) / 100);
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 8px',
                      borderBottom: i < comp.winners - 1 ? '1px solid var(--pg-border-dim)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                        fontWeight: 700,
                        background: rc.bg,
                        color: rc.color,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'var(--pg-text-sec)', marginBottom: 4 }}>{pct}% of pool</div>
                      <div style={{ height: 4, background: 'rgba(37,99,235,0.15)', borderRadius: 2 }}>
                        <div
                          style={{
                            height: '100%',
                            background: i === 0 ? '#FBBF24' : i === 1 ? '#94A3B8' : '#CD7F32',
                            borderRadius: 2,
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700 }}>{amount} XLM</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'submit' && (
        <div>
          {!joined && (
            <div
              style={{
                background: 'var(--pg-mid)',
                border: '1px solid var(--pg-border)',
                borderRadius: 12,
                padding: '2rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <p style={{ color: 'var(--pg-text-sec)', marginBottom: '1rem' }}>Join this competition to submit proof of your growth work.</p>
              {canJoin ? (
                <button type="button" className="pg-btn-primary" onClick={() => void handleJoin()}>
                  Join competition
                </button>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--pg-text-dim)', margin: 0 }}>
                  {comp.schedulePhase === 'before_start'
                    ? `Opens ${comp.startDate}`
                    : 'This competition is not accepting participants.'}
                </p>
              )}
            </div>
          )}
          {joined && !canSubmit && (
            <p style={{ fontSize: 13, color: 'var(--pg-amber)', marginBottom: '1rem' }}>
              {comp.schedulePhase === 'before_start'
                ? `Submissions open on ${comp.startDate}.`
                : comp.schedulePhase === 'after_end'
                  ? 'Submission period ended. Awaiting founder finalize.'
                  : 'Submissions are closed.'}
            </p>
          )}

          {showForm && canSubmit && (
            <div
              style={{
                background: 'var(--pg-mid)',
                border: '1px solid var(--pg-accent-bright)',
                borderRadius: 14,
                padding: '1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: '1rem' }}>New submission</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Field label="What did you do?" value={form.summary} onChange={(v) => setForm((f) => ({ ...f, summary: v }))} placeholder="e.g. LinkedIn campaign week 2 — 4 onboarded users" />
                <Field label="Claimed outcome" value={form.claimedMetric} onChange={(v) => setForm((f) => ({ ...f, claimedMetric: v }))} placeholder="e.g. 4 users · onboarding complete" />
                <Field label="Evidence description" value={form.evidence} onChange={(v) => setForm((f) => ({ ...f, evidence: v }))} placeholder="What you're attaching or linking" multiline />
                <Field label="Link (optional)" value={form.evidenceUrl} onChange={(v) => setForm((f) => ({ ...f, evidenceUrl: v }))} placeholder="https://…" />
              </div>
              {submitError && (
                <p style={{ color: 'var(--pg-red)', fontSize: 13, marginTop: '1rem' }}>{submitError}</p>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="pg-btn-primary"
                  style={{ padding: '10px 24px', fontSize: 14 }}
                  disabled={submitting}
                  onClick={() => void handleSubmit()}
                >
                  {submitting ? 'Submitting…' : 'Submit for review'}
                </button>
                <button className="pg-btn-secondary" style={{ padding: '10px 24px', fontSize: 14 }} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {canSubmit && !showForm && (
            <button
              className="pg-btn-secondary"
              style={{ marginBottom: '1rem', padding: '10px 20px', fontSize: 13 }}
              onClick={() => setShowForm(true)}
            >
              + New submission
            </button>
          )}

          <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--pg-border-dim)',
                background: 'var(--pg-surface)',
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>
                YOUR SUBMISSIONS ({localSubs.length})
              </span>
            </div>
            {localSubs.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--pg-text-dim)', fontSize: 14 }}>
                No submissions yet. Complete growth work, then submit proof for founder review.
              </div>
            ) : (
              localSubs.map((s, i) => {
                const st = submissionStatusStyle(s.status);
                return (
                  <div
                    key={s.id}
                    style={{
                      padding: '16px 20px',
                      borderBottom: i < localSubs.length - 1 ? '1px solid var(--pg-border-dim)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-text-dim)' }}>
                        {s.submittedAt}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 600,
                          background: st.bg,
                          color: st.color,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {st.label.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{s.summary}</div>
                    <div style={{ fontSize: 13, color: 'var(--pg-accent-bright)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>
                      {s.claimedMetric}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>{s.evidence}</div>
                    {s.pointsAwarded != null && (
                      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--pg-green)', fontFamily: "'JetBrains Mono', monospace" }}>
                        +{s.pointsAwarded} pts awarded
                      </div>
                    )}
                    {s.founderNote && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: 10,
                          background: 'var(--pg-surface)',
                          borderRadius: 8,
                          fontSize: 12,
                          color: 'var(--pg-text-sec)',
                        }}
                      >
                        <strong>Founder:</strong> {s.founderNote}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {tab === 'leaderboard' && (
        <div style={{ background: 'var(--pg-mid)', border: '1px solid var(--pg-border)', borderRadius: 14, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--pg-border-dim)',
              background: 'var(--pg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>
              LEADERBOARD
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--pg-text-dim)' }}>
              Approved points only
            </span>
          </div>
          <div
            className="pg-table-row"
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 90px 90px 100px',
              padding: '10px 20px',
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--pg-text-dim)',
              textTransform: 'uppercase',
              borderBottom: '1px solid var(--pg-border-dim)',
              background: 'var(--pg-surface)',
            }}
          >
            <span>RNK</span>
            <span>PARTICIPANT</span>
            <span style={{ textAlign: 'right' }}>POINTS</span>
            <span style={{ textAlign: 'right' }}>APPROVED</span>
            <span style={{ textAlign: 'right' }}>WALLET</span>
          </div>
          {(comp.leaderboard ?? []).length > 0 ? (
            (comp.leaderboard ?? []).map((p) => {
              const rc = rankColors[p.rank] ?? { bg: 'var(--pg-surface)', color: 'var(--pg-text-dim)' };
              return (
                <div
                  key={p.rank}
                  className="pg-lb-row pg-table-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 90px 90px 100px',
                    padding: '14px 20px',
                    fontSize: 13,
                    alignItems: 'center',
                    borderBottom: '1px solid var(--pg-border-dim)',
                    background: p.rank === 1 ? 'rgba(37,99,235,0.06)' : 'transparent',
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      background: rc.bg,
                      color: rc.color,
                    }}
                  >
                    {p.rank}
                  </div>
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, textAlign: 'right' }}>
                    {p.pts.toLocaleString()}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      textAlign: 'right',
                      color: 'var(--pg-text-sec)',
                    }}
                  >
                    {p.approvedSubmissions}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: 'var(--pg-text-dim)',
                      textAlign: 'right',
                    }}
                  >
                    {p.wallet}
                  </span>
                </div>
              );
            })
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'var(--pg-text-dim)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
              }}
            >
              No rankings yet. Join and submit proof to compete.
            </div>
          )}
        </div>
      )}

      {tab === 'rules' && (
        <div className="pg-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {[
            {
              title: 'Eligibility',
              items: [
                'Valid Stellar wallet required',
                'One wallet per participant',
                'Follow founder instructions exactly',
                'No fraudulent or duplicate claims',
              ],
            },
            {
              title: 'Scoring',
              items: (comp.scoringRules ?? []).map((r) => `${r.label}: up to +${r.points} pts when approved`),
            },
            {
              title: 'Submissions & review',
              items: [
                'Submit summary, claimed outcome, and evidence',
                'Founder verifies against their own data sources',
                'Approved submissions add points to leaderboard',
                'Rejected or revision requests include founder feedback',
              ],
            },
            {
              title: 'Payouts',
              items: [
                'Prize pool held in Soroban escrow',
                'Winners set from final approved leaderboard',
                `${PRIZE_ASSET} distributed on-chain when the founder finalizes winners`,
                'Disputes handled via founder review history',
              ],
            },
          ].map((section, i) => (
            <div
              key={i}
              style={{
                background: 'var(--pg-mid)',
                border: '1px solid var(--pg-border)',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--pg-border-dim)',
                  background: 'var(--pg-surface)',
                }}
              >
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-sec)' }}>
                  {section.title.toUpperCase()}
                </span>
              </div>
              <div style={{ padding: '1rem' }}>
                {section.items.map((item, j) => (
                  <div
                    key={j}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px',
                      borderBottom: j < section.items.length - 1 ? '1px solid var(--pg-border-dim)' : 'none',
                    }}
                  >
                    <span style={{ color: 'var(--pg-green)', marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 13, color: 'var(--pg-text-sec)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {item}
                    </span>
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          color: 'var(--pg-text-dim)',
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {multiline ? (
        <textarea className="pg-textarea" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ minHeight: 72 }} />
      ) : (
        <input className="pg-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}
