# Glurk Operating File

## Startup

Fresh session order:

1. Read `/home/arnav/WORKSPACE.md`
2. Read `/home/arnav/glurk/CLAUDE.md`
3. Read `/home/arnav/glurk/AGENTS.md`
4. Inspect the current app routes before assuming the product shape

## Source Of Truth

1. Workspace context: `/home/arnav/WORKSPACE.md`
2. Project operating rules: `/home/arnav/glurk/CLAUDE.md`
3. Framework caveat: `/home/arnav/glurk/AGENTS.md`
4. Current implementation truth:
   - `app/layout.tsx`
   - `app/page.tsx`
   - `app/consent/page.tsx`
   - `app/profile/page.tsx`
   - `app/issuers/page.tsx`
   - `app/idl.json`
   - `packages/sdk/src/index.ts`
   - `package.json`

If docs and code disagree, trust the current code first.

## Product Snapshot

Glurk is a Solana credential, consent, and identity-linking product. The current real product surface is broader than the original prototype:

- `app/page.tsx` is a real homepage and positioning surface
- `app/consent/page.tsx` is the canonical reciprocal access flow
- `app/profile/page.tsx` is the wallet-backed identity surface
- `app/auth/signin/page.tsx` handles Google sign-in before wallet linking
- `app/issuers/page.tsx` is the issuer-facing onboarding and protocol explainer
- `app/demo/*` shows live end-user applications built on the protocol

Glurk currently spans three connected layers:

1. On-chain credentials and consent records on Solana
2. Wallet-to-email identity linking for smoother onboarding
3. SDK and API surfaces that make the protocol usable by third-party apps

## Quick Commands

```bash
npm run dev
npm run build
npm run lint
```

## Key Surfaces

- Product shell and metadata: `app/layout.tsx`
- Homepage and positioning: `app/page.tsx`
- Canonical consent UX: `app/consent/page.tsx`
- Identity and linked-account UX: `app/profile/page.tsx`
- Issuer-facing surface: `app/issuers/page.tsx`
- On-chain/program contract shape: `app/idl.json`
- Auth wiring: `lib/auth.ts`
- Identity-link storage wiring: `lib/supabase.ts`
- SDK entrypoint: `packages/sdk/src/index.ts`
- Dependency/runtime signals: `package.json`

## Non-Negotiables

1. Do not let template create-next-app content define product decisions.
2. Preserve the consent flow semantics: read request, contribution requirement, approve, deny, and callback handoff.
3. Treat the Solana and identity vocabulary as core product language, not decorative copy.
4. Keep user control and explicit permissioning clear in every UX change.
5. Treat homepage, auth, profile, issuers, and demo surfaces as one product system.
6. If you materially change the product surface, update this file so the next model inherits the right map.

## Working Discipline

- The generated `README.md` is not the operating source of truth.
- When editing Glurk, inspect `app/consent/page.tsx` before touching visuals or data flow.
- Check top-level docs against the current code before assuming a route is still prototype-only.
- If docs and code disagree on program state, auth flow, or issuer flow, trust the code and then repair the docs.
