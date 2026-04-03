# Glurk Protocol — Technical Spec

## For: Federico Alvarez (Anchor Program Development)
## Date: March 31, 2026

---

## Overview

Staq is a live financial literacy app for Indian Gen Z. The Reputation Protocol adds on-chain credentials via Solana — users earn verifiable, non-transferable SBTs (Soulbound Tokens) by completing learning modules.

**Live app:** https://staq.slayerblade.site
**Hackathon:** Solana Frontier (Colosseum), April 6 – May 11, 2026

---

## Current Architecture (JS SDK — already working)

Everything below is live in production today:

| Component | Implementation | Status |
|-----------|---------------|--------|
| Flux token | Token-2022 with MetadataPointer + Metadata | Deployed on devnet |
| SBT credentials | Token-2022 NonTransferable + MetadataPointer + Metadata | Minting from API routes |
| Wallets | Server-generated keypairs, encrypted in Supabase | Working |
| Staking | Database-driven (Supabase) | Working |
| Staq ID page | Shows credentials + Solana Explorer links | Working |

### Key Addresses (Devnet)

- **Flux Mint:** `GEjTzMRTUHnfPB8z8VKka79XQqEmFB7FeSRcjonQ8huG`
- **Staq Authority:** `BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT`
- **Network:** Solana Devnet

### Credential Structure (On-Chain Metadata)

Each SBT has these fields stored on-chain via Token-2022 metadata extension:

```
name: "Staq: {Module Name}"
symbol: "STAQID"
uri: "https://staq.slayerblade.site/api/credentials/metadata/{slug}"
additional_metadata:
  module: "{slug}"
  tier: "bronze|silver|gold|platinum"
  score: "{0-100}"
  earned_at: "{ISO timestamp}"
  protocol: "staq-reputation-v1"
```

### Tier Thresholds

| Score | Tier |
|-------|------|
| 90-100 | Platinum |
| 75-89 | Gold |
| 60-74 | Silver |
| 0-59 | Bronze (fail — no credential on current JS implementation) |

---

## What You're Building (Anchor Program)

### Program 1: Staking Escrow

**Purpose:** On-chain staking of Flux tokens before a module attempt.

**Accounts:**
- `staker` (signer) — the user's wallet
- `stake_vault` (PDA) — holds the locked Flux, seeded by `[b"stake", staker.key, module_slug]`
- `flux_mint` — the Flux Token-2022 mint
- `staker_flux_ata` — user's Flux token account
- `authority` — Staq Authority (can resolve stakes)

**Instructions:**

1. `stake(module_slug: String, amount: u64)`
   - Transfers `amount` Flux from staker's ATA to the stake_vault PDA
   - Stores metadata: staker, module_slug, amount, timestamp
   - PDA seed: `["stake", staker.key(), module_slug.as_bytes()]`

2. `resolve_pass(module_slug: String)`
   - Called by Staq Authority only
   - Returns Flux from stake_vault back to staker's ATA
   - Closes the stake account

3. `resolve_fail(module_slug: String)`
   - Called by Staq Authority only
   - Burns the Flux in the stake_vault
   - Closes the stake account

**Important:** Flux is a Token-2022 token (not regular SPL Token). Use `anchor_spl::token_2022` or the Token-2022 program ID.

### Program 2: Credential Verification

**Purpose:** Allow any Solana program to verify a user's Staq credentials.

**Accounts:**
- `credential_registry` (PDA) — seeded by `[b"credential", user.key, module_slug]`
- `authority` — Staq Authority (only writer)

**Instructions:**

1. `register_credential(user: Pubkey, module_slug: String, tier: String, score: u8, mint_address: Pubkey)`
   - Called by Staq Authority after SBT is minted
   - Stores credential data in a PDA that anyone can read
   - PDA seed: `["credential", user.key(), module_slug.as_bytes()]`

2. `verify_credential(user: Pubkey, module_slug: String)` (view function / account lookup)
   - Any program can derive the PDA and check if the account exists + read the tier/score
   - No instruction needed — just PDA derivation + account deserialization

---

## Integration Points

Once the Anchor program is deployed, we integrate by:

1. **Staking:** Frontend calls our API → API calls your program via `@coral-xyz/anchor` JS client
2. **Credential registration:** After SBT mint, our API calls `register_credential` on your program
3. **Verification:** Any external program derives the PDA and reads the account

The existing JS-based minting (Token-2022 SBTs) stays as-is. Your program adds the staking escrow and the verification layer on top.

---

## Stack Reference

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React, Tailwind v4 |
| Backend | Next.js API Routes (Vercel serverless) |
| Database | Supabase (PostgreSQL) |
| Auth | NextAuth (Google OAuth) |
| Solana (current) | `@solana/web3.js`, `@solana/spl-token`, `@solana/spl-token-metadata` |
| Solana (your part) | Anchor Framework |
| Deployment | Vercel (frontend), Solana Devnet → Mainnet |

---

## Deliverables

### By April 8:
- [ ] Anchor program compiled and deployed on devnet
- [ ] `stake` instruction working with Flux Token-2022
- [ ] `resolve_pass` and `resolve_fail` working
- [ ] Test script or client that demonstrates the full flow
- [ ] Program ID shared

### By April 15:
- [ ] Credential verification program deployed
- [ ] `register_credential` instruction working
- [ ] Integration with Staq API routes
- [ ] Basic test coverage

### By May 4 (one week before submission):
- [ ] Mainnet deployment (if we decide to go mainnet)
- [ ] Edge case handling
- [ ] Demo script for the pitch video

---

## Questions?

Ping me anytime. I'm usually online 12 PM – 3 AM IST.
