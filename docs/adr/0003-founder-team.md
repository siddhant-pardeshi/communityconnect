# ADR-0003 — Founder team with full administrative control

Date: 25 Oct 2026 · Status: accepted

## Context
The founder requires entire control of the portal for themselves and two co-founders: editing any user's details, granting team access, and suspending accounts.

## Decision
- Roles: `founder` (exactly one, immutable) → `cofounder` (max 2, appointed only by the founder) → `moderator` → `member`.
- `isFounderTeam()` (founder + cofounders) unlocks the **Founder console**: edit any account's profile fields (audited), change roles (with cap + immutability rules), suspend/unsuspend non-founder-team accounts.
- `isStaff()` (founder + cofounders + moderators) unlocks report resolution and content moderation.
- Every administrative action appends to an **append-only audit log** (actor, action, target, detail, time) rendered in the console.
- Suspended accounts are blocked at login and see a suspension screen; the acting account is logged out immediately.

## Consequences
- Power is concentrated by design, but bounded: cofounder cap of 2, founder immovable by anyone, no role self-assignment, and a complete audit trail.
- In the browser-local build the console governs accounts in the local dataset; the server swap (v0.3) keeps identical rules enforced by RLS + server actions.
