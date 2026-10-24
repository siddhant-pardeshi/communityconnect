# PROJECT_STATUS

Last updated: 25 October 2026 · Release v0.1.0

## Where things stand

**Live (verified 25 Oct 2026):** https://siddhant-pardeshi.github.io/communityconnect/ (GitHub Pages, deployed from the `gh-pages` branch).
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

- **Live (verified 25 Oct 2026):** https://siddhant-pardeshi.github.io/communityconnect/ — HTTP 200, full UI rendered in a real browser against the production URL.
- Deploy method for v0.1.0: production build pushed to the `gh-pages` branch; Pages enabled with source = `gh-pages` root.
- `.github/workflows/` (CI + Pages Actions deploy) are **written and committed locally but not yet pushed** — the maintainer's GitHub token had `repo` scope without `workflow` scope at publish time. One-time fix:
  ```bash
  gh auth refresh -h github.com -s workflow
  git add .github && git commit -m "chore: enable CI + Pages via Actions" && git push
  ```
  Then optionally switch Pages to "GitHub Actions" source in repo settings; until then the `gh-pages` branch method remains the deploy path.
- Release: [v0.1.0](https://github.com/siddhant-pardeshi/communityconnect/releases/tag/v0.1.0) with `communityconnect-app-v0.1.0.zip` (portable build for any static host).
- Demo seed data is client-side and clearly labeled; it does not represent real users or activity.

## Next executable milestone (v0.2)

1. Supabase project + schema migration (mapping documented) → swap `store.ts` behind the same interface.
2. Server-side auth (email OTP or OAuth) and RLS for every table.
3. Notification outbox + transactional email.
4. Pilot in one city per docs/LAUNCH_PLAYBOOK.md week 1.

---

# v0.2.0 — Peer trust, founder console, enterprise restructure (25 Oct 2026)

## Added
- **Peer vouches (ADR-0002):** participants of the same started event can give ❤️, peer-verify claims (college/company/course), and record polite/professional conduct. Rolling 14-day window (`TRUST_WINDOW_DAYS`), one vouch per pair per window, no XP for vouches, conduct concerns route to moderation only. New tests pin the window math.
- **Founder console (ADR-0003):** `founder` + max 2 `cofounder` roles; edit any account's details, grant moderator/co-founder, suspend/unsuspend; append-only audit log. Founder role immutable; founder-team accounts cannot be suspended from the console. Suspended accounts blocked at login.
- **Monorepo (ADR-0001):** `packages/core` (@cc/core, pure domain + tests) and `apps/web` (@cc/web, React SPA). One-way dependency direction. Root scripts: `npm test`, `npm run build`.
- docs/BRAND.md — name candidates (Orbitly, CrewUp, Huddl, Saathi, Junto) + taglines; docs/ARCHITECTURE.md; docs/adr/0001–0003.
- Data migration v1→v2 (backfills vouches/audit on load).

## Verification (real)
- `npm run typecheck` — clean in both workspaces
- `npm test` — **27/27 passed** (core: overlap/weeks 7, rules/trust/roles/streaks/scoring 20)
- `npm run build` — ✓ 145 modules, ~114 KB gzip
- Browser smoke: founder demo login → Founder console (role + audit visible); vouch modal from shared event; profile trust chips render.

## Known limitations (unchanged + new)
- Data remains per-browser (documented v0.3 Supabase swap).
- Trust window is client-enforced; server enforcement arrives with the backend.
- An empty `app/` folder may linger on the maintainer's machine (held by an OS handle); it is not part of the repo.

## Post-release fix (same day)
- **PWA stale-cache bug caught in live verification:** the v0.1 service worker cached navigations cache-first, so returning visitors could get a blank page after a redeploy (old cached index → deleted bundle). Fix: `sw.js` rewritten to **network-first for navigations** with cache version bumped to `cc-shell-v2` (commit b286f07, redeployed to gh-pages). Returning visitors recover with one reload; new visitors unaffected.
