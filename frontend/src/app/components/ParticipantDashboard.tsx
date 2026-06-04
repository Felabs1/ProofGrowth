import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getGlobalLeaderboard,
  listCompetitions,
  listJoinedCompetitionIds,
  listParticipantSubmissions,
} from '../api/client';
import type { Competition, Submission } from '../api/types';
import { submissionStatusStyle } from '../data/helpers';
import { displayName, walletInitials } from '../utils/display';
import { useWallet } from '../wallet/WalletContext';
import { ErrorBlock, LoadingBlock } from './ApiState';

interface ParticipantDashboardProps {
  onNavigate: (page: string, id?: string) => void;
}

type JoinedCompView = Competition & {
  myScore: number;
  myRank: number;
  pendingSubs: number;
};

function enrichJoined(comps: Competition[], wallet: string, subs: Submission[]): JoinedCompView[] {
  return comps.map((c) => {
    const entry = (c.leaderboard ?? []).find((e) => e.wallet === wallet);
    const mySubs = subs.filter((s) => s.competitionId === c.id);
    return {
      ...c,
      myScore: entry?.pts ?? 0,
      myRank: entry?.rank ?? 0,
      pendingSubs: mySubs.filter(
        (s) => s.status === 'pending' || s.status === 'revision_requested',
      ).length,
    };
  });
}

