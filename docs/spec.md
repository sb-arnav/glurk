# Glurk — Spec v3 (Reciprocal Data Exchange)

## Vision

A reciprocal data mesh on Solana. Apps must contribute user data to access user data. Users control everything via wallet consent.

---

## Core Concept

```
App wants to READ user's credentials
  → App must WRITE something about the user in the same transaction
  → User must SIGN the transaction (consent)
  → Only then does the read succeed
```

Every app that reads makes the user's profile richer for the next app.

---

## Architecture Layers

| Layer | What | Status |
|-------|------|--------|
| Credential Layer | Issuers write verified facts about users | Built + live |
| Access Layer | Consent + reciprocal read/write | Hackathon MVP |
| Intelligence Layer | Glurk Score, cross-app reputation | Demo |

---

## Anchor Program Instructions

### From v2 (unchanged)

**1. `register_issuer(issuer: Pubkey, name: String)`**
- Called by protocol admin only
- PDA: `["issuer", issuer.key()]`
- Stores: issuer pubkey, name, registered_at, active: bool

**2. `register_credential(slug: String, tier: String, score: u8, mint_address: Pubkey)`**
- Caller must be a registered issuer
- PDA: `["credential", issuer.key(), user.key(), slug.as_bytes()]`
- Stores: issuer, user, slug, tier, score, mint_address, timestamp

**3. `deactivate_issuer(issuer: Pubkey)`**
- Protocol admin only. Sets active: false.

**4. `stake(module_slug: String, amount: u64)`**
- User locks Flux into PDA escrow
- PDA: `["stake", staker.key(), module_slug.as_bytes()]`

**5. `resolve_pass(module_slug: String)` / `resolve_fail(module_slug: String)`**
- Authority only. Returns or burns Flux.

### New in v3

**6. `request_access(fields_requested: Vec<String>, data_contribution: DataContribution)`**

The key new instruction. When an app wants to read a user's credentials:

```
Accounts:
  requester     (signer) — the app requesting access
  user          (signer) — the user consenting
  issuer_pda    — proves requester is a registered issuer
  consent_pda   — created/updated by this instruction
  contribution_pda — stores the data the requester writes back

Params:
  fields_requested: Vec<String>  — which credential slugs to access
  data_contribution: DataContribution {
    slug: String,       — what the requester is contributing (e.g. "trading-history")
    tier: String,       — quality tier of the contribution
    score: u8,          — optional score
    data_hash: [u8; 32] — hash of off-chain data (for larger payloads)
  }
```

Logic:
1. Check requester is a registered, active issuer
2. Check user is a signer (consent)
3. Write the `data_contribution` as a new credential PDA (requester is the issuer)
4. Create/update `consent_record` PDA
5. Return success — client-side SDK can now read the requested credential PDAs

PDA for consent: `["consent", user.key(), requester.key()]`

**7. `revoke_access(requester: Pubkey)`**
- User-only. Closes the consent_record PDA.
- Doesn't delete existing credentials (they're permanent) but prevents future reads through the protocol's access layer.

---

## Consent Record

```rust
#[account]
pub struct ConsentRecord {
    pub user: Pubkey,
    pub requester: Pubkey,
    pub fields_granted: Vec<String>,
    pub granted_at: i64,
    pub active: bool,
}
```

PDA: `["consent", user.key(), requester.key()]`

---

## How Read-to-Write is Enforced

The `request_access` instruction requires BOTH:
- `data_contribution` parameter (the write)
- User signer (the consent)

If the app calls `request_access` without a valid contribution, the instruction fails. This is program-level enforcement — not a pinky promise.

After `request_access` succeeds, the app's backend can read the credential PDAs directly (they're public on-chain). The consent record proves the user approved it.

---

## SDK Flow

```js
import { Glurk } from '@glurk/sdk';

const glurk = new Glurk(connection, program);

// App requests access to a user's credentials
// Must provide a data contribution in the same call
const consent = await glurk.requestAccess({
  user: userWallet,
  fieldsRequested: ['credit-score', 'stocks'],
  contribution: {
    slug: 'trading-history',
    tier: 'gold',
    score: 85,
    dataHash: hashOfOffChainData,
  },
});

// Now read the credentials
const creditScore = await glurk.verify(STAQ_ISSUER, userWallet, 'credit-score');
const tradingHistory = await glurk.verify(DEFI_APP, userWallet, 'trading-history');

// Get combined Glurk Score
const score = await glurk.getScore(userWallet);
```

---

## Glurk Score

Reputation number (0-1000) derived from ALL credentials across ALL issuers.

```
Score = sum of (tierWeight × scoreWeight) for each credential
  platinum = 100, gold = 75, silver = 50, bronze = 25
  scoreWeight = credential.score / 100
  Capped at 1000
```

Calculated client-side by reading all credential PDAs for a wallet.

---

## Key Addresses (Devnet)

- **Flux Mint:** `GEjTzMRTUHnfPB8z8VKka79XQqEmFB7FeSRcjonQ8huG`
- **Staq Authority:** `BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT`
- **Protocol Program:** TBD (Federico deploys)

---

## Deliverables

### Phase 1 — Core (in progress):
- [x] Staking escrow (stake, resolve_pass, resolve_fail)
- [x] Issuer registry (register_issuer, deactivate_issuer)
- [x] Credential registration (register_credential)
- [ ] Deploy to devnet + share Program ID and IDL

### Phase 2 — Access Layer:
- [ ] `request_access` instruction with reciprocal write enforcement
- [ ] `consent_record` PDA
- [ ] `revoke_access` instruction
- [ ] Updated IDL for SDK integration

### Phase 3 — Polish:
- [ ] Edge cases, testing, mainnet readiness
- [ ] Demo script for pitch video
