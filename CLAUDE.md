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
   - `app/consent/page.tsx`
   - `app/idl.json`
   - `package.json`

If docs and code disagree, trust the current code first.

## Product Snapshot

Glurk is an identity and consent protocol prototype. The current real product surface is the consent flow, where apps request credential access and contribute data back to a user-owned profile. The home page is still largely template scaffolding and should not be treated as the product truth.

## Quick Commands

```bash
npm run dev
npm run build
npm run lint
```

## Key Surfaces

- Product metadata and visual direction: `app/layout.tsx`
- Real interaction flow: `app/consent/page.tsx`
- On-chain/program contract shape: `app/idl.json`
- Dependency signals: `package.json`

## Non-Negotiables

1. Do not let template create-next-app content define product decisions.
2. Preserve the consent flow semantics: read request, contribution requirement, approve, deny, and callback handoff.
3. Treat the Solana and identity vocabulary as core product language, not decorative copy.
4. Keep user control and explicit permissioning clear in every UX change.

## Working Discipline

- The generated `README.md` is not the operating source of truth.
- When editing Glurk, inspect `app/consent/page.tsx` before touching visuals or data flow.
- If you expand beyond the prototype shell, update this file so Claude has the new real surface map.
