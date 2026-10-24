# Architecture

CommunityConnect is an npm-workspaces monorepo with a strict dependency direction:

```
packages/core  →  (pure domain)        ← no React, no DOM, no storage
apps/web       →  (React SPA + store)  ← depends on @cc/core
docs/, .github/                        ← never imported by code
```

**Rule: `@cc/core` never imports from `apps/web`.** This keeps every business rule unit-testable and makes the future backend (workers, API) able to reuse the exact same domain logic.

## Layout

```
packages/core/src/
  types.ts      all data contracts (UserAccount, EventItem, Decision, Vouch, AppState…)
  rules.ts      pure policy: XP ledger + caps, streak grace, decision scoring,
                roles/permissions helpers, peer-trust (rolling window)
  util.ts       pure helpers: time/IANA zones, half-open overlap math, .ics builder,
                referral codes, privacy-aware publicView()
  seed.ts       labeled fictional demo dataset (never seeded into production data)
  index.ts      barrel — the only import surface: `@cc/core`
packages/core/tests/   vitest suites pinning every rule above

apps/web/src/
  lib/store.ts  the ONLY mutable-state module: load/persist (localStorage),
                every mutation as an action with validation, selectors
  lib/qr.ts     QR/vCard + profile URL
  lib/dom.ts    DOM-bound helpers (downloads) — deliberately outside core
  router.tsx    tiny hash router (Pages-friendly)
  components/   design-system pieces (ui.tsx) + feature components (Vouch, EventCard…)
  pages/        one file per screen (24 screens), thin: read store → render → call actions
  styles/       Warm Constellations design system (tokens, themes, motion, print)
```

## Data flow

1. Components call **actions** (`signup`, `submitBallot`, `vouchUser`, `adminUpdateUser`…).
2. Actions validate against current state, then run inside `mutate()` — a single
   structured-clone + persist + notify pipeline. No component mutates state directly.
3. Components subscribe via `useStore()` (useSyncExternalStore) and select with helpers.
4. Pure rules live in `@cc/core` with tests; the store only orchestrates.

## Adding a feature (the enterprise recipe)

1. **Contract first:** add/extend types in `packages/core/src/types.ts`.
2. **Policy second:** pure functions + tests in `packages/core/src/rules.ts` (e.g. caps, windows, scoring).
3. **Actions third:** validation + `mutate()` in `apps/web/src/lib/store.ts`. Every gate (auth, blocks, quorum…) lives here, not in components.
4. **UI last:** a page/component that renders state and calls actions. No business rules in JSX.
5. **Evidence:** add a test row to `docs/ACCEPTANCE_MATRIX.md`; update `PROJECT_STATUS.md`.

## Backend swap path (v0.3)

`lib/store.ts` is the single swap point. Target: Supabase (Postgres + RLS + Auth + Storage).
- `AppState` collections map 1:1 to tables; `mutate()` becomes transactional server actions.
- `rules.ts`/`util.ts` run server-side unchanged (deadlines, scoring, trust windows, XP caps).
- Client keeps optimistic reads; authorization moves to RLS policies.

## Conventions

- TypeScript strict; no `any` in new code; exported functions documented with a why-line.
- Copy is honest by default: unknown ≠ free, planned ≠ registered, vouch ≠ verdict.
- Design tokens only from `styles/global.css`; semantic HTML; every state has text, not just color.
- Versions: single-version policy — root, `@cc/core`, and `@cc/web` release together (currently 0.2.0).
- Release process: `npm test` → `npm run build` → push `main` → deploy `apps/web/dist` to GitHub Pages (`gh-pages`) → tag a GitHub release with the dist zip.

## Decision records

Significant decisions live in `docs/DECISIONS.md` (index) with detailed ADRs in `docs/adr/`.
