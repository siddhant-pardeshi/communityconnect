# Contributing to CommunityConnect

Thanks for helping communities decide better. Keep contributions useful, tested, and honest.

## Ground rules
- **Truth in UI:** never add copy implying a feature that doesn’t exist (no fake “verified” badges, no invented counts, no placeholder buttons that pretend to work).
- **Privacy by default:** new fields need a privacy story — who sees this, and where can a user hide it?
- **Domain logic goes in `app/src/lib/`** as pure, tested functions. UI stays thin.
- **Design system:** use existing tokens/classes in `app/src/styles/global.css`; follow WCAG-informed practice (contrast, focus, reduced motion, no color-only states).

## Workflow
1. Open an issue describing the problem before a big PR.
2. Fork/branch from `main`; one logical change per PR.
3. Run locally:
   ```bash
   cd app && npm install
   npm run test      # vitest
   npm run build     # typecheck + build
   ```
4. PRs: describe what changed and *how you verified it*. Screenshots for UI changes (light + dark).
5. Every test/behavior change needs matching tests in `app/tests/`.

## Areas that especially need help
- The Supabase swap (see `docs/DECISIONS.md` D1) — schema + RLS + migration parity with `store.ts`.
- Accessibility passes at 360px width and with screen readers.
- Non-English copy readiness (strings are centralized in components; keep them extractable).

## Reporting problems
Security: see SECURITY.md (do not open public issues for vulnerabilities).
Conduct: the in-app moderation flow or CODE_OF_CONDUCT.md.
