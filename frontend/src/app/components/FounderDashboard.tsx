import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  finalizeCompetitionOnPlatform,
  listCompetitions,
  listFounderSubmissions,
} from '../api/client';
import type { Competition } from '../api/types';
import { PRIZE_ASSET } from '../config/stellar';
import { finalizeAndDistributeOnChain } from '../contracts/escrow';
import { debugError, debugLog } from '../utils/debug';
import { countSubmissionsByStatus } from '../data/helpers';
import { buildPayoutsFromCompetition } from '../utils/payouts';
import { displayName, walletInitials } from '../utils/display';
import { useWallet } from '../wallet/WalletContext';
import { StellarWalletsKit } from '../wallet/walletKit';
import { explorerTxUrl } from '../config/stellar';
import { ErrorBlock, LoadingBlock } from './ApiState';

interface FounderDashboardProps {
  onNavigate: (page: string, id?: string, options?: { tab?: string }) => void;
}

export function FounderDashboard({ onNavigate }: FounderDashboardProps) {
  const { address, connect, signTransaction } = useWallet();
  const [myComps, setMyComps] = useState<Competition[]>([]);
  const [submissions, setSubmissions] = useState<Awaited<ReturnType<typeof listFounderSubmissions>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalizingId, setFinalizingId] = useState<string | null>(null);
  const [finalizeMsg, setFinalizeMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!address) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [comps, subs] = await Promise.all([
        listCompetitions({ founderWallet: address }),
        listFounderSubmissions({ founderWallet: address }),
      ]);
      setMyComps(comps);
      setSubmissions(subs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load founder dashboard');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => countSubmissionsByStatus(submissions), [submissions]);

  const compRows = useMemo(
    () =>
      myComps.map((c) => ({
        ...c,
        counts: countSubmissionsByStatus(submissions, c.id),
      })),
    [myComps, submissions],
  );

  const handleFinalize = async (comp: Competition) => {
    let wallet = address;
    if (!wallet) {
      await connect();
      wallet = (await StellarWalletsKit.getAddress()).address;
    }
    if (!wallet || comp.onChainId == null) return;

    setFinalizingId(comp.id);
    setFinalizeMsg(null);
    debugLog('founder-dashboard', 'finalize:start', {
      competitionId: comp.id,
      onChainId: comp.onChainId,
      wallet,
    });
    try {
      const payouts = buildPayoutsFromCompetition(comp);
      debugLog('founder-dashboard', 'finalize:payouts', { payouts });
      const { txHash } = await finalizeAndDistributeOnChain({
        founderAddress: wallet,
        onChainId: comp.onChainId,
        payouts,
        signTransaction,
      });
      await finalizeCompetitionOnPlatform(comp.id, {
        founder_wallet: wallet,
        payouts,
      });
      debugLog('founder-dashboard', 'finalize:success', { txHash });
      setFinalizeMsg(`Finalized ${comp.title} — ${explorerTxUrl(txHash)}`);
      await load();
    } catch (e) {
      debugError('founder-dashboard', 'finalize:failed', e, {
        competitionId: comp.id,
        onChainId: comp.onChainId,
      });
      setFinalizeMsg(e instanceof Error ? e.message : 'Finalize failed');
    } finally {
      setFinalizingId(null);
    }
  };

  if (!address && !loading) {
    return (
      <div className="pg-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 2rem 60px' }}>
        <p style={{ color: 'var(--pg-text-sec)', marginBottom: 16 }}>
          Connect the wallet you used to create competitions to manage them here.
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
        // FOUNDER DASHBOARD
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
              {address ? displayName(address) : 'Founder'}
            </h1>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--pg-text-dim)' }}>
              {address ?? '—'} · Competition host
            </div>
          </div>
        </div>
        <button
          className="pg-btn-primary"
          style={{ padding: '10px 20px', fontSize: 13 }}
          onClick={() => onNavigate('create')}
        >
          + New competition
        </button>
      </div>

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <StatChip label="Pending review" value={String(totals.pending)} highlight />
            <StatChip label="Approved" value={String(totals.approved)} />
            <StatChip label="Competitions" value={String(myComps.length)} />
          </div>

          {finalizeMsg && (
            <p style={{ fontSize: 13, color: 'var(--pg-green)', marginBottom: 16 }}>{finalizeMsg}</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {compRows.length === 0 && (
              <p style={{ color: 'var(--pg-text-dim)' }}>
                No competitions yet.{' '}
                <button type="button" className="pg-btn-primary" onClick={() => onNavigate('create')}>
                  Launch one
                </button>
              </p>
            )}
            {compRows.map((c) => (
              <div
                key={c.id}
                className="pg-card"
                style={{ padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}
              >
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{c.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--pg-text-sec)' }}>
                    {c.counts.pending} pending · {c.status}
                    {c.onChainId != null ? ` · on-chain #${c.onChainId}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <StatChip label="Prize" value={`${c.prizePool.toLocaleString()} ${PRIZE_ASSET}`} />
                  <button
                    type="button"
                    className="pg-btn-secondary"
                    style={{ fontSize: 13 }}
                    onClick={() => onNavigate('review', c.id, { tab: 'pending' })}
                  >
                    Review ({c.counts.pending})
                  </button>
                  <button
                    type="button"
                    className="pg-btn-secondary"
                    style={{ fontSize: 13 }}
                    onClick={() => onNavigate('competition', c.id)}
                  >
                    View
                  </button>
                  {c.status === 'active' && c.onChainId != null && (c.leaderboard ?? []).length > 0 && (
                    <button
                      type="button"
                      className="pg-btn-primary"
                      style={{ fontSize: 13 }}
                      disabled={finalizingId === c.id}
                      onClick={() => void handleFinalize(c)}
                    >
                      {finalizingId === c.id ? 'Finalizing…' : 'Finalize & pay'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: highlight ? 'var(--pg-accent-dim)' : 'var(--pg-mid)',
        border: '1px solid var(--pg-border)',
        borderRadius: 10,
        padding: '12px 18px',
        minWidth: 100,
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--pg-text-dim)', marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 18,
          fontWeight: 700,
          color: highlight ? 'var(--pg-accent-bright)' : 'var(--pg-text)',
        }}
      >
        {value}
      </div>
    </div>
  );
}
