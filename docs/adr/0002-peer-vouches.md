# ADR-0002 — Peer vouches with a rolling 14-day window

Date: 25 Oct 2026 · Status: accepted

## Context
The founder wants participants of a real event to be able to (a) give hearts/likes, (b) verify each other's claims (college / company / course) so profiles can't be faked, and (c) record polite, professional conduct — with ratings expiring after ~a week so false or unfair ratings fade and people get a genuine chance to improve.

## Decision
- **Gating:** a vouch requires a shared participation record (RSVP or plan confirmation) on an event that has already started. No drive-by ratings, no self-vouches, blocked pairs excluded.
- **Signals:** `hearts` (boolean), `claims` (subset of college/company/course the voucher personally saw evidence for), `conduct` (polite / professional), optional `note`.
- **Renewal:** `TRUST_WINDOW_DAYS = 14` (constant, configurable). Only vouches newer than the cutoff are counted in `computeTrust()`. One vouch per (voucher, target) per window. Expired vouches remain in the ledger for moderation but never display.
- **No XP for vouches** — paying for reputation invites reciprocity spam.
- **Conduct concerns** are never a public score: they go through the report flow to moderators. Public surfaces show only positive signals + counts. Vouch notes are private to moderators.

## Consequences
- Trust is fresh but churny; long-term reliability shows up as repeated windows of positive vouches rather than a lifetime score. Accepted — renewal is the requested feature.
- A coordinated circle could heart-farm; mitigations: shared-event gating, one-per-pair-per-window, moderation review, and the explicit rule that trust never buys reach beyond existing boosts.
- The 14-day default trades off against the founder's "1 week" suggestion; configurable constant documented in `rules.ts`.
