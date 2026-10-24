# ADR-0001 — Monorepo with a pure domain core

Date: 25 Oct 2026 · Status: accepted

## Context
The project must scale to many engineers working manually without confusion, like enterprise product teams. v0.1 was a single `app/` tree where domain logic and UI lived side by side.

## Decision
npm-workspaces monorepo:
- `packages/core` (`@cc/core`) — all types, policy rules, pure helpers, seed; TypeScript source consumed directly via Vite alias and TS paths (no build step). Zero React/DOM/storage dependencies.
- `apps/web` (`@cc/web`) — React SPA: store (state + actions), pages, components, styles.
- Tests live next to the code they pin (`packages/core/tests`).

## Consequences
- Business rules are reusable by future server workers unchanged; UI can be rewritten without touching policy.
- Import direction is enforced by convention (`@cc/core` imports nothing from apps).
- Slightly more moving parts (workspaces, alias) — justified by the scaling requirement.
