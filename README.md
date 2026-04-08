# Glurk Protocol

**The credit bureau for skills.** An on-chain credential protocol on Solana where apps must contribute data to read data, enforced at the program level rather than by terms of service.

Live: [glurk.slayerblade.site](https://glurk.slayerblade.site)

---

## What it is

Glurk is infrastructure with a product shell. Users do not need to think in protocol terms, but the repo now includes the issuer, auth, profile, and demo surfaces needed to make that infrastructure usable.

When an app wants to read a user's credentials, it must contribute something back in the same transaction. No contribution means no access. This is enforced on-chain by the Anchor program, not by policy or backend discretion.

Users own the underlying identity via wallet. The product also supports email-to-wallet linking so apps can discover a user's Glurk identity without forcing them to paste a wallet address into every onboarding flow.

**Program ID (devnet):** `5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ`

---

## Product surface

The current app is more than a single consent demo:

- `/` explains the protocol, live program, and current product vectors
- `/consent` is the core reciprocal access flow
- `/profile` shows the linked wallet identity, credentials, score, and consent state
- `/auth/signin` supports Google sign-in before wallet linking
- `/issuers` is the issuer-facing onboarding page
- `/demo/lend` and `/demo/jobs` are end-user demos that drive real protocol reads and writes
- `/connect/github` lets developers claim a GitHub Reputation credential
- `packages/sdk` is the TypeScript SDK (`@glurk-protocol/sdk` on npm)

---

## Protocol layers

### Credential Layer

Approved issuers write verified facts about users. Each credential is a PDA keyed by `[issuer, user, slug]`. Each credential also mints a Token-2022 NonTransferable SBT to the user's wallet.

Two live issuers:

**Staq** ([staq.slayerblade.site](https://staq.slayerblade.site)) — Financial literacy app for Indian Gen Z. Issues credentials on module completion:
- `credit-score`, `stocks`, `upi`, `sell-rules`

**GitHub Reputation** ([/connect/github](/connect/github)) — Developer credentials from public GitHub activity:
- `github-reputation` — repos, stars, followers, contributions → tier + score

### Access Layer

Reciprocal read/write enforcement. The `request_access` instruction:

1. Writes the app's data contribution as a credential PDA
2. Creates a consent PDA keyed by user and requester
3. Requires the user's wallet to co-sign

Both happen atomically. If the contribution fails, the access fails.

### Intelligence Layer

Glurk Score (0 to 1000) is derived from all credentials across all issuers, weighted by tier and score. It gets richer as more apps contribute data.

### Identity Layer

Google sign-in plus wallet linking gives apps a smoother lookup path. Session-backed routes can resolve a user's linked wallet, while the underlying credentials and score remain wallet-native.

---

## Program instructions

| Instruction | Description |
|---|---|
| `register_issuer` | Register an app as a credential issuer |
| `register_credential` | Issue a credential to a user (issuer signs) |
| `request_access` | Request read access and contribute data in the same flow |
| `revoke_access` | Revoke a previously granted consent |
| `deactivate_issuer` | Deactivate an issuer |

---

## Reading credentials

Credential PDAs are derived deterministically, so any app can read them with just the program ID:

```typescript
const [credentialPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("credential"),
    issuerPublicKey.toBuffer(),
    userPublicKey.toBuffer(),
    Buffer.from("credit-score"),
  ],
  GLURK_PROGRAM_ID
);

const account = await connection.getAccountInfo(credentialPda);
// Deserialize with the IDL to get { tier, score, timestamp }
```

Or use the published SDK:

```bash
npm install @glurk-protocol/sdk
```

```typescript
import { getProfile, verifyCredential, KNOWN_ISSUERS } from "@glurk-protocol/sdk";

const { credentials, glurkScore } = await getProfile(connection, userWallet);
const cred = await verifyCredential(connection, KNOWN_ISSUERS.STAQ, userWallet, "credit-score");
```

---

## Requesting access

```typescript
await program.methods
  .requestAccess(
    "trading-history",
    "gold",
    85
  )
  .accounts({
    requesterAuthority: requesterKeypair.publicKey,
    user: userWallet,
    requesterIssuer: issuerPda,
    contributionAccount: contributionPda,
    consentAccount: consentPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
// contribution written + consent PDA created atomically
```

---

## Solana Actions / Blinks

Glurk supports [Solana Actions](https://solana.com/docs/advanced/actions), so users can approve credential access directly from X without leaving the tweet.

Action endpoint: `GET/POST /api/actions/consent`

Try it: [dial.to](https://dial.to/?action=solana-action:https://glurk.slayerblade.site/api/actions/consent?app=StaqLend&contribute_slug=trading-history&contribute_tier=gold&contribute_score=80)

---

## Identity linking

Glurk supports a lightweight identity bridge for app onboarding:

- Google and GitHub auth via NextAuth
- Wallet linking persisted in Supabase (`identity_links`)
- Auto-linking on credential issuance (issuers pass user email)
- Profile and session endpoints that resolve the current linked wallet

This is an onboarding convenience layer, not a replacement for wallet ownership. Credentials, consent records, and derived score still anchor to the wallet.

---

## Live demos

Both demos run a real on-chain `request_access` transaction through Phantom:

- **StaqLend** (`/demo/lend`) — DeFi app that reduces collateral requirements based on verified financial knowledge
- **StaqJobs** (`/demo/jobs`) — Hiring app that matches candidates to roles using verified credentials

Credentials come from real issuer integrations (Staq module completion, GitHub OAuth).

---

## IDL

The full IDL is at [`app/idl.json`](app/idl.json).

---

## Environment variables

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STAQ_AUTHORITY_SECRET_KEY=       # Staq issuer authority (base58)
GITHUB_ISSUER_SECRET_KEY=        # GitHub issuer authority (base58)
REGISTER_ISSUER_SECRET=          # Shared secret for admin endpoints
```

---

## Hackathon

Built for [Solana Frontier](https://www.colosseum.org/frontier) — Infrastructure track.
