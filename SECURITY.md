# Security policy

## Supported versions
| Version | Supported |
|---|---|
| 0.1.x | ✅ |

## Reporting a vulnerability
Email the maintainer via GitHub (@siddhant-pardeshi) or open a [security advisory](https://github.com/siddhant-pardeshi/communityconnect/security/advisories/new). Do **not** open public issues for vulnerabilities. Expect an initial response within 7 days; coordinated disclosure after a fix ships.

## Current security posture (v0.1, honest)
- Client-side only: no server, so classic server attack surface (SQLi, SSRF, broken access control at API level) does not apply **yet**.
- Passwords are salted + SHA-256 hashed locally via `crypto.subtle`; storage is per-browser. This is demo-grade auth by design — production auth (Supabase) must not reuse it.
- The QR/`href` pipeline never executes untrusted markup: user links render as `rel="noreferrer"` anchors; user text renders as text nodes (React escapes by default). User-supplied SVG/HTML is never rendered raw.
- `target="_blank"` links all carry `rel="noreferrer"`.

## When the backend lands (v0.2 checklist)
RLS on every table, secrets server-side only, rate limits in durable storage, CSRF/origin checks on mutations, upload magic-byte checks, SSRF-safe fetch boundary (if URL import ships), dependency + secrets scanning in CI, key rotation runbook.
