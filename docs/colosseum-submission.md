# Colosseum Frontier — Submission Draft

## Project Name
Glurk

## One-Liner
Reciprocal data exchange on Solana — apps must contribute user data to access user data, creating a portable identity that gets richer with every interaction.

## Description

Glurk is an open credential infrastructure on Solana where verified data flows both ways. When an app wants to read a user's credentials, it must contribute something back — enforced at the program level, not by terms of service.

The protocol has three layers:
- **Credential Layer** — Approved issuers write verified facts about users using Solana Attestation Service (SAS) and Token-2022 Non-Transferable SBTs
- **Access Layer** — Reciprocal read/write enforcement via Anchor program. Apps request data with user wallet consent, must submit a data contribution in the same transaction
- **Intelligence Layer** — Glurk Score, a 0-1000 reputation number derived from all credentials across all issuers

Unlike data monetization protocols where users sell their data, Glurk creates a data exchange where apps trade data. Users don't sell anything — they get a better experience from every app because every app enriches their profile.

We proved the protocol works with a live consumer app: Staq, a financial literacy platform for Indian Gen Z with real users on Play Store. Users earn verified credentials by completing learning modules, creating the first real credentials on the protocol.

## Track
Infrastructure

## Links
- Live app: https://staq.slayerblade.site
- GitHub: https://github.com/sb-arnav/staq-protocol
- SDK: @glurk/sdk (npm)
- Flux Token (devnet): GEjTzMRTUHnfPB8z8VKka79XQqEmFB7FeSRcjonQ8huG
- Example SBT: https://explorer.solana.com/address/CMcXGv5jqSujkju1v3XgCHHA4kb8RwyGXaBhnoP18Gqh?cluster=devnet

## Team
- Arnav (SlayerBlade) — Protocol design, TypeScript SDK, consumer app, pitch
- Federico Alvarez — Anchor program, on-chain architecture

## What makes this different
- 162 projects have tried education on Solana across 5 Colosseum hackathons. Zero won. They built apps. We built infrastructure.
- The reciprocal data exchange doesn't exist anywhere — not in Colosseum submissions, not on Solana, not on any chain.
- Built on SAS (Solana Foundation's attestation service), not competing with it.
- Live consumer app with real users in India already earning credentials on-chain.
