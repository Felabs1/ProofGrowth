import { API_BASE_URL } from '../config/stellar';
import { debugError, debugLog } from '../utils/debug';
import type {
  Competition,
  GlobalLeaderboardEntry,
  ReviewTab,
  Submission,
  SubmissionStatus,
} from './types';

function messageFromApiBody(body: unknown): string {
  if (!body || typeof body !== 'object' || !('error' in body)) {
    return 'Request failed';
  }
  const err = (body as { error: unknown }).error;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const flat = err as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    const parts: string[] = [...(flat.formErrors ?? [])];
    for (const [field, msgs] of Object.entries(flat.fieldErrors ?? {})) {
      for (const m of msgs ?? []) parts.push(`${field}: ${m}`);
    }
    if (parts.length) return parts.join('; ');
  }
  try {
    return JSON.stringify(err);
  } catch {
    return 'Request failed';
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? 'GET';
  debugLog('api', `${method} ${path}`);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = messageFromApiBody(body) || res.statusText;
      const err = new ApiError(msg, res.status, body);
      debugError('api', `${method} ${path} → ${res.status}`, err, { body });
      throw err;
    }
    debugLog('api', `${method} ${path} → ${res.status}`);
    return body as T;
  } catch (e) {
    if (!(e instanceof ApiError)) {
      debugError('api', `${method} ${path} (network or parse)`, e, {
        baseUrl: API_BASE_URL,
      });
    }
    throw e;
  }
}

export interface CreateCompetitionPayload {
  founder_wallet: string;
  title: string;
  description?: string;
  category?: string;
  goal_type: 'users' | 'volume' | 'leads';
  instructions: string;
  proof_requirements: string[];
  scoring_rules: { label: string; points: number }[];
  prize_pool: number;
  winners_count: number;
  winner_split?: { top: number } | { split: number[] };
  start_at: string;
  end_at: string;
  on_chain_id: number;
  token_contract: string;
  create_tx_hash?: string;
}

export async function listCompetitions(opts?: {
  founderWallet?: string;
}): Promise<Competition[]> {
  const q = opts?.founderWallet
    ? `?founderWallet=${encodeURIComponent(opts.founderWallet)}`
    : '';
  const { competitions } = await request<{ competitions: Competition[] }>(`/competitions${q}`);
  return competitions ?? [];
}

export async function getCompetition(id: string): Promise<Competition> {
  const { competition } = await request<{ competition: Competition }>(`/competitions/${id}`);
  return competition;
}

export async function createCompetitionOnPlatform(
  payload: CreateCompetitionPayload,
): Promise<{ competition: Competition }> {
  return request('/competitions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function joinCompetition(
  competitionId: string,
  body: { participant_wallet: string; participant_name?: string },
): Promise<void> {
  await request(`/competitions/${competitionId}/join`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function listCompetitionSubmissions(
  competitionId: string,
  opts?: { tab?: ReviewTab; wallet?: string },
): Promise<Submission[]> {
  const params = new URLSearchParams();
  if (opts?.tab) params.set('tab', opts.tab);
  if (opts?.wallet) params.set('wallet', opts.wallet);
  const q = params.toString() ? `?${params}` : '';
  const { submissions } = await request<{ submissions: Submission[] }>(
    `/competitions/${competitionId}/submissions${q}`,
  );
  return submissions;
}

export async function submitProof(
  competitionId: string,
  body: {
    participant_wallet: string;
    participant_name?: string;
    summary: string;
    claimed_metric: string;
    evidence: string;
    evidence_url?: string;
  },
): Promise<Submission> {
  const { submission } = await request<{ submission: Submission }>(
    `/competitions/${competitionId}/submissions`,
    { method: 'POST', body: JSON.stringify(body) },
  );
  return submission;
}

export async function listFounderSubmissions(opts: {
  founderWallet: string;
  competitionId?: string;
  tab?: ReviewTab;
}): Promise<Submission[]> {
  const params = new URLSearchParams({ founderWallet: opts.founderWallet });
  if (opts.competitionId) params.set('competitionId', opts.competitionId);
  if (opts.tab) params.set('tab', opts.tab);
  const { submissions } = await request<{ submissions: Submission[] }>(
    `/submissions?${params}`,
  );
  return submissions;
}

export async function reviewSubmission(
  submissionId: string,
  body: {
    founder_wallet: string;
    status: Extract<SubmissionStatus, 'approved' | 'rejected' | 'revision_requested'>;
    points_awarded?: number;
    founder_note?: string;
  },
): Promise<Submission> {
  const { submission } = await request<{ submission: Submission }>(
    `/submissions/${submissionId}/review`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
  return submission;
}

export async function listParticipantSubmissions(wallet: string): Promise<Submission[]> {
  const { submissions } = await request<{ submissions: Submission[] }>(
    `/participants/${encodeURIComponent(wallet)}/submissions`,
  );
  return submissions;
}

export async function listJoinedCompetitionIds(wallet: string): Promise<string[]> {
  const { competitionIds } = await request<{ competitionIds: string[] }>(
    `/participants/${encodeURIComponent(wallet)}/competitions`,
  );
  return competitionIds;
}

export async function finalizeCompetitionOnPlatform(
  competitionId: string,
  body: {
    founder_wallet: string;
    finalize_tx_hash?: string;
    payouts: { wallet: string; amount_xlm: number }[];
  },
): Promise<{ finalized: boolean; onChainId: number; payouts: { wallet: string; amount_xlm: number }[] }> {
  return request(`/competitions/${competitionId}/finalize`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function cancelCompetitionOnPlatform(
  competitionId: string,
  body: { founder_wallet: string; cancel_tx_hash: string },
): Promise<{ cancelled: boolean; onChainId: number; cancelTxHash: string }> {
  return request(`/competitions/${competitionId}/cancel`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getGlobalLeaderboard(): Promise<GlobalLeaderboardEntry[]> {
  const { leaderboard } = await request<{ leaderboard: GlobalLeaderboardEntry[] }>(
    '/leaderboard/global',
  );
  return leaderboard ?? [];
}
