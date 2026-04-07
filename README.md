# Glurk Protocol

**The credit bureau for skills.** An on-chain credential protocol on Solana where apps must contribute data to read data — enforced at the program level, not by terms of service.

Live: [glurk.slayerblade.site](https://glurk.slayerblade.site)

---

## What it is

Glurk is invisible infrastructure. Users don't sign up for Glurk — they sign up for apps built on Glurk. Like CIBIL, it just exists.

When an app wants to read a user's credentials, it must contribute something back in the same transaction. No contribution = no access. This is enforced on-chain by the Anchor program — there's no way to bypass it via terms of service or a policy change.

Users own everything via wallet. Every read is a visible on-chain event.

**Program ID (devnet):** `5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ`

---

## Protocol layers

### Credential Layer
Approved issuers write verified facts about users. Each credential is a PDA keyed by `[issuer, user, slug]`. Each credential also mints a Token-2022 NonTransferable SBT to the user's wallet.

**Staq** ([staq.slayerblade.site](https://staq.slayerblade.site)) is the first live issuer — a financial literacy app with real Indian Gen Z users. Credentials issued:
- `credit-score` — Credit Score Basics (Gold)
- `stocks` — Stock Market Basics (Gold)
- `upi` — UPI Payments (Platinum)
- `sell-rules` — Sell Rules (Gold)

### Access Layer
Reciprocal read/write enforcement. The `request_access` instruction:
1. Writes the app's data contribution as a credential PDA
2. Creates a consent PDA (user × requester)
3. Requires the user's wallet to co-sign

Both happen atomically. If the contribution fails, the access fails.

### Intelligence Layer
Glurk Score (0–1000) — derived from all credentials across all issuers, weighted by tier and score. Gets richer as more apps contribute data.

---

## Program instructions

| Instruction | Description |
|---|---|
| `register_issuer` | Register an app as a credential issuer |
| `register_credential` | Issue a credential to a user (issuer signs) |
| `request_access` | Request read access + contribute data (requires user co-sign) |
| `revoke_access` | Revoke a previously granted consent |
| `deactivate_issuer` | Deactivate an issuer |

---

## Reading credentials

Credential PDAs are derived deterministically — any app can read them with just the program ID:

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

---

## Requesting access

```typescript
await program.methods
  .requestAccess(
    "trading-history",  // contribution slug
    "gold",             // contribution tier
    85                  // contribution score
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

Glurk supports [Solana Actions](https://solana.com/docs/advanced/actions) — users can approve credential access directly from X/Twitter without leaving the tweet.

Action endpoint: `GET/POST /api/actions/consent`

Try it: [dial.to](https://dial.to/?action=solana-action:https://glurk.slayerblade.site/api/actions/consent?app=StaqLend&contribute_slug=trading-history&contribute_tier=gold&contribute_score=80)

---

## Live demos

Both demos run a real on-chain `request_access` transaction through Phantom:

- **StaqLend** (`/demo/lend`) — DeFi app that reduces collateral requirements based on verified financial knowledge
- **StaqJobs** (`/demo/jobs`) — Hiring app that matches candidates to roles using verified credentials

If your wallet has no Staq credentials on devnet, the demo page will offer to seed 4 credentials (real Token-2022 SBTs + Anchor PDAs).

---

## IDL

The full IDL is at [`app/idl.json`](app/idl.json).

---

## Environment variables

```
STAQ_AUTHORITY_SECRET_KEY=<base58 keypair for the Staq issuer authority>
```

---

## Hackathon

Built for [Solana Frontier](https://www.colosseum.org/frontier) — Infrastructure track.
