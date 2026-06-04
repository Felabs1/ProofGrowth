import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { listCompetitions, listFounderSubmissions, reviewSubmission } from '../api/client';
import type { Competition, ReviewTab, Submission, SubmissionStatus } from '../api/types';
import { filterFounderSubmissions, submissionStatusStyle } from '../data/helpers';
import { useWallet } from '../wallet/WalletContext';
import { StellarWalletsKit } from '../wallet/walletKit';
import { ErrorBlock, LoadingBlock } from './ApiState';

interface FounderReviewProps {
  onNavigate: (page: string, id?: string, options?: { tab?: string }) => void;
}

const TABS: { id: ReviewTab; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Decided' },
  { id: 'all', label: 'All' },
];

export function FounderReview({ onNavigate }: FounderReviewProps) {
  const { address, connect } = useWallet();
  const [searchParams, setSearchParams] = useSearchParams();
  const compFilter = searchParams.get('comp') || '';
  const tab = (searchParams.get('tab') as ReviewTab) || 'pending';

  const [queue, setQueue] = useState<Submission[]>([]);
  const [founderComps, setFounderComps] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState('40');
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!address) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [subs, comps] = await Promise.all([
        listFounderSubmissions({ founderWallet: address }),
        listCompetitions({ founderWallet: address }),
      ]);
      setQueue(subs);
      setFounderComps(comps);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load review queue');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      filterFounderSubmissions(queue, {
        competitionId: compFilter || null,
        tab,
      }),
    [queue, compFilter, tab],
  );

  const pendingInView = filtered.filter(
    (s) => s.status === 'pending' || s.status === 'revision_requested',
  ).length;

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((s) => s.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = queue.find((s) => s.id === selectedId) ?? null;

  const setCompFilter = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('comp', id);
    else next.delete('comp');
    setSearchParams(next);
  };

  const setTab = (t: ReviewTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next);
  };

  const ensureWallet = async (): Promise<string | null> => {
    if (address) return address;
    await connect();
    return (await StellarWalletsKit.getAddress()).address;
  };

  const act = async (status: SubmissionStatus) => {
    if (!selected) return;
    const wallet = await ensureWallet();
    if (!wallet) return;
    const pts = status === 'approved' ? Number(pointsInput) || 0 : undefined;
    setActing(true);
    try {
      await reviewSubmission(selected.id, {
        founder_wallet: wallet,
        status: status as 'approved' | 'rejected' | 'revision_requested',
        points_awarded: pts,
        founder_note: note.trim() || undefined,
      });
      await load();
      setNote('');
    } finally {
      setActing(false);
    }
  };

  const activeComp = compFilter ? founderComps.find((c) => c.id === compFilter) : null;

  if (!address && !loading) {
    return (
      <div className="pg-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 2rem 60px' }}>
        <p style={{ color: 'var(--pg-text-sec)', marginBottom: 16 }}>
          Connect your wallet to review submissions for competitions you host.
        </p>
        <button type="button" className="pg-btn-primary" onClick={() => void connect()}>
          Connect wallet
        </button>
      </div>
    );
  }

  return (
    <div className="pg-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 2rem 60px' }}>
      <button
        onClick={() => onNavigate('founder')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--pg-text-sec)',
          cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          marginBottom: '1.5rem',
        }}
      >
        ← Founder dashboard
      </button>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>Review queue</h1>
      <p style={{ color: 'var(--pg-text-sec)', marginBottom: '1.5rem' }}>
        {pendingInView} pending in view · {queue.length} total for your competitions
      </p>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => setCompFilter('')}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: !compFilter ? 'var(--pg-accent)' : 'var(--pg-surface)',
                color: !compFilter ? '#fff' : 'var(--pg-text-sec)',
              }}
            >
              All competitions
            </button>
            {founderComps.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCompFilter(c.id)}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: compFilter === c.id ? 'var(--pg-accent)' : 'var(--pg-surface)',
                  color: compFilter === c.id ? '#fff' : 'var(--pg-text-sec)',
                }}
              >
                {c.title.slice(0, 28)}
                {c.title.length > 28 ? '…' : ''}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: tab === t.id ? 'var(--pg-accent)' : 'var(--pg-surface)',
                  color: tab === t.id ? '#fff' : 'var(--pg-text-sec)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeComp && (
            <p style={{ fontSize: 13, color: 'var(--pg-text-dim)', marginBottom: 12 }}>
              Filtering: {activeComp.title}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(320px, 1.4fr)', gap: '1.5rem' }}>
            <div
              style={{
                background: 'var(--pg-mid)',
                border: '1px solid var(--pg-border)',
                borderRadius: 12,
                overflow: 'hidden',
                maxHeight: 520,
                overflowY: 'auto',
              }}
            >
              {filtered.length === 0 ? (
                <p style={{ padding: 20, color: 'var(--pg-text-dim)', fontSize: 14 }}>No submissions in this tab.</p>
              ) : (
                filtered.map((s) => {
                  const st = submissionStatusStyle(s.status);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '14px 16px',
                        border: 'none',
                        borderBottom: '1px solid var(--pg-border-dim)',
                        cursor: 'pointer',
                        background: selectedId === s.id ? 'var(--pg-accent-dim)' : 'transparent',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--pg-text)' }}>
                        {s.participantName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--pg-text-dim)', marginTop: 4 }}>
                        {s.claimedMetric}
                      </div>
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: 8,
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: st.bg,
                          color: st.color,
                        }}
                      >
                        {st.label}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {selected ? (
              <div
                style={{
                  background: 'var(--pg-mid)',
                  border: '1px solid var(--pg-border)',
                  borderRadius: 12,
                  padding: '1.25rem',
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{selected.participantName}</h3>
                <p style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginBottom: 16 }}>
                  {selected.participantWallet} · {selected.submittedAt}
                </p>
                <p style={{ fontSize: 14, marginBottom: 12 }}>{selected.summary}</p>
                <p style={{ fontSize: 13, color: 'var(--pg-text-sec)', marginBottom: 8 }}>
                  <strong>Claimed:</strong> {selected.claimedMetric}
                </p>
                <p style={{ fontSize: 13, color: 'var(--pg-text-sec)', marginBottom: 16 }}>
                  <strong>Evidence:</strong> {selected.evidence}
                </p>
                {selected.evidenceUrl && (
                  <a
                    href={selected.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--pg-accent-bright)', fontSize: 13 }}
                  >
                    Open evidence link →
                  </a>
                )}

                {(selected.status === 'pending' || selected.status === 'revision_requested') && (
                  <div style={{ marginTop: 24 }}>
                    <label style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>Points if approved</label>
                    <input
                      className="pg-input"
                      type="number"
                      min={0}
                      value={pointsInput}
                      onChange={(e) => setPointsInput(e.target.value)}
                      style={{ marginTop: 6, marginBottom: 12 }}
                    />
                    <label style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>Founder note</label>
                    <textarea
                      className="pg-input"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      style={{ marginTop: 6, marginBottom: 16, width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="pg-btn-primary"
                        disabled={acting}
                        onClick={() => void act('approved')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="pg-btn-secondary"
                        disabled={acting}
                        onClick={() => void act('revision_requested')}
                      >
                        Request revision
                      </button>
                      <button
                        type="button"
                        className="pg-btn-secondary"
                        disabled={acting}
                        onClick={() => void act('rejected')}
                        style={{ color: 'var(--pg-red)' }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--pg-text-dim)' }}>Select a submission to review.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
