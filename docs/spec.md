# Glurk — Spec v3.5 (Reciprocal Data Exchange + Identity Linking)

## Vision

A reciprocal data mesh on Solana. Apps must contribute user data to access user data. Users control the underlying identity with wallet consent, while product surfaces can use linked accounts to make discovery and onboarding easier.

---

## Core Concept

```text
App wants to READ user's credentials
  -> App must WRITE something about the user in the same transaction
  -> User must SIGN the transaction (consent)
  -> Only then does the read succeed
```

Every app that reads makes the user's profile richer for the next app.

---

## Architecture Layers

| Layer | What | Status |
|-------|------|--------|
| Credential Layer | Issuers write verified facts about users | Built + live |
| Access Layer | Consent + reciprocal read/write | Built on devnet |
| Intelligence Layer | Glurk Score, cross-app reputation | Built client-side |
| Identity Layer | Google auth + wallet linking + lookup | Built in app layer |

---

## Anchor Program Instructions

### Core protocol

**1. `register_issuer(issuer: Pubkey, name: String)`**
- Called by protocol admin only
- PDA: `["issuer", issuer.key()]`
- Stores: issuer pubkey, name, registered_at, active: bool

**2. `register_credential(slug: String, tier: String, score: u8, mint_address: Pubkey)`**
- Caller must be a registered issuer
- PDA: `["credential", issuer.key(), user.key(), slug.as_bytes()]`
- Stores: issuer, user, slug, tier, score, mint_address, timestamp

**3. `deactivate_issuer(issuer: Pubkey)`**
- Protocol admin only
- Sets `active = false`

**4. `request_access(contribution_slug: String, contribution_tier: String, contribution_score: u8)`**

When an app wants to read a user's credentials:

```text
Accounts:
  requester_authority  (signer) - the issuer app requesting access
  user                 (signer) - the user consenting
  requester_issuer     - proves requester is a registered issuer
  contribution_account - stores the data the requester writes back
  consent_account      - stores user approval for this requester

Params:
  contribution_slug: String
  contribution_tier: String
  contribution_score: u8
```

Logic:
1. Check requester is a registered, active issuer
2. Check user is a signer
3. Write the contribution as a new credential PDA where requester becomes the issuer
4. Create the consent PDA
5. Return success so client code can read the requested credential PDAs

PDA for consent: `["consent", user.key(), requester.key()]`

**5. `revoke_access(requester: Pubkey)`**
- User-only
- Closes the consent PDA for the requester
- Does not delete previously written credentials

---

## Consent Record

```rust
#[account]
pub struct ConsentRecord {
    pub user: Pubkey,
    pub requester: Pubkey,
    pub granted_at: i64,
    pub active: bool,
}
```

PDA: `["consent", user.key(), requester.key()]`

---

## How Read-to-Write Is Enforced

The `request_access` instruction requires both:

- a contribution payload to write
- a user signature to authorize the reciprocal exchange

If the app calls `request_access` without a valid contribution, the instruction fails. This is program-level enforcement rather than policy-based access control.

After `request_access` succeeds, the app backend or SDK can read the credential PDAs directly because they are public on-chain. The consent record proves the user approved the reciprocal exchange.

---

## SDK Flow

```ts
import { GlurkClient } from "@glurk/sdk";

const glurk = new GlurkClient("https://api.devnet.solana.com");

const creditScore = await glurk.getCredential(
  STAQ_ISSUER,
  userWallet,
  "credit-score"
);

const score = await glurk.getGlurkScore(userWallet);
const consents = await glurk.getConsents(userWallet);
```

Transaction-building for `request_access` still happens in the app layer today, including the consent page, demo routes, and Solana Action endpoint.

---

## Glurk Score

Reputation number from 0 to 1000 derived from all credentials across all issuers.

```text
Score = sum of (tierWeight x scoreWeight) for each credential
  platinum = 100, gold = 75, silver = 50, bronze = 25
  scoreWeight = credential.score / 100
  capped at 1000
```

Calculated client-side or in API helpers by reading credential PDAs for a wallet.

---

## App-Layer Identity Bridge

The on-chain protocol remains wallet-native, but the app layer now supports:

- Google session auth
- wallet linking stored in Supabase
- session-backed profile resolution
- public email-to-wallet lookup for smoother onboarding

This is intentionally outside the core program. It improves product usability without changing the custody or consent model.

---

## Key Addresses (Devnet)

- **Staq Authority:** `BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT`
- **Protocol Program:** `5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ`

---

## Deliverables

### Phase 1 — Core
- [x] Issuer registry (`register_issuer`, `deactivate_issuer`)
- [x] Credential registration (`register_credential`)
- [x] Deployed devnet program and shared IDL

### Phase 2 — Access Layer
- [x] `request_access` instruction with reciprocal write enforcement
- [x] consent PDA
- [x] `revoke_access` instruction
- [x] app integration against the current IDL

### Phase 3 — Product Layer
- [x] consumer demos for lending and jobs
- [x] Solana Actions/Blinks endpoint
- [x] identity linking via auth and wallet connection
- [ ] shared protocol logic consolidation between app routes and SDK
- [ ] mainnet readiness and deeper testing
