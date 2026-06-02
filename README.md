# ProofGrowth

ProofGrowth is a competitive growth marketplace where startups sponsor growth competitions, and participants compete to deliver the highest-quality, verifiable user adoption.

Instead of paying for clicks or low-quality signups, founders fund prize pools, define scoring rules, and let participants compete to generate real traction. Smart contracts on Stellar (Soroban) handle escrow and prize distribution.

---

# Problem

Early-stage startups struggle to acquire meaningful users:

- Ads bring low-intent traffic
- Signup incentives attract bots or low-quality users
- Growth hacks rarely produce retention
- Founders cannot measure real activation quality

ProofGrowth replaces guesswork with competitive, verifiable growth outcomes.

---

# Core Idea

Founders do not buy users.

They launch a growth competition:

- Define desired user behaviors
- Deposit a prize pool into escrow
- Participants compete to generate the highest score
- Winners receive payouts automatically

---

# How It Works

## 1. Founder Creates a Competition

The founder defines:

- Objective (e.g. acquire active users)
- Prize pool (e.g. 500 USDC)
- Duration (e.g. 14 days)
- Scoring rules
- Verification criteria
- Winner structure (Top 1–5 winners)

Example:

Title: Acquire Active Users for SaaS  
Prize Pool: 500 USDC

Winners:

- 1st: 200 USDC
- 2nd: 125 USDC
- 3rd: 75 USDC
- 4th: 50 USDC
- 5th: 50 USDC

Scoring:

- Signup: 1 point
- Onboarding completed: 5 points
- First core action: 10 points
- Return after 24h: 20 points
- Paid conversion: 50 points

---

## 2. Participants Compete

Participants:

- Connect wallet
- Join competition
- Perform user acquisition actions
- Build leaderboard score
- Compete in real time

---

## 3. Verification of Actions

Startups integrate a verification SDK that emits events:

Example events:

{
"event": "signup",
"user_id": "123"
}

{
"event": "completed_onboarding",
"user_id": "123"
}

{
"event": "created_project",
"user_id": "123"
}

These are sent to the verification system.

---

## 4. Scoring Engine

Verified actions are converted into points:

Signup = 1 point  
Onboarding = 5 points  
Core action = 10 points  
Retention (24h return) = 20 points  
Conversion = 50 points

Each participant accumulates a live score.

---

## 5. Leaderboard

Real-time rankings:

1. Alice — 832 pts
2. Bob — 790 pts
3. Felix — 721 pts
4. Diana — 690 pts
5. Eric — 640 pts

---

## 6. Oracle + Smart Contracts

Since app data is off-chain:

- Verification engine validates events
- Oracle submits signed attestations
- Soroban contract updates scores
- Final leaderboard is locked at end

---

## 7. Prize Distribution

At the end of the competition:

- Final scores are frozen
- Winners are selected
- Smart contract distributes USDC automatically

No manual payout logic required.

---

# System Architecture

+------------------------+
| Founder Dashboard |
+------------------------+
|
v
+------------------------+
| Competition Service |
| - Rules |
| - Prize Pool |
+------------------------+
|
v
+------------------------+
| Soroban Smart Contract |
| - Escrow |
| - Scoring |
| - Payouts |
+------------------------+
^
|
+------------------------+
| Oracle / Verification |
| Engine |
+------------------------+
^
|
+------------------------+
| Event Stream |
+------------------------+
^
|
+------------------------+
| Startup App |
+------------------------+
^
|
+------------------------+
| Participants |
+------------------------+

---

# Key Components

## Competition Engine

Defines rules, scoring, duration, and payouts.

## Verification Engine

Validates that user actions are real and not fake.

## Scoring Engine

Turns verified actions into competitive points.

## Leaderboard System

Maintains live rankings.

## Escrow Contract

Holds funds and distributes rewards.

---

# Fraud Prevention

- Wallet-based identity
- Device fingerprinting
- Rate limits
- Reputation scoring
- Retention requirements

---

# Reputation System

Participants:

- Wins
- Users acquired
- Retention rate
- Fraud flags

Founders:

- Fairness of rules
- Payment history
- Competition quality

---

# Vision

ProofGrowth creates competitive growth markets where startups sponsor user acquisition competitions, and participants compete to deliver verified adoption. Rewards are distributed automatically based on measurable impact.
