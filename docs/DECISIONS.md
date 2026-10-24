# Decision log

Append-only. Each decision is reversible unless marked otherwise.

## D1 — Stack: Vite + React 18 + TypeScript, no backend framework (25 Oct 2026)
The master brief prefers Next.js + Supabase. The Supabase half requires account credentials that do not exist in the build environment; a Next.js app without its database would be a fabricated deployment. Chosen instead: a production-built SPA (hash routing, relative base) deployable to GitHub Pages **today**, with the data layer (`app/src/lib/store.ts`) as the single interface to swap for Supabase. The domain types, rules, and tests move unchanged. **Reversible** — the swap path is documented and typed.

## D2 — Honest storage: browser-local persistence for v0.1
localStorage holds the full AppState, keyed `cc_state_v1`. Multi-account testing is a first-class Settings feature (needed to exercise referrals, ballots, buddies across two users). All claims in UI/docs say “per browser”; no fake server language. **Reversible** by design (D1).

## D3 — Auth: salted SHA-256 local accounts, demo accounts bypass
Real signup/login uses `crypto.subtle` (salted hash). Seeded demo profiles use a bypass login so visitors can feel the product instantly. Labeled demo-grade everywhere; production auth is part of the Supabase milestone.

## D4 — Decision scoring: disclosed linear formula, no black-box AI
`100 × (0.65·can + 0.15·maybe + 0.20·favorite) / roster` per the master brief, shown with counts, quorum, ties, and warnings. Ties stay ties; zero preference recommends nothing; overrides require a visible reason. Tests pin the arithmetic.

## D5 — Referral economics: symmetric bonus, capped abuse surface
+75 XP to both sides (outside the contribution cap — it is a growth bonus, not a contribution), 14-day referrer boost (directory ordering), 7-day welcome boost, Connector badge. Once per invitee, dedupe-keyed; self-referral blocked; farming reversals are a moderation action. Documented in BUSINESS_MODEL.md.

## D6 — Backgrounds (college/company) default to visible, privacy per person
The founder explicitly wants “which colleges/companies are attending” to be a visible draw. Default: shown. Each user can hide either field (or everything) at any time and aggregates re-compute instantly; hidden profiles count as “private” chips. Email, contact, and exact locations are never exposed.

## D7 — Registration honesty
“Planning to attend”, “I registered on the organizer’s site” (self-reported), and plan confirmations are distinct concepts. Opening a source link never registers anyone. Plans explicitly state they are not tickets. Seeds include a self-reported registration to demonstrate the state.

## D8 — Events: manual posting first, no scraping
Source URL is a first-class field; link import is deliberately absent in v0.1 (Luma/Meetup APIs require paid tiers/approval — see the master brief’s integration constraints). Corrections mark dependent plans review-needed and notify participants.

## D9 — Moderation: reports in, recorded outcomes out
Reports (events/users) → moderator console → action with mandatory note → author notified of removal, reporter notified of review (no details, no identity leak). Mass-report campaigns never auto-ban. Demo moderator account exists (`u_aarav`, siteRole moderator).

## D10 — Icons: emoji set for v0.1
One coherent icon *library* is preferred by the brand brief; an emoji set is used for zero-dependency delivery. Revisit before brand launch. Cosmetic, not structural.

## D11 — Seed data is fictional and labeled
Bengaluru-flavored fictional profiles/events with fake source URLs and relative future dates. No real-company endorsements (company names appear only as fictional employment), no fabricated testimonials. Production seeding guidance in LAUNCH_PLAYBOOK.md forbids importing demo activity.
