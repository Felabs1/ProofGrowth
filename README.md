# SeedSignal

A decentralized marketplace where founders acquire verified early users through escrow-backed growth campaigns.

## Problem

Founders often struggle to attract their first active users. Traditional advertising is expensive, difficult to measure, and frequently produces low-quality traffic.

SeedSignal enables founders to pay only for verified engagement rather than clicks, impressions, or unqualified signups.

---

## How It Works

### 1. Founder Creates Campaign

A founder defines:

- Number of users needed
- Required actions
- Verification criteria
- Reward amount
- Campaign duration

Example:

**Campaign:** Acquire 13 active users

Requirements:

- Sign up
- Complete onboarding
- Create a project
- Return after 24 hours
- Use Feature X

Reward Pool:

- 130 USDC

Payout:

- 10 USDC per verified user

---

### 2. Funds Enter Escrow

The founder deposits funds into a Soroban smart contract.

The contract:

- Locks campaign funds
- Tracks campaign progress
- Releases rewards automatically
- Returns unused funds when campaign ends

---

### 3. Users Join Campaign

Participants browse available campaigns.

To participate:

1. Connect wallet
2. Accept campaign requirements
3. Use the startup product
4. Complete required actions

---

### 4. Verification

The startup integrates a verification SDK.

The SDK emits events such as:

```json
{
  "event": "user_signed_up",
  "user": "123"
}
```

```json
{
  "event": "completed_onboarding",
  "user": "123"
}
```

```json
{
  "event": "created_project",
  "user": "123"
}
```

These events are sent to the verification engine.

---

### 5. Oracle Validation

Since Soroban cannot directly access application data, an oracle layer validates user actions.

Responsibilities:

- Verify event authenticity
- Confirm campaign requirements
- Submit attestations to smart contracts

Example:

```json
{
  "campaign_id": "campaign_42",
  "user": "wallet_address",
  "verified": true
}
```

---

### 6. Reward Distribution

When requirements are met:

1. Oracle submits verification
2. Smart contract validates proof
3. Reward is released automatically

Example:

```text
Founder Deposit
      ↓
User Completes Tasks
      ↓
Oracle Verification
      ↓
Smart Contract Release
      ↓
Participant Paid
```

---

## Architecture

```text
+----------------------+
| Founder Dashboard    |
+----------+-----------+
           |
           v
+----------------------+
| Campaign Service     |
+----------+-----------+
           |
           v
+----------------------+
| Soroban Escrow       |
| Smart Contract       |
+----------+-----------+
           ^
           |
+----------+-----------+
| Oracle Verification  |
+----------+-----------+
           ^
           |
+----------+-----------+
| Event Processing     |
+----------+-----------+
           ^
           |
+----------+-----------+
| Startup Application  |
+----------------------+

           ^
           |
+----------+-----------+
| Participants         |
+----------------------+
```

---

## Core Components

### Founder Dashboard

Allows founders to:

- Create campaigns
- Deposit funds
- Define requirements
- Track progress
- Review analytics

---

### Participant Dashboard

Allows users to:

- Browse campaigns
- Join campaigns
- Track completion status
- Claim rewards
- Build reputation

---

### Escrow Contract

Handles:

- Fund custody
- Reward distribution
- Campaign lifecycle management
- Refunds

---

### Verification Engine

Handles:

- Event ingestion
- Rule evaluation
- Fraud detection
- Completion scoring

---

### Oracle Layer

Bridges:

- Startup application data
- Blockchain smart contracts

---

## Fraud Prevention

### Sybil Resistance

- Wallet identity
- Device fingerprinting
- Rate limiting
- Reputation scoring

### Quality Verification

Campaigns may require:

- Multiple actions
- Multi-day retention
- Feedback submission
- Feature usage thresholds

### Delayed Rewards

Rewards can be released after:

- 24 hours
- 3 days
- 7 days

This discourages low-quality signups.

---

## Reputation System

### Founder Reputation

Based on:

- Successful campaigns
- Payment history
- User feedback

### Participant Reputation

Based on:

- Verified completions
- Retention quality
- Fraud reports
- Campaign success rate

---

## Future Features

- Referral campaigns
- AI-generated user feedback analysis
- On-chain reputation credentials
- Multi-stage growth campaigns
- Community verification
- Analytics dashboards
- Startup leaderboards

---

## Tech Stack

### Frontend

- Next.js
- React
- Tailwind CSS

### Backend

- Node.js
- PostgreSQL
- Redis

### Blockchain

- Stellar
- Soroban
- USDC

### Infrastructure

- Kafka / NATS
- Verification Service
- Oracle Service

---

## Vision

SeedSignal transforms user acquisition into a verifiable marketplace where founders pay for measurable engagement rather than speculative advertising, and users are rewarded for providing genuine product validation.
