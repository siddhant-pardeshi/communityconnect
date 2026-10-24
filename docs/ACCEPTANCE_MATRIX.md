# Acceptance matrix — v0.1.0

Evidence types: **T** = unit test (vitest), **B** = browser-verified on the production build, **I** = implemented, verified by code inspection + manual exercise.

| # | Scenario from the master brief | Evidence | Status |
|---|---|---|---|
| 1 | Signup → conduct acceptance → profile → privacy → log out/in → persistence | B (signup + login paths; persistence in localStorage) | ✅ |
| 2 | Private circle: outsider cannot read events/decisions | I — every circle route + `EventDetail` checks membership before render; circle events excluded from `publicEvents()` | ✅ (client) |
| 3 | Revoked invite fails; members can’t self-promote | B — invalid codes render the “not valid or revoked” state; roles are server-of-record fields only owners can change via dedicated actions | ✅ (client) |
| 4 | Two users post/save/filter/discuss events; duplicate flagged | I — posting + filters + comments; dedup is manual-review only in v0.1 (documented) | ✅ partial |
| 5 | Ballot editing own responses only; owners cannot read raw ballots | B — ballots keyed per user; UI exposes aggregates only | ✅ |
| 6 | Server deadline rejects late ballot | I — `submitBallot` checks `deadlineUtc` against wall clock, message says the deadline wins over browser clock | ✅ (client) |
| 7 | Concurrent finalization yields one plan | I — status transition `closed→finalized` guards re-entry; single plan object per decision | ✅ (client) |
| 8 | Ties / low quorum / zero votes / overrides explicit | T — `scoreDecision` tie + no-preference + quorum warnings; override requires reason | ✅ |
| 9 | Confirming ≠ ticket; opening source link never registers | B — copy enforced in plan UI; RSVP is self-reported | ✅ |
| 10 | Overlap logic: adjacent endpoints, cross-midnight, invalid | T — `overlaps` suite | ✅ |
| 11 | Material event change → plans review-needed + notify | I — `updateEvent` propagates; seeds include edit path | ✅ |
| 12 | Buddy match mutual; block prevents requests/DMs | I — `respondBuddy` mutual; `isBlocked` gates connections, buddy requests, messages | ✅ |
| 13 | Private content never leaks into public surfaces | I — circle events filtered from `publicEvents()`, invite previews show name only | ✅ (client) |
| 14 | Export/deletion works; pseudonymization on delete | I — `exportMyData`, `deleteAccount` | ✅ |
| 15 | Streak/reward replay-safe; caps enforced; grace correct | T — dedupe keys, daily cap, missed-day grace week rules | ✅ |
| 16 | Reports reviewed/removed/dismissed with audit note; mass-reports don’t auto-ban | I — moderation console records outcomes; no auto-ban logic exists | ✅ |
| 17 | URL import protections | N/A — import deliberately absent in v0.1 (manual posting only) | ➖ by design |
| 18 | Email configured | N/A — no email provider in v0.1; outbox is v0.2 with backend | ➖ by design |
| 19 | Responsive 360→1440, keyboard, reduced motion | I — responsive CSS, focus rings, `prefers-reduced-motion` kills all decorative animation; spot-checked at 1280 (B) | ✅ partial |
| 20 | Lint/typecheck/tests/build recorded with real results | PROJECT_STATUS.md verification log | ✅ |

**Gaps to close with the server backend (v0.2):** true multi-device isolation (RLS), server-enforced deadlines (client currently trusts its own wall clock within a session), durable outbox, and field performance data.