export function ParticipantDashboard({ onNavigate }: ParticipantDashboardProps) {
  const { address, connect } = useWallet();
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [myCompetitions, setMyCompetitions] = useState<JoinedCompView[]>([]);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    let wallet = address;
    if (!wallet) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [subs, joinedIds, allComps, globalLb] = await Promise.all([
        listParticipantSubmissions(wallet),
        listJoinedCompetitionIds(wallet),
        listCompetitions(),
        getGlobalLeaderboard(),
      ]);
      setMySubmissions(subs);
      const joined = allComps.filter((c) => joinedIds.includes(c.id));
      setMyCompetitions(enrichJoined(joined, wallet, subs));
      const me = globalLb.find((p) => p.wallet === wallet);
      setGlobalRank(me?.rank ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void load();
  }, [load]);

  const approvedPts = useMemo(
    () => mySubmissions.filter((s) => s.status === 'approved').reduce((a, s) => a + (s.pointsAwarded ?? 0), 0),
    [mySubmissions],
  );
  const pendingCount = mySubmissions.filter((s) => s.status === 'pending').length;

  if (!address && !loading) {
    return (
      <div className="pg-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 2rem 60px' }}>
        <p style={{ color: 'var(--pg-text-sec)', marginBottom: 16 }}>
          Connect your wallet to see competitions you joined and your submissions.
        </p>
        <button type="button" className="pg-btn-primary" onClick={() => void connect()}>
          Connect wallet
        </button>
      </div>
    );
  }

  return (
    <div className="pg-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 2rem 60px' }}>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: 'var(--pg-accent-bright)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          display: 'block',
          marginBottom: '1rem',
        }}
      >
        // MY COMPETITIONS (PARTICIPANT)
      </span>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--pg-accent-dim)',
              border: '2px solid var(--pg-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--pg-accent-bright)',
            }}
          >
            {address ? walletInitials(address) : '—'}
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
              {address ? displayName(address) : 'Participant'}
            </h1>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-dim)' }}>
              {address ?? '—'}
            </div>
          </div>
        </div>
        <button
          className="pg-btn-secondary"
          style={{ padding: '10px 20px', fontSize: 13 }}
          onClick={() => onNavigate('browse')}
        >
          Browse Competitions
        </button>
      </div>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && address && (
        <>
          <div
            className="pg-grid-stats"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            {[
              {
                label: 'Global Rank',
                value: globalRank != null ? `#${globalRank}` : '—',
                color: 'var(--pg-accent-bright)',
                sub: 'Approved points across comps',
              },
              {
                label: 'Approved Points',
                value: approvedPts.toLocaleString(),
                color: 'var(--pg-green)',
                sub: 'From founder-approved subs',
              },
              {
                label: 'Pending Review',
                value: pendingCount,
                color: 'var(--pg-amber)',
                sub: 'Awaiting founder decision',
              },
              {
                label: 'Competitions joined',
                value: myCompetitions.length,
                color: 'var(--pg-amber)',
                sub: 'Active participations',
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
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1,
                    color: s.color,
                    marginBottom: 4,
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div
            className="pg-stack"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 380px',
              gap: '1.5rem',
              alignItems: 'start',
            }}
          >
            <div>
              <div
                style={{
                  background: 'var(--pg-mid)',
                  border: '1px solid var(--pg-border)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  marginBottom: '1.5rem',
                }}
              >
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
                    JOINED COMPETITIONS
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--pg-text-dim)' }}>
                    {myCompetitions.length} joined
                  </span>
                </div>
                {myCompetitions.length === 0 ? (
                  <p style={{ padding: 20, color: 'var(--pg-text-dim)' }}>
                    You have not joined any competitions yet.{' '}
                    <button type="button" className="pg-btn-primary" onClick={() => onNavigate('browse')}>
                      Browse
                    </button>
                  </p>
                ) : (
                  myCompetitions.map((c, i) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '16px 20px',
                        borderBottom:
                          i < myCompetitions.length - 1 ? '1px solid var(--pg-border-dim)' : 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => onNavigate('detail', c.id)}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          marginBottom: 10,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              fontFamily: "'JetBrains Mono', monospace",
                              color: 'var(--pg-text-dim)',
                              textTransform: 'uppercase',
                              marginBottom: 4,
                            }}
                          >
                            {c.category}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{c.title}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontSize: 10,
                              color: 'var(--pg-text-dim)',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            PRIZE
                          </div>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 15,
                              fontWeight: 700,
                              color: 'var(--pg-accent-bright)',
                            }}
                          >
                            {c.prizePool.toLocaleString()} XLM
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              color: 'var(--pg-text-dim)',
                              fontFamily: "'JetBrains Mono', monospace",
                              textTransform: 'uppercase',
                              marginBottom: 2,
                            }}
                          >
                            Rank
                          </div>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 18,
                              fontWeight: 700,
                              color: c.myRank > 0 && c.myRank <= 3 ? '#FBBF24' : 'var(--pg-text)',
                            }}
                          >
                            {c.myRank > 0 ? `#${c.myRank}` : '—'}
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              color: 'var(--pg-text-dim)',
                              fontFamily: "'JetBrains Mono', monospace",
                              textTransform: 'uppercase',
                              marginBottom: 2,
                            }}
                          >
                            Approved pts
                          </div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700 }}>
                            {c.myScore}
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              color: 'var(--pg-text-dim)',
                              fontFamily: "'JetBrains Mono', monospace",
                              textTransform: 'uppercase',
                              marginBottom: 2,
                            }}
                          >
                            Pending
                          </div>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 18,
                              fontWeight: 700,
                              color: c.pendingSubs > 0 ? 'var(--pg-amber)' : 'var(--pg-text-dim)',
                            }}
                          >
                            {c.pendingSubs}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
                    MY SUBMISSIONS
                  </span>
                </div>
                {mySubmissions.length === 0 ? (
                  <p style={{ padding: 20, color: 'var(--pg-text-dim)' }}>No submissions yet.</p>
                ) : (
                  mySubmissions.map((s, i) => {
                    const st = submissionStatusStyle(s.status);
                    return (
                      <div
                        key={s.id}
                        style={{
                          padding: '14px 20px',
                          borderBottom:
                            i < mySubmissions.length - 1 ? '1px solid var(--pg-border-dim)' : 'none',
                          cursor: 'pointer',
                        }}
                        onClick={() => onNavigate('detail', s.competitionId)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span
                            style={{
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontWeight: 600,
                              background: st.bg,
                              color: st.color,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {st.label.toUpperCase()}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--pg-text-dim)',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {s.submittedAt}
                          </span>
                          {s.pointsAwarded != null && (
                            <span
                              style={{
                                marginLeft: 'auto',
                                fontSize: 12,
                                color: 'var(--pg-green)',
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 700,
                              }}
                            >
                              +{s.pointsAwarded} pts
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{s.summary}</div>
                        <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>{s.competitionTitle}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
