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
- `packages/sdk` contains the JavaScript SDK used to read credentials and derive score data

---

## Protocol layers

### Credential Layer

Approved issuers write verified facts about users. Each credential is a PDA keyed by `[issuer, user, slug]`. Each credential also mints a Token-2022 NonTransferable SBT to the user's wallet.

**Staq** ([staq.slayerblade.site](https://staq.slayerblade.site)) is the first live issuer, a financial literacy app with real Indian Gen Z users. Credentials issued:

- `credit-score` — Credit Score Basics (Gold)
- `stocks` — Stock Market Basics (Gold)
- `upi` — UPI Payments (Platinum)
- `sell-rules` — Sell Rules (Gold)

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

Or use the local SDK in this repo:

```typescript
import { GlurkClient } from "@glurk/sdk";

const client = new GlurkClient("https://api.devnet.solana.com");
const credential = await client.getCredential(staqIssuer, userWallet, "credit-score");
const score = await client.getGlurkScore(userWallet);
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

- Google auth via NextAuth
- wallet linking persisted in Supabase
- profile and session endpoints that resolve the current linked wallet
- public email lookup for apps that need a user-friendly discovery path

This is an onboarding convenience layer, not a replacement for wallet ownership. Credentials, consent records, and derived score still anchor to the wallet.

---

## Live demos

Both demos run a real on-chain `request_access` transaction through Phantom:

- **StaqLend** (`/demo/lend`) — DeFi app that reduces collateral requirements based on verified financial knowledge
- **StaqJobs** (`/demo/jobs`) — Hiring app that matches candidates to roles using verified credentials

If your wallet has no Staq credentials on devnet, the demo page offers to seed four credentials with real Token-2022 SBTs and Anchor PDAs.

---

## IDL

The full IDL is at [`app/idl.json`](app/idl.json).

---

## Environment variables

```bash
GOOGLE_CLIENT_ID=<google oauth client id>
GOOGLE_CLIENT_SECRET=<google oauth client secret>
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<supabase service role key>
STAQ_AUTHORITY_SECRET_KEY=<base58 keypair for the Staq issuer authority>
REGISTER_ISSUER_SECRET=<shared secret for issuer registration endpoint>
```

---

## Hackathon

Built for [Solana Frontier](https://www.colosseum.org/frontier) — Infrastructure track.
