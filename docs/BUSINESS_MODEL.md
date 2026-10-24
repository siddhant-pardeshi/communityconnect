# Business model — hypotheses under test

> Nothing here is validated pricing or a profit guarantee. It is the founder’s stated direction expressed as testable hypotheses.

## Phase 1 — Free growth (now)
Everything is free: discovery, circles, Decision Rooms, buddies, connections, safety tools, networking card, referral rewards. Goal: density of real plans in one city, not revenue.

**Why free is safe:** core compute cost per user at this stage is ~$0 (static hosting + client compute). The costs that matter later (DB, email, moderation time) scale with *active groups*, which is exactly what the pilot measures.

## Phase 2 — Minimal subscription (after meaningful scale)
| Tier | Price hypothesis (India-first) | Includes | Never paywalled |
|---|---|---|---|
| Free | ₹0 | Everything an individual or small circle needs | — |
| Community Pro | **₹99/mo** (hypothesis) | Bigger circles, templates, digests, aggregate insights, priority support | — |
| Organizer/Team | **₹499/mo** (hypothesis) | Multi-community admin, co-branded pages, staff roles, exports | — |

- **Subsidy rule (founder commitment):** students and people between roles get Pro free or heavily subsidized, verified by lightweight means (e.g., institutional email) — never by demanding government IDs.
- Safety, privacy, blocking, reporting, and core planning stay free permanently. Trust is the product; it is not for sale.
- Sponsored placements, if ever, are labeled and excluded from organic recommendations.

## Revenue-quality rules
- No selling user data. No ads on private surfaces. No “verified investor/expert” badges for sale.
- Billing (P1) must use a provider eligible for the operating entity, hosted checkout, signed webhooks, server-side entitlements, test mode first.
- While billing is unbuilt, the in-app pricing page collects *interest only* and says so.

## Cost sketch (facts to verify at scale)
| Users (MAU) | Static hosting | DB/email (Supabase-class) | Human (moderation/support) |
|---|---|---|---|
| 100 | $0 | $0 (free tier) | founder |
| 1,000 | ~$0 | ~$25/mo | founder + 1 mod |
| 10,000 | ~$0–20/mo | ~$100–300/mo | paid moderation hours |

Hosting a commercial product on a free tier long-term violates most providers’ fair-use rules — budget the paid tier before promoting growth. Verify current pricing at implementation time.

## Exit-readiness hygiene (founder’s long-term option)
Apache-2.0 + copyright notices kept, dependency inventory, account/registry ownership documented, privacy records, clean contributor history. No valuation promises; transaction terms get case-specific review.
