# @glurk/sdk

The identity protocol for the internet. Apps trade data. Users own everything. Built on Solana.

## What is this?

Glurk lets any Solana app issue **permanent, non-transferable, verifiable credentials** to users. Think of it as Aadhaar for skills — one system that stores "this person knows X" and anyone can check it.

- **Non-transferable** — credentials can't be sold or faked (Token-2022 NonTransferable extension)
- **Permanent** — lives on Solana, not on anyone's server
- **Open** — any registered issuer can write, any app can read
- **Composable** — DeFi protocols, job platforms, DAOs can all verify credentials without trusting any API

## Quick Start

### Verify a credential (3 lines)

```js
import { Connection } from '@solana/web3.js';
import { Glurk } from '@glurk/sdk';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const glurk = new Glurk(connection);
const credential = await glurk.verify(issuer, userWallet, 'credit-score');

if (credential) {
  console.log(`Tier: ${credential.tier}, Score: ${credential.score}`);
  // This user has a verified financial literacy credential
}
```

### Get a user's Glurk Score

```js
import { getGlurkScore } from '@glurk/sdk';

const score = await getGlurkScore(connection, issuer, userWallet);
// 0-1000 reputation score derived from all credentials
// Higher tier + higher module score = higher Glurk Score

if (score > 500) {
  // Offer better rates, lower collateral, priority access
}
```

### Full client usage

```js
import { Glurk, KNOWN_ISSUERS } from '@glurk/sdk';

const glurk = new Glurk(connection);

// Verify a specific credential
const cred = await glurk.verify(KNOWN_ISSUERS.STAQ, userWallet, 'stocks');

// Get all credentials from Staq
const allCreds = await glurk.getAllCredentials(KNOWN_ISSUERS.STAQ, userWallet);

// Check if an issuer is registered
const issuer = await glurk.checkIssuer(someIssuerPubkey);
```

## Use Cases

**DeFi / Lending:**
> User has Gold-tier financial literacy credentials → offer 20% lower collateral requirement

**Job Platforms:**
> User has verified coding + finance credentials → surface for fintech roles automatically

**DAOs:**
> Only members with specific credentials can vote on treasury decisions

**Education Platforms:**
> Issue your own credentials through the protocol. Your students carry them everywhere.

## How Credentials Work

1. **Issuers register** with the protocol (approved by protocol admin)
2. **Issuers write credentials** to user wallets via the Anchor program
3. **Credentials are PDAs** seeded by `[issuer, user, slug]` — deterministic and readable by anyone
4. **Any Solana program** can derive the PDA and read the credential without any API call

```
PDA = findProgramAddress(["credential", issuer, user, "credit-score"], PROGRAM_ID)
```

If the account exists → credential is verified. Read the data for tier, score, and timestamp.

## Become an Issuer

Want to issue credentials through the protocol? You need:

1. A Solana wallet (your issuer identity)
2. Approval from the protocol admin
3. That's it — use the SDK to start issuing

Contact: [staq.slayerblade.site](https://staq.slayerblade.site)

## Protocol Details

| Component | Value |
|-----------|-------|
| Program | Glurk Protocol (Anchor) |
| Network | Solana Devnet (mainnet coming) |
| Token Standard | Token-2022 with NonTransferable + MetadataPointer |
| Credential Storage | PDAs on the Anchor program |
| First Issuer | Staq — financial literacy credentials for Indian Gen Z |
| Live App | [staq.slayerblade.site](https://staq.slayerblade.site) |

## License

MIT
