# ZaoTrak

ZaoTrak is a competitive growth marketplace where startups sponsor growth competitions and participants compete for prize pools by delivering real traction.

Founders deposit native XLM into Soroban escrow, publish clear rules and proof requirements, and **review participant submissions** against their own analytics, CRM, or product data. Approved submissions earn points; winners are paid from escrow when the competition ends.

The platform does **not** claim to automatically verify off-platform outcomes (e.g. “15 active users in your SaaS”) without deep integration. Instead, participants **submit proof**, founders **judge**, and the app handles workflow, leaderboard, and payouts.

---

## Problem

Early-stage startups struggle to acquire meaningful users:

- Ads bring low-intent traffic
- Signup incentives attract bots or low-quality users
- Growth hacks rarely produce retention
- Founders already have the source of truth (Mixpanel, Stripe, HubSpot, etc.) but lack a structured way to run paid growth competitions

ZaoTrak structures those competitions: escrow, submissions, review, rankings, and payout.

---

## Core idea

Founders do not buy users directly.

They launch a **growth competition**:

1. Define the goal (users, volume, leads, etc.)
2. Write **instructions** and **required proof** for participants
3. Publish a **scoring rubric** (points per approved milestone)
4. Lock the **prize pool** in escrow
5. **Review submissions** and award points
6. **Finalize winners**; escrow distributes XLM

Participants join with a wallet, do growth work off-platform, and submit claims with evidence. The leaderboard reflects **founder-approved points only**.

---

## How it works

### 1. Founder creates a competition

The founder sets:

- Title, description, schedule
- Growth goal (e.g. user acquisition, volume, B2B leads)
- **Instructions** — what counts, how you will verify
- **Proof requirements** — e.g. UTM link, analytics export, CRM deal links
- **Scoring rubric** — points awarded when a submission is approved
- Winner structure (top N or custom split)
- Prize pool (XLM) deposited into escrow

**Example**

| Field      | Value                                                     |
| ---------- | --------------------------------------------------------- |
| Title      | Acquire 20 active users for SaaS                          |
| Prize pool | 500 XLM                                                   |
| Proof      | UTM + Mixpanel cohort + anonymized user IDs               |
| Rubric     | Signup +1, onboarding +5, core action +10, 24h return +20 |

### 2. Participants join and submit

Participants:

- Connect a Stellar wallet
- Join the competition
- Run campaigns (ads, content, outbound, etc.)
- **Submit** summary, claimed outcome, and evidence (text, links, exports)
- Track status: pending · approved · rejected · needs revision

### 3. Founder reviews submissions

The founder (or their team) uses a **review queue**:

- Filter by competition
- Tabs: pending, decided, all
- Approve and assign points, reject, or request revision with feedback
- Verify against **their** dashboards — not a platform oracle

### 4. Leaderboard

Rankings update from **approved** submission points:

```
1. Alice — 248 pts (12 approved submissions)
2. Bob   — 213 pts
3. Carlos — 176 pts
```

### 5. Escrow and payout (on-chain)

Soroban handles what the chain can trust:

- Hold prize pool in escrow
- Lock final standings after competition end
- Distribute XLM to winner wallets

Scoring inputs are **off-chain** (founder decisions) until optional integrations exist for purely on-chain metrics.

### 6. Optional future: automated tracking

For goals measurable on Stellar (e.g. payments, contract calls), an on-chain listener could supplement or replace manual review. That is **not** the default path for general SaaS growth competitions.

---

## Roles

| Role            | Responsibility                                                                         |
| --------------- | -------------------------------------------------------------------------------------- |
| **Founder**     | Create competition, deposit escrow, review submissions, award points, finalize winners |
| **Participant** | Join, execute growth work, submit proof, climb leaderboard                             |
| **Platform**    | Competition lifecycle, submission inbox, audit trail, escrow orchestration             |

---

## System architecture (target)

