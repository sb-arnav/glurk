# SAS Integration Plan

## How Solana Attestation Service works

SAS has 3 layers:
1. **Credential** — represents an issuer (e.g. "Staq Financial Literacy")
2. **Schema** — defines the data structure (e.g. "module_slug: string, tier: string, score: u8")
3. **Attestation** — an actual credential issued to a user (e.g. "Arnav has Gold tier in Credit Score")

Each is a PDA on the SAS program. Anyone can read them. Only authorized signers can write.

## Our Integration

Instead of building a custom Anchor credential registry, we use SAS for credentials and keep our Anchor program ONLY for:
1. Staking escrow (unique to us)
2. Reciprocal access control (unique to us)
3. Consent management (unique to us)

### Step 1: Register Staq as a Credential on SAS

```js
import { getCreateCredentialInstruction, deriveCredentialPda } from 'sas-lib';

const [credentialPda] = await deriveCredentialPda({
  authority: staqAuthority.address,
  name: 'STAQ-FINANCIAL-LITERACY'
});

const ix = getCreateCredentialInstruction({
  payer: staqAuthority,
  credential: credentialPda,
  authority: staqAuthority,
  name: 'STAQ-FINANCIAL-LITERACY',
  signers: [staqAuthority.address]
});
```

### Step 2: Create a Schema for skill credentials

```js
const [schemaPda] = await deriveSchemaPda({
  credential: credentialPda,
  name: 'SKILL-CREDENTIAL',
  version: 1
});

const ix = getCreateSchemaInstruction({
  authority: staqAuthority,
  payer: staqAuthority,
  name: 'SKILL-CREDENTIAL',
  credential: credentialPda,
  description: 'Verified skill credential from Glurk',
  fieldNames: ['module_slug', 'tier', 'score', 'earned_at'],
  schema: schemaPda,
  layout: Buffer.from([12, 12, 0, 12]), // string, string, u8, string
});
```

### Step 3: Issue attestations (credentials) to users

```js
const [attestationPda] = await deriveAttestationPda({
  credential: credentialPda,
  schema: schemaPda,
  nonce: userWallet.address
});

const ix = await getCreateAttestationInstruction({
  payer: staqAuthority,
  authority: staqAuthority,
  credential: credentialPda,
  schema: schemaPda,
  attestation: attestationPda,
  nonce: userWallet.address,
  expiry: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
  data: serializeAttestationData(schema.data, {
    module_slug: 'credit-score',
    tier: 'gold',
    score: 78,
    earned_at: new Date().toISOString(),
  }),
});
```

### Step 4: Any app verifies a credential

```js
const attestation = await fetchAttestation(rpc, attestationPda);
const data = deserializeAttestationData(schema.data, attestation.data.data);
// data = { module_slug: 'credit-score', tier: 'gold', score: 78, earned_at: '...' }
```

## What this means for the hackathon

1. We use SAS for the credential storage — Solana Foundation's own infrastructure
2. Our Anchor program handles staking + reciprocal access (the novel parts)
3. We still mint Token-2022 SBTs as the visual/ownable credential
4. SAS attestations are the machine-readable verification layer
5. Judges see: "Built on Solana's official attestation service" — not competing with it

## SDK Changes

The `@glurk/sdk` SDK wraps SAS under the hood:
- `verify()` → reads SAS attestation PDA
- `issue()` → creates SAS attestation + mints Token-2022 SBT
- `getScore()` → reads all SAS attestations, calculates score

Developers don't need to know about SAS. They use our SDK. But under the hood it's the official standard.

## npm package needed

```
npm install sas-lib gill
```
