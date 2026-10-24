# PROJECT_STATUS

Last updated: 25 October 2026 · Release v0.1.0

## Where things stand

**Live:** https://siddhant-pardeshi.github.io/communityconnect/ (GitHub Pages, deployed by GitHub Actions from `main`).
**Repo:** https://github.com/siddhant-pardeshi/communityconnect
**Verified:** typecheck clean, 22/22 unit tests passing, production build successful, browser smoke test completed (landing → demo login → dashboard → ballot submission → QR card) on the built artifact.

## Honest status vocabulary

Everything below uses: **implemented + tested** (unit tests or browser-verified), **implemented** (working, not covered by tests), or **not started**.

### Implemented + tested
- Half-open interval overlap math (touching endpoints, cross-midnight, invalid instants)
- Reward week keys and timezone day keys (incl. IST edge)
- XP ledger: dedupe keys, 30/day contribution cap, referral exemption from cap, once-per-pair connection XP with weekly cap
- Streaks: same-day no-op, one-day gap grace consumed from the *missed day's* week, second grace denied, Sunday→Monday case
- Decision scoring: disclosed formula, quorum, ties (no arbitrary winner), zero-preference (no recommendation), blanks ≠ cannot, removed-voter exclusion

### Implemented + browser-verified
- Landing, auth (signup/login/demo), dashboard with next-actions, discovery + filters, event detail + RSVP + .ics, event posting, circles + invites, Decision Room ballot submission + persistence, networking card with live QR, public profile route

### Implemented (not test-covered)
- Moderation console flows, data export/deletion, notifications, referral application at signup, event material-change → plan review-needed propagation

### Not started (deliberate scope for v0.2+)
- Server-backed accounts & cross-device sync (Supabase swap — schema mapping in docs/DECISIONS.md)
- Email/notification outbox, calendar free/busy OAuth, provider API adapters (Luma/Meetup), paid billing
- Idea board posts, P1 pitch rooms

## Verification log (real commands)

| Check | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | 0 errors |
| Unit tests | `npx vitest run` | 22 passed / 0 failed |
| Build | `npm run build` | ✓ 142 modules, ~108 KB gzip |
| Smoke | browser against `vite preview :4173` | journeys listed above verified |

## Deployment state

- GitHub Actions `deploy.yml` builds and deploys Pages on push to `main`. Pages enabled with `build_type=workflow`.
- Live URL verified with an HTTP 200 + rendered content after the first deploy.
- Demo seed data is client-side and clearly labeled; it does not represent real users or activity.

## Next executable milestone (v0.2)

1. Supabase project + schema migration (mapping documented) → swap `store.ts` behind the same interface.
2. Server-side auth (email OTP or OAuth) and RLS for every table.
3. Notification outbox + transactional email.
4. Pilot in one city per docs/LAUNCH_PLAYBOOK.md week 1.