```
+----------------------+
| Founder dashboard    |
| - My competitions    |
| - Pending counts     |
+----------------------+
          |
          v
+----------------------+     +----------------------+
| Review queue         |     | Participant app      |
| - Filter / tabs      |     | - Join / submit      |
| - Approve / reject   |     | - My submissions     |
+----------------------+     +----------------------+
          |                            |
          v                            v
+----------------------+     +----------------------+
| Competition API      |<--->| Submissions store    |
| - Rules & rubric     |     | - Status & points    |
+----------------------+     +----------------------+
          |
          v
+----------------------+
| Soroban contract     |
| - Escrow             |
| - Finalize winners   |
| - Payout USDC        |
+----------------------+
```

**On-chain:** escrow and payouts.  
**Off-chain:** submissions, founder review, leaderboard points.

---

## Repository layout

| Path                                         | Description                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| `frontend/`                                  | React + Vite UI (API-backed)                                             |
| `backend/`                                   | Express + PostgreSQL API (submissions, review, leaderboard)              |
| `zaotrak_contract/contracts/zaotrak-escrow/` | Soroban escrow: `create_competition`, `finalize_and_distribute`, `claim` |

Source of truth for types: `frontend/src/app/api/types.ts`, `backend/src/db/schema.ts`, `zaotrak_contract/contracts/zaotrak-escrow/src/lib.rs`. See [Data model](#data-model) below.

### Frontend routes (prototype)

| Route               | Audience    | Purpose                                                         |
| ------------------- | ----------- | --------------------------------------------------------------- |
| `/`                 | Everyone    | Landing                                                         |
| `/competitions`     | Everyone    | Browse                                                          |
| `/competitions/:id` | Everyone    | Detail, join, submit (participant); host banner (founder comps) |
| `/create`           | Founder     | Launch competition                                              |
| `/founder`          | Founder     | Dashboard per competition + pending counts                      |
| `/review`           | Founder     | Submission inbox (`?comp=&tab=pending`)                         |
| `/dashboard`        | Participant | My competitions & submissions                                   |
| `/leaderboard`      | Everyone    | Rankings (approved points)                                      |

Run the UI:

```bash
cd frontend
npm install
npm run dev
```

Run the platform API (required for persisted data):

```bash
cd backend
cp .env.example .env
docker compose up -d
npm install
npm run dev
# http://localhost:3001/health
```

Run escrow contract tests:

```bash
cd zaotrak_contract/contracts/zaotrak-escrow
cargo test
```

### Deploy to Vercel (frontend + API on one domain)

The repo uses [Vercel Services](https://vercel.com/docs/services): Vite UI at `/`, Express API at `/_/backend` (see root `vercel.json`).

1. Import the Git repo in Vercel and set the project **Framework Preset** to **Services** (required when `experimentalServices` is present).
2. Add environment variables (Production + Preview) — see [Environment variables](#environment-variables-on-vercel) below.
3. Deploy. The UI calls the API at `/_/backend` automatically in production builds (no `VITE_API_URL` needed unless you use a custom path).
4. Local multi-service dev (Vercel CLI ≥ 47): from repo root, `vercel dev -L`.

Health check after deploy: `https://<your-app>.vercel.app/_/backend/health`

### Environment variables on Vercel

Vercel Services use **one env list per project**, but that does **not** mean every variable is shared with the browser. What matters is the **prefix and which code reads it**:

| Variable | Set in Vercel? | Who sees it |
| -------- | -------------- | ----------- |
| `DATABASE_URL` | Yes (required) | **Backend only** — `process.env` in Express; never referenced in `frontend/` |
| `ESCROW_CONTRACT_ID`, `PRIZE_TOKEN_CONTRACT`, `SOROBAN_RPC_URL` | Optional | Backend `/health` only; frontend uses its own `VITE_*` copies for wallet/contract calls |
| `VITE_*` (e.g. `VITE_ESCROW_CONTRACT_ID`) | Optional | **Public** — inlined into the JS bundle at build time; treat as visible to users |

Rules:

- **Never** prefix secrets with `VITE_` (Vite will embed them in client JS).
- **Do not** read `DATABASE_URL` (or any secret) from `import.meta.env` in the frontend.
- Contract IDs and RPC URLs are already public on-chain; duplicating them as `VITE_*` on the frontend is intentional, not a leak of DB credentials.

If you want **hard separation** of env stores (separate dashboards, access control, or different teams), deploy `frontend/` and `backend/` as **two Vercel projects** and set `VITE_API_URL` to the backend deployment URL. Same-origin `/_/backend` is simpler and safe when you follow the prefix rules above.

---

## Data model

ZaoTrak uses **three layers**:

| Layer                          | ID example           | What it stores                                     |
| ------------------------------ | -------------------- | -------------------------------------------------- |
| **Platform (PostgreSQL + API)** | `comp-173…` (string) | Full competition, submissions, review, leaderboard |
| **Soroban escrow**             | `0` (u64)            | Prize pool, founder, token, final payouts only     |

The **`backend/`** service is PostgreSQL + REST. The frontend calls `VITE_API_URL` (default `http://localhost:3001`). See [`backend/README.md`](backend/README.md).

```text
Platform Competition (comp-1730123456789)
  ├── many Submission rows
  ├── derived LeaderboardEntry[] (from approved points)
  └── on_chain_id → Soroban Competition (0)
        └── finalize: Payout[] → winner Address + amount
```

---

### Identifiers

| Field            | Type        | Layer    | Notes                                                                       |
| ---------------- | ----------- | -------- | --------------------------------------------------------------------------- |
| `id`             | `string`    | Platform | e.g. `comp-1730123456789`; used in routes `/competitions/:id`               |
| `competition_id` | `u64`       | On-chain | Returned by `create_competition`; store on platform record as `on_chain_id` |
| `submission.id`  | `string`    | Platform | e.g. `sub-101`                                                              |
| Wallet address   | `G…` / `C…` | Stellar  | Participant identity; must be real `G` addresses for on-chain payouts       |

---

### Frontend types

Defined in `frontend/src/app/api/types.ts`.

#### `SubmissionStatus`

```ts
"pending" | "approved" | "rejected" | "revision_requested";
```

| UI label (review tab) | Includes statuses               |
| --------------------- | ------------------------------- |
| `pending`             | `pending`, `revision_requested` |
| `approved` (decided)  | `approved`, `rejected`          |
| `all`                 | every status                    |

#### `Submission`

| Field               | Type               | Required | Set by           | Description                          |
| ------------------- | ------------------ | -------- | ---------------- | ------------------------------------ |
| `id`                | `string`           | yes      | system           | Unique submission id                 |
| `competitionId`     | `string`           | yes      | system           | Platform competition id              |
| `competitionTitle`  | `string`           | yes      | denormalized     | Display copy                         |
| `participantName`   | `string`           | yes      | participant      | Display name (mock only today)       |
| `participantWallet` | `string`           | yes      | participant      | Stellar address for payouts          |
| `submittedAt`       | `string`           | yes      | system           | ISO-like timestamp string            |
| `summary`           | `string`           | yes      | participant      | What they did                        |
| `claimedMetric`     | `string`           | yes      | participant      | e.g. `4 users · onboarding complete` |
| `evidence`          | `string`           | yes      | participant      | Description of proof attached        |
| `evidenceUrl`       | `string`           | no       | participant      | Optional link                        |
| `status`            | `SubmissionStatus` | yes      | founder (review) | Workflow state                       |
| `pointsAwarded`     | `number`           | no       | founder          | Set when `approved`                  |
| `founderNote`       | `string`           | no       | founder          | Feedback on reject / revision        |

**New submission input** (`CompetitionDetail.tsx`, local form — not persisted to API):

| Field           | Type     | Required |
| --------------- | -------- | -------- |
| `summary`       | `string` | yes      |
| `claimedMetric` | `string` | yes      |
| `evidence`      | `string` | yes      |
| `evidenceUrl`   | `string` | no       |

**Founder review action** (in-memory in `FounderReview.tsx`):

| Field           | Type               | When                                             |
| --------------- | ------------------ | ------------------------------------------------ |
| `status`        | `SubmissionStatus` | `approved` \| `rejected` \| `revision_requested` |
| `pointsAwarded` | `number`           | required if `approved`                           |
| `founderNote`   | `string`           | optional                                         |

#### `Competition`

| Field               | Type                                  | Description                                   |
| ------------------- | ------------------------------------- | --------------------------------------------- |
| `id`                | `string`                              | Platform id                                   |
| `title`             | `string`                              | Competition name                              |
| `description`       | `string`                              | Long description                              |
| `category`          | `string`                              | Display label, e.g. `SaaS · User Acquisition` |
| `prizePool`         | `number`                              | XLM amount (UI units, not stroops)            |
| `startDate`         | `string`                              | `YYYY-MM-DD`                                  |
| `endDate`           | `string`                              | `YYYY-MM-DD`                                  |
| `daysLeft`          | `number`                              | Derived display field                         |
| `participants`      | `number`                              | Count of joined participants (mock)           |
| `submissionsTotal`  | `number`                              | All submissions received                      |
| `pendingReview`     | `number`                              | Submissions awaiting founder                  |
| `status`            | `'active' \| 'ended' \| 'upcoming'`   | Lifecycle                                     |
| `winners`           | `number`                              | Max winner slots (top N)                      |
| `goalType`          | `'users' \| 'volume' \| 'leads'`      | Growth goal category                          |
| `instructions`      | `string`                              | Founder rules for participants                |
| `proofRequirements` | `string[]`                            | Bullet list of required proof                 |
| `scoringRules`      | `{ label: string; points: number }[]` | Rubric (guideline, applied at review)         |
| `leaderboard`       | `LeaderboardEntry[]`                  | See below                                     |
| `progress`          | `number`                              | 0–100 UI progress bar                         |
| `founderWallet`     | `string`                              | Host wallet (mock)                            |

#### `LeaderboardEntry` (nested in `Competition`)

| Field                 | Type     | Description                   |
| --------------------- | -------- | ----------------------------- |
| `rank`                | `number` | Position                      |
| `name`                | `string` | Participant display name      |
| `pts`                 | `number` | **Approved** points total     |
| `approvedSubmissions` | `number` | Count of approved submissions |
| `wallet`              | `string` | Stellar address               |

#### `Participant` (global leaderboard)

| Field          | Type     | Description                       |
| -------------- | -------- | --------------------------------- |
| `rank`         | `number` | Global rank                       |
| `name`         | `string` | Display name                      |
| `wallet`       | `string` | Address                           |
| `pts`          | `number` | Total approved points (all comps) |
| `wins`         | `number` | Competitions won                  |
| `delta`        | `number` | Recent points change (display)    |
| `competitions` | `number` | Comps entered                     |
| `earned`       | `number` | Lifetime USDC earned (mock)       |

#### `ReviewTab`

```ts
"pending" | "approved" | "all";
```

Used in `/review?tab=` query param.

#### Create competition form (`CreateCompetition.tsx`)

Local React state before launch (not the same shape as `Competition`):

| Field               | Type                             | Description                                      |
| ------------------- | -------------------------------- | ------------------------------------------------ |
| `name`              | `string`                         | Competition name → maps to `title` in API        |
| `description`       | `string`                         | Short description                                |
| `startDate`         | `string`                         | Start date                                       |
| `endDate`           | `string`                         | End date                                         |
| `type`              | `'users' \| 'volume' \| 'leads'` | Goal type → `goalType`                           |
| `instructions`      | `string`                         | Founder instructions                             |
| `proofRequirements` | `string`                         | Newline-separated; split to `string[]` in config |
| `basePoints`        | `number`                         | Base rubric points                               |
| `firstBonus`        | `boolean`                        | Enable first-milestone bonus                     |
| `firstBonusPoints`  | `number`                         | Bonus points                                     |
| `repeatBonus`       | `boolean`                        | Enable repeat-milestone bonus                    |
| `repeatBonusPoints` | `number`                         | Bonus points                                     |
| `winnersMode`       | `'1' \| '3' \| '5' \| 'custom'`  | Winner count or custom split                     |
| `customSplit`       | `number[]`                       | Percent per place; must sum to 100               |
| `prizePool`         | `string`                         | Form input → parsed to number                    |
| `escrowConfirmed`   | `boolean`                        | UI ack before launch                             |

#### Launch config JSON (`CreateCompetition.tsx` — logged on success, not saved)

Built in memory when founder clicks launch:

```json
{
  "name": "string",
  "description": "string",
  "schedule": { "start": "string", "end": "string" },
  "type": "users | volume | leads",
  "judging": {
    "mode": "founder_review",
    "instructions": "string",
    "proofRequirements": ["string"]
  },
  "scoring": {
    "base": { "action": "string", "points": "number" },
    "bonuses": [{ "kind": "first_milestone | repeat_milestone", "points": "number" }]
  },
  "winners": { "top": "number" } | { "split": "number[]" },
  "prize": { "asset": "XLM", "amount": "number", "escrow": "soroban" },
  "tracking": { "mode": "founder_review", "escrow": "soroban" }
}
```

#### UI-only state (not in `mockData.ts`)

| Location               | State                              | Notes                                 |
| ---------------------- | ---------------------------------- | ------------------------------------- |
| `CompetitionDetail`    | `joined: boolean`                  | Join is local only                    |
| `ParticipantDashboard` | `myScore`, `myRank`, `pendingSubs` | Per-competition overlay on mock comps |
| `WalletContext`        | `address`, `isConnected`           | Stellar wallet session                |

#### Mock session identities

| Constant                  | Fields                                                 |
| ------------------------- | ------------------------------------------------------ |
| `MY_PARTICIPANT`          | `name`, `wallet`, `initials`                           |
| `MY_FOUNDER`              | `name`, `wallet`, `initials`                           |
| `FOUNDER_COMPETITION_IDS` | `['comp-1', 'comp-3']` — host-owned comps in prototype |

---

### Planned backend API

Target REST/DB entities aligned with the frontend. Field names should match the platform column unless noted.

#### `competitions` table / resource

| Field                | Type                 | Notes                                      |
| -------------------- | -------------------- | ------------------------------------------ |
| `id`                 | `uuid` or `string`   | Platform primary key                       |
| `on_chain_id`        | `u64` \| null        | From `create_competition`                  |
| `founder_wallet`     | `string`             | Stellar `G…` address                       |
| `title`              | `string`             |                                            |
| `description`        | `string`             |                                            |
| `category`           | `string`             | optional                                   |
| `goal_type`          | `enum`               | `users`, `volume`, `leads`                 |
| `instructions`       | `text`               |                                            |
| `proof_requirements` | `jsonb` / `string[]` |                                            |
| `scoring_rules`      | `jsonb`              | `{ label, points }[]`                      |
| `prize_pool`         | `decimal`            | Display currency amount                    |
| `prize_asset`        | `string`             | e.g. `XLM`                                 |
| `token_contract`     | `string`             | Soroban token `C…` address                 |
| `winners_count`      | `int`                | Max payout rows on-chain                   |
| `winner_split`       | `jsonb`              | `{ top: n }` or `{ split: number[] }`      |
| `start_at`           | `timestamp`          |                                            |
| `end_at`             | `timestamp`          |                                            |
| `status`             | `enum`               | `upcoming`, `active`, `ended`, `cancelled` |
| `created_at`         | `timestamp`          |                                            |

#### `submissions` table / resource

| Field                | Type                | Notes                      |
| -------------------- | ------------------- | -------------------------- |
| `id`                 | `uuid`              |                            |
| `competition_id`     | `fk`                | → `competitions.id`        |
| `participant_wallet` | `string`            |                            |
| `summary`            | `text`              |                            |
| `claimed_metric`     | `text`              |                            |
| `evidence`           | `text`              |                            |
| `evidence_url`       | `string` \| null    |                            |
| `status`             | `enum`              | Same as `SubmissionStatus` |
| `points_awarded`     | `int` \| null       |                            |
| `founder_note`       | `text` \| null      |                            |
| `submitted_at`       | `timestamp`         |                            |
| `reviewed_at`        | `timestamp` \| null |                            |

#### `participations` table (optional)

| Field                | Type        | Notes |
| -------------------- | ----------- | ----- |
| `competition_id`     | `fk`        |       |
| `participant_wallet` | `string`    |       |
| `joined_at`          | `timestamp` |       |

#### `leaderboard_entries` (derived or materialized)

| Field                | Type     | Notes                                  |
| -------------------- | -------- | -------------------------------------- |
| `competition_id`     | `fk`     |                                        |
| `participant_wallet` | `string` |                                        |
| `points`             | `int`    | Sum of `points_awarded` where approved |
| `approved_count`     | `int`    |                                        |
| `rank`               | `int`    | Computed ordering                      |

#### Example API shapes

```http
POST /competitions
GET  /competitions/:id
POST /competitions/:id/join
POST /competitions/:id/submissions
GET  /competitions/:id/submissions?status=pending
PATCH /submissions/:id/review   { status, points_awarded?, founder_note? }
POST /competitions/:id/finalize   { payouts: [{ wallet, amount_xlm }] }  → triggers Soroban
```

---

### On-chain (`zaotrak-escrow`)

Implemented in `zaotrak_contract/contracts/zaotrak-escrow/src/lib.rs`. Token amounts are **`i128` in the token’s smallest unit** (native XLM stroops = amount × 10^7).

#### `Competition` (contract storage)

| Field           | Rust type           | Set when             | Description                        |
| --------------- | ------------------- | -------------------- | ---------------------------------- |
| `founder`       | `Address`           | `create_competition` | Must sign cancel / finalize        |
| `token`         | `Address`           | `create_competition` | SEP-41 token contract              |
| `prize_pool`    | `i128`              | `create_competition` | Escrowed amount                    |
| `winners_count` | `u32`               | `create_competition` | Max payout rows at finalize        |
| `status`        | `CompetitionStatus` | lifecycle            | `Active`, `Finalized`, `Cancelled` |
| `title`         | `String`            | `create_competition` | Short label for indexing           |

#### `Payout` (finalize input + storage)

| Field    | Rust type | Description              |
| -------- | --------- | ------------------------ |
| `winner` | `Address` | Recipient wallet         |
| `amount` | `i128`    | Must sum to `prize_pool` |

#### `CompetitionStatus`

| Variant     | Meaning                                                               |
| ----------- | --------------------------------------------------------------------- |
| `Active`    | Escrow locked; awaiting finalize                                      |
| `Finalized` | Payouts set; claims allowed if using `finalize_competition` + `claim` |
| `Cancelled` | Refunded to founder                                                   |

#### Contract errors (`Error`)

| Code | Name             | When                                  |
| ---- | ---------------- | ------------------------------------- |
| 1    | `NotFound`       | Unknown `competition_id`              |
| 2    | `NotActive`      | Cancel/finalize on non-active comp    |
| 3    | `NotFinalized`   | `claim` before finalize               |
| 5    | `InvalidAmount`  | Zero pool, zero payout row, etc.      |
| 6    | `PayoutMismatch` | Payouts ≠ `prize_pool`                |
| 7    | `TooManyWinners` | More payout rows than `winners_count` |
| 8    | `EmptyPayouts`   | Empty payout vec                      |
| 10   | `AlreadyClaimed` | Second `claim`                        |
| 11   | `NothingToClaim` | Winner not in payout list             |

#### Contract functions (arguments)

| Function                  | Arguments                                              | Returns       |
| ------------------------- | ------------------------------------------------------ | ------------- |
| `next_id`                 | —                                                      | `u64`         |
| `create_competition`      | `founder`, `token`, `amount`, `winners_count`, `title` | `u64` id      |
| `get_competition`         | `competition_id`                                       | `Competition` |
| `cancel_competition`      | `competition_id`                                       | `()`          |
| `finalize_competition`    | `competition_id`, `payouts: Vec<Payout>`               | `()`          |
| `finalize_and_distribute` | `competition_id`, `payouts: Vec<Payout>`               | `()`          |
| `claim`                   | `competition_id`, `winner`                             | `i128` amount |
| `escrow_balance`          | `competition_id`                                       | `i128`        |

Persistent storage keys: `NextId`, `Competition(u64)`, `Payouts(u64)`, `Claimed(u64, Address)`.

More detail: [`zaotrak_contract/README.md`](zaotrak_contract/README.md).

---

### Cross-layer mapping

| Platform / UI                           | Planned API                | On-chain contract                 |
| --------------------------------------- | -------------------------- | --------------------------------- |
| `Competition.title`                     | `title`                    | `title`                           |
| `Competition.prizePool`                 | `prize_pool`               | `prize_pool` (convert to stroops) |
| `Competition.winners`                   | `winners_count`            | `winners_count`                   |
| `Competition.founderWallet`             | `founder_wallet`           | `founder`                         |
| —                                       | `token_contract`           | `token`                           |
| —                                       | `on_chain_id`              | `competition_id` (u64)            |
| `Submission.*`                          | `submissions` table        | _(not stored)_                    |
| `LeaderboardEntry.pts`                  | derived from approved subs | _(not stored)_                    |
| `LeaderboardEntry.wallet` + prize split | `finalize` body            | `Payout.winner` + `Payout.amount` |
| `CreateCompetition.config.prize.amount` | `prize_pool`               | `amount` in `create_competition`  |
| `SubmissionStatus`                      | same enum                  | N/A                               |

**Amount conversion:** UI/API XLM (e.g. `500`) → on-chain `500_0000000` stroops (7 decimals).

**Leaderboard → payouts:** When the competition ends, map top N leaderboard rows to `Payout[]` (wallet + XLM share). Shares must sum to the full escrowed `prize_pool`.

---

## Key components

### Competition engine

Rules, schedule, instructions, proof requirements, rubric, winner splits.

### Submission workflow

Participants file claims; founders approve, reject, or request revision with notes.

### Leaderboard

Aggregates approved points per participant per competition.

### Escrow contract (Soroban)

Secures prize pool and executes winner payouts after finalization.

---

## Trust and fraud (pragmatic)

- Wallet-based identity (one wallet per participant per competition)
- Public submission history within a competition
- Founder reputation and escrow guarantees (pay if you finalize)
- Clear instructions reduce disputes; revision flow handles edge cases

Heavy automation (device fingerprinting, oracle attestation) is optional later — not required for the MVP model.

---

## Current status

| Area                           | Status                                            |
| ------------------------------ | ------------------------------------------------- |
| Founder / participant UI flows | Wired to `backend/` API + wallet                  |
| Submission review queue        | `PATCH /submissions/:id/review` + live reload       |
| Wallet connect                 | Freighter / SWK on testnet                        |
| Backend API                    | `backend/` — PostgreSQL + REST                    |
| Soroban escrow contract        | Deployed testnet; **create** + **finalize** in UI   |

---

## Vision

ZaoTrak turns growth into a **market**: founders fund prizes, operators compete with proof, and winners get paid from escrow. Verification lives where it already does — **the founder’s product and analytics** — while the platform makes competitions fair, structured, and on-chain where it matters (money).
