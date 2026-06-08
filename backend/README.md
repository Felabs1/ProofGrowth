# ZaoTrak backend

Off-chain API for competitions, submissions, founder review, and derived leaderboards. Data is stored in **PostgreSQL**.

On-chain escrow is invoked from the **frontend** (wallet-signed). `POST /competitions/:id/finalize` marks the competition `ended` after the client has run `finalize_and_distribute`.

## What lives here vs on-chain

| Data | PostgreSQL | Soroban `zaotrak-escrow` |
|------|------------|---------------------------|
| Instructions, rubric, proof rules | `competitions` (JSONB) | — |
| Submissions, review, points | `submissions` | — |
| Joined participants | `participations` | — |
| Leaderboard ranks | **computed** from approved submissions | — |
| Prize pool, founder, winners, title | `competitions` | `create_competition` |
| Link to escrow | `on_chain_id` | `competition_id` (u64) |
| Final XLM payouts | finalize request body | `Payout[]` |

## Quick start

**1. Start Postgres**

```bash
cd backend
cp .env.example .env
docker compose up -d
```

**2. Install and run API**

```bash
npm install
npm run dev
```

Server: `http://localhost:3001` — tables are created on startup. The database starts **empty** (no demo seed).

**Clear all platform data** (keeps Docker volume):

```bash
npm run db:clear
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | _(required)_ | e.g. `postgresql://zaotrak:zaotrak@localhost:5432/zaotrak` |
| `PORT` | `3001` | HTTP port |
| `GROQ_API_KEY` | — | Optional; Groq LLM for `/ai/suggest-competition-field` (checked before OpenAI) |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model slug |
| `OPENAI_API_KEY` | — | Optional; OpenAI fallback for suggestions |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model |

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness + DB ping |
| GET | `/competitions` | List (camelCase JSON, stats + leaderboard) |
| GET | `/competitions/:id` | Detail |
| POST | `/competitions` | Create competition |
| POST | `/competitions/:id/join` | `{ participant_wallet, participant_name? }` |
| POST | `/competitions/:id/submissions` | New proof submission |
| GET | `/competitions/:id/submissions` | `?tab=pending\|approved`, `?status=`, `?wallet=` |
| GET | `/submissions` | Founder queue: `?founderWallet=&competitionId=&tab=` |
| PATCH | `/submissions/:id/review` | `{ founder_wallet, status, points_awarded?, founder_note? }` |
| GET | `/participants/:wallet/submissions` | Participant dashboard |
| GET | `/participants/:wallet/competitions` | Joined competition ids |
| GET | `/leaderboard/global` | Global rankings |
| POST | `/competitions/:id/finalize` | `{ founder_wallet, payouts, finalize_tx_hash? }` — marks ended after on-chain payout |
| POST | `/competitions/:id/cancel` | `{ founder_wallet, cancel_tx_hash? }` — marks cancelled after on-chain refund |
| POST | `/ai/suggest-competition-field` | AI/template suggestions for Create Competition copy (optional `GROQ_API_KEY` or `OPENAI_API_KEY`) |

## Wiring the frontend

Set `VITE_API_URL=http://localhost:3001` in `frontend/.env` and run `npm run dev` in `frontend/`.
