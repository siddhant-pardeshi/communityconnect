# CommunityConnect

**Find your event. Bring your people.**

CommunityConnect turns scattered event links into confirmed group plans and useful professional relationships. Share the options, spot the clashes, decide together in a **Decision Room**, and show up with company — students, professionals, job seekers, founders, and communities.

🔗 **Live app:** https://siddhant-pardeshi.github.io/communityconnect/

---

## What works today (v0.2.0)

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
| **Peer trust & vouches**: hearts, peer-verification of college/company/course claims, conduct signals — rolling 14-day window so records refresh and conduct can improve | ✅ Live |
| **Founder console**: founder + up to 2 co-founders with full control — edit any account, grant team roles (moderator/co-founder), suspend, append-only audit log | ✅ Live |
| PWA install (all devices) + offline shell | ✅ Live |
| In-app notifications + preferences | ✅ Live |
| Data export & account deletion | ✅ Live |

**Known limitation (honest):** this release persists data **per browser** (localStorage). It is a complete, working product for trying every journey — including multi-account flows via Settings → “Multi-account testing”. Cross-device, server-backed accounts are the next milestone: the data layer maps 1:1 onto the documented Supabase schema swap (see `docs/DECISIONS.md`). No fabricated backend claims are made.

## Quick start (local)

```bash
npm install         # installs both workspaces
npm run dev         # http://localhost:5173
npm test            # vitest across workspaces
npm run build       # typecheck (all) + production build
```

Demo data (11 events, 9 fictional profiles incl. the founder team, 2 circles, 3 decisions, vouches, seeded plans/buddy requests) loads automatically and is labeled **DEMO DATA** — or use the one-click “Explore as …” demo profiles (Founder, Aarav, Meera, Ananya) on the landing page.

## Deployment

- **Live:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`) — builds on every push to `main` and deploys the `dist/` artifact.
- **Any static host works:** `npm run build` produces a self-contained `dist/` (relative base, hash routing).
- **Self-hosting / server backend:** the documented upgrade path is Supabase (auth, Postgres + RLS, storage). The store layer (`app/src/lib/store.ts`) is the single swap point.

## Repository map (enterprise monorepo)

```
packages/core/     @cc/core — pure domain: types, rules (XP/scoring/trust/roles), time/overlap/ics, seed + tests
apps/web/          @cc/web  — React SPA: store (state+actions), 25 screens, design system, PWA
docs/              ARCHITECTURE, DECISIONS + adr/, ACCEPTANCE_MATRIX, LAUNCH_PLAYBOOK, BUSINESS_MODEL, BRAND
.github/           CI + Pages deploy workflows (see PROJECT_STATUS for the token-scope note)
```

Dependency direction is one-way: `@cc/core` is pure (no React/DOM/storage) so the future backend reuses it unchanged. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Contributing, safety & license

- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md) · Security: [SECURITY.md](SECURITY.md)
- Conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) (enforced in-app with a moderation console)
- License: Apache-2.0 — see [LICENSE](LICENSE)
- “CommunityConnect” is a working name; no trademark/domain clearance has been performed.
- No invented user counts, testimonials, or endorsements appear anywhere in this product.

## North-star

Weekly newly confirmed group plans — not screen time. The product succeeds when people make plans and meet.
