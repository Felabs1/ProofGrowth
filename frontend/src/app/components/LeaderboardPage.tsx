import { useCallback, useEffect, useState } from 'react';
import { getGlobalLeaderboard, listCompetitions } from '../api/client';
import type { Competition, GlobalLeaderboardEntry } from '../api/types';
import { PRIZE_ASSET } from '../config/stellar';
import { ErrorBlock, LoadingBlock } from './ApiState';

interface LeaderboardPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export function LeaderboardPage({ onNavigate }: LeaderboardPageProps) {
  const [leaderboard, setLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lb, comps] = await Promise.all([getGlobalLeaderboard(), listCompetitions()]);
      setLeaderboard(lb);
      setCompetitions(comps.filter((c) => c.status === 'active').slice(0, 5));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rankColors: Record<number, { bg: string; color: string }> = {
    1: { bg: 'rgba(250,204,21,0.15)', color: '#FBBF24' },
    2: { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8' },
    3: { bg: 'rgba(180,120,83,0.12)', color: '#CD7F32' },
  };

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
        // GLOBAL LEADERBOARD
      </span>
      <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, marginBottom: '0.5rem' }}>
        Top growth operators
      </h1>
      <p style={{ color: 'var(--pg-text-sec)', marginBottom: '2.5rem' }}>
        Ranked by founder-approved points across all competitions.
      </p>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          <div
            style={{
              background: 'var(--pg-mid)',
              border: '1px solid var(--pg-border)',
              borderRadius: 14,
              overflow: 'hidden',
              marginBottom: '3rem',
            }}
          >
            {leaderboard.length === 0 ? (
              <p style={{ padding: 24, color: 'var(--pg-text-dim)' }}>No approved points yet.</p>
            ) : (
              leaderboard.map((p, i) => {
                const rc = rankColors[p.rank] ?? { bg: 'transparent', color: 'var(--pg-text-dim)' };
                return (
                  <div
                    key={p.wallet}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem',
                      padding: '16px 20px',
                      borderBottom:
                        i < leaderboard.length - 1 ? '1px solid var(--pg-border-dim)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: rc.bg,
                        color: rc.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {p.rank}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          color: 'var(--pg-text-dim)',
                        }}
                      >
                        {p.wallet}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 18,
                          fontWeight: 700,
                          color: 'var(--pg-accent-bright)',
                        }}
                      >
                        {p.pts} pts
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--pg-text-dim)' }}>
                        {p.approvedSubmissions} approved · {p.competitions} comps
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Active competitions</h2>
          <div
            style={{
              background: 'var(--pg-mid)',
              border: '1px solid var(--pg-border)',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            {competitions.map((c, i, arr) => (
              <div
                key={c.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--pg-border-dim)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  cursor: 'pointer',
                }}
                onClick={() => onNavigate('detail', c.id)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>{c.category}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--pg-accent-bright)',
                    }}
                  >
                    {c.prizePool.toLocaleString()} {PRIZE_ASSET}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
