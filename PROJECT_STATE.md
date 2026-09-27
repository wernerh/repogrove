# PROJECT_STATE

*Human-readable truth. ≤60 lines. Owned by the dev lane. Overflow → DECISIONS.md.*

## Goal and success test
Build RepoGrove: a curated discovery platform for open-source repositories (Groves,
repo intelligence, alternatives, momentum, newsletter). Success test for the MVP phase:
a stranger can land on the homepage, find a repo or "alternative to X" page, and leave
knowing what it is, whether it's active, what else they could use, and why they'd care —
without the app needing an account, a database migration story, or a deploy target yet.

## Current phase
**Phase 0 — Discovery & bootstrap** (this PR). Next: **Phase 1 — Walking skeleton.**

## Next action (exactly one)
Stand up the Next.js walking skeleton: static homepage + one Grove page + one repo page,
rendering from hand-written Markdown fixtures in `/content`, no database yet, no live
ingestion yet. See `docs/WORKPLAN.md` Phase 1.

## Decisions log
| Date | Decision | Why | Status | Reversibility |
|---|---|---|---|---|
| 2026-09-27 | Stack: Next.js/React/TS + Tailwind, Git-native MD content + Postgres/SQLite for volatile data | Owner spec + ADR-001 | LOCKED | expensive |
| 2026-09-27 | Hosting: undecided, deploy jobs disabled | Owner spec + ADR-002 | PROVISIONAL | expensive |
| 2026-09-27 | Repo visibility: public | No PII in content repo; supports future community contribution | PROVISIONAL | cheap |

## Assumptions
- A1: "Grove" content and repo pages are hand-authored/agent-drafted Markdown reviewed via
  PR, not auto-published scrapes (per spec §3, §29).
- A2: No pilot customer — general public product; no contractual obligations to model.
- A3: Newsletter and community-submission features are Phase 2, not MVP (per spec §30–31).

## Not doing (yet)
Accounts, paid subscriptions, watchlists/alerts, elaborate recommendation engine, massive
crawling infra, admin CMS, live deploy — see spec §30, §33 and ADR-002.

## Timebox
Phase 0 bootstrap: this run. Phase 1 walking skeleton: 2 dev-lane runs (4h) before
re-scoping if not done.

## Blockers and attempts
None yet — first run.

## Milestones
- [x] 2026-09-27 — Repo created, factory bootstrapped
- [ ] Phase 1 — walking skeleton (homepage + 1 Grove + 1 repo page, static content)
- [ ] Phase 2 — GitHub ingestion → SQLite/Postgres, trending/rising
- [ ] Phase 3 — search, SEO, newsletter signup
