# ZaoTrak Soroban contracts

Stellar smart contracts for [ZaoTrak](../README.md) competition prize escrow.

Full cross-layer field mapping (frontend, planned API, on-chain): see [Data model](../README.md#data-model) in the root README.

## `zaotrak-escrow`

Escrows a SEP-41 token per competition. ZaoTrak defaults to **native XLM** (Stellar Asset Contract) on testnet. Scoring and submission review stay **off-chain**; the founder submits the final payout list after review.

### Lifecycle

| Step | Function | Who |
|------|----------|-----|
| 1 | `create_competition` | Founder deposits prize pool into contract |
| 2 | *(off-chain)* | Participants submit proof; founder reviews |
| 3a | `finalize_competition` + `claim` | Founder sets payouts; winners claim |
| 3b | `finalize_and_distribute` | Founder sets payouts; contract pays all winners in one tx |
| — | `cancel_competition` | Founder refunds escrow while competition is active |

### Invariants

- Only the **founder** can finalize, cancel, or set payouts.
- Payout amounts must **sum exactly** to `prize_pool`.
- At most **`winners_count`** payout rows.
- Each winner can `claim` only once.

### Storage types

#### `Competition`

| Field | Type | Description |
|-------|------|-------------|
| `founder` | `Address` | Competition host |
| `token` | `Address` | SEP-41 token (native XLM SAC by default) |
| `prize_pool` | `i128` | Escrowed balance (smallest units) |
| `winners_count` | `u32` | Max rows in finalize `payouts` |
| `status` | `CompetitionStatus` | `Active` \| `Finalized` \| `Cancelled` |
| `title` | `String` | Short title |

#### `Payout`

| Field | Type | Description |
|-------|------|-------------|
| `winner` | `Address` | Payout recipient |
| `amount` | `i128` | Payout amount (smallest units) |

#### `CompetitionStatus`

`Active` · `Finalized` · `Cancelled`

#### `Error` (selected)

| Code | Variant | Typical cause |
|------|---------|----------------|
| 1 | `NotFound` | Invalid `competition_id` |
| 6 | `PayoutMismatch` | Payouts do not sum to `prize_pool` |
| 7 | `TooManyWinners` | `payouts.len() > winners_count` |
| 10 | `AlreadyClaimed` | Repeat `claim` |

### Build & test

```bash
cd contracts/zaotrak-escrow
cargo test
```

Covers escrow creation, cancel/refund, finalize + distribute, independent claims, payout validation (sum, empty, too many winners), and invalid state transitions.

Requires [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/stellar-cli) for WASM builds (`stellar contract build`).

### Deployed (testnet)

| | |
|---|---|
| **Contract ID** | `CC44LWA7OK6BIOHWZPZ2ES22UT4POT6KHDYU22FCVY3IXGGTGBXFBFP5` |
| **WASM hash** | `160251d024f689f35be3d9d4afe9aceea583fbaf7fe7c7aa7292b7fc6da8dc3d` |
| **Explorer** | [Stellar Lab](https://lab.stellar.org/r/testnet/contract/CC44LWA7OK6BIOHWZPZ2ES22UT4POT6KHDYU22FCVY3IXGGTGBXFBFP5) |

Default **native XLM** SAC on testnet: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`

Frontend (`VITE_ESCROW_CONTRACT_ID`) and backend (`ESCROW_CONTRACT_ID`) use this address by default.

### Deploy (testnet)

```bash
stellar contract build
stellar contract deploy \
  --wasm target/wasm32v1-none/release/zaotrak_escrow.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet
```

### Example invocation

```bash
# Create competition (founder must sign; approves token transfer)
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <FOUNDER_KEY> \
  --network testnet \
  -- \
  create_competition \
  --founder <FOUNDER_ADDRESS> \
  --token CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC \
  --amount 500000000 \
  --winners_count 3 \
  --title "SaaS user acquisition"

# After off-chain review — distribute (founder signs)
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <FOUNDER_KEY> \
  --network testnet \
  -- \
  finalize_and_distribute \
  --competition_id 0 \
  --payouts '[{"winner":"<ADDR1>","amount":250000000},{"winner":"<ADDR2>","amount":250000000}]'
```

Token amounts use the token’s smallest unit (7 decimals for native XLM stroops).

## Workspace layout

```text
contracts/
  hello-world/      # Soroban template (unused)
  zaotrak-escrow/   # Competition escrow — use this
```

## Frontend integration (planned)

1. `create_competition` when founder confirms escrow on `/create`.
2. Store returned `competition_id` in your API next to the off-chain competition record.
3. After review on `/review`, call `finalize_and_distribute` with approved wallet addresses and prize splits.
