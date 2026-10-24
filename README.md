# CommunityConnect

**Find your event. Bring your people.**

CommunityConnect turns scattered event links into confirmed group plans and useful professional relationships. Share the options, spot the clashes, decide together in a **Decision Room**, and show up with company — students, professionals, job seekers, founders, and communities.

🔗 **Live app:** https://siddhant-pardeshi.github.io/communityconnect/

---

## What works today (v0.1.0)

| Area | Status |
|---|---|
| Landing page, marketing site, policy pages | ✅ Live |
| Accounts (browser-local, salted+hashed) with demo profiles | ✅ Live |
| Event discovery, search & filters, manual posting with source links | ✅ Live |
| Events: save/plan/register-self-report, corrections & cancellation with participant notifications | ✅ Live |
| “Who’s in” — attendee backgrounds (college/company) with per-person privacy toggles | ✅ Live |
| Circles with revocable invite codes, roles, activity feed | ✅ Live |
| **Decision Rooms**: ballots (can/maybe/cannot + favorite), server-style deadline enforcement, 60% quorum, disclosed scoring formula, tie/override handling, finalized plans | ✅ Live |
| Plans: independent confirmations (2+ required), review-needed on material changes, .ics export, meetup notes | ✅ Live |
| Buddy board: opt-in requests, mutual acceptance, private cancellation | ✅ Live |
| People directory with intent chips (open-to-work, seeking-referrals, hiring, between-roles) | ✅ Live |
| Connections: reasoned requests, mutual acceptance, private messaging, blocking | ✅ Live |
| **Referral program**: +75 XP to both sides, 14-day boost for referrer, welcome boost for friend | ✅ Live |
| **Networking card**: printable 85.6×54 mm card with QR + vCard QR, privacy-aware | ✅ Live |
| Momentum: gentle streaks with weekly grace, contribution XP with daily caps, cosmetic unlocks | ✅ Live |
| Reporting + moderation console with recorded outcomes | ✅ Live |
| PWA install (all devices) + offline shell | ✅ Live |
| In-app notifications + preferences | ✅ Live |
| Data export & account deletion | ✅ Live |

**Known limitation (honest):** this release persists data **per browser** (localStorage). It is a complete, working product for trying every journey — including multi-account flows via Settings → “Multi-account testing”. Cross-device, server-backed accounts are the next milestone: the data layer maps 1:1 onto the documented Supabase schema swap (see `docs/DECISIONS.md`). No fabricated backend claims are made.

## Quick start (local)

```bash
cd app
npm install
npm run dev        # http://localhost:5173
```

Other scripts: `npm run build` (typecheck + production build), `npm run test` (vitest), `npm run preview` (serve the build).

Demo data (10 events, 6 fictional profiles, 2 circles, 3 decisions, seeded plans/buddy requests) loads automatically and is labeled **DEMO DATA** — or use the one-click “Explore as …” demo profiles on the landing page.

## Deployment

- **Live:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`) — builds on every push to `main` and deploys the `dist/` artifact.
- **Any static host works:** `npm run build` produces a self-contained `dist/` (relative base, hash routing).
- **Self-hosting / server backend:** the documented upgrade path is Supabase (auth, Postgres + RLS, storage). The store layer (`app/src/lib/store.ts`) is the single swap point.

## Repository map

```
app/src/lib/       domain logic — types, store, rules (XP/scoring/streaks), time/overlap/ics, seed
app/src/pages/     24 screens — landing → decision room → moderation
app/src/styles/    Warm Constellations design system (tokens, motion, print CSS)
app/tests/         vitest suites for overlap math, scoring, XP/streak/referral rules
docs/              decisions, acceptance matrix, launch playbook, business model
```

## Contributing, safety & license

- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md) · Security: [SECURITY.md](SECURITY.md)
- Conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) (enforced in-app with a moderation console)
- License: Apache-2.0 — see [LICENSE](LICENSE)
- “CommunityConnect” is a working name; no trademark/domain clearance has been performed.
- No invented user counts, testimonials, or endorsements appear anywhere in this product.

## North-star

Weekly newly confirmed group plans — not screen time. The product succeeds when people make plans and meet.
