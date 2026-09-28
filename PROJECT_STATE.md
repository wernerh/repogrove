# PROJECT_STATE

*Human-readable truth. ≤60 lines. Owned by the dev lane. Overflow → DECISIONS.md.*

## Goal and success test
Build RepoGrove: a curated discovery platform for OSS repos (Groves, repo intelligence,
alternatives, momentum, newsletter). MVP success test: a stranger lands on the
homepage, finds a repo or "alternative to X" page, and leaves knowing what it is,
whether it's active, what else they could use, and why they'd care — no account, DB
migration, or deploy target needed yet.

## Current phase
**Phase 2 — Ingestion & metrics**. Phase 1 landed in PR #10.

## Next action (exactly one)
`/trending` (#19) still data-gated (`data/repogrove.db` at 2/3 calendar days, unchanged
since run 11; today's ingestion already fired, tomorrow adds day 3). Run 13: no other
safe work found — CI green, 0 open dev PRs, #20/#21 share #19's gate, #28/#29 unchanged
since upstream-blocked diagnosis. Local lint/test(75/75)/build (known font-fetch gap)
re-verified; closed a stale TECH-DEBT note (PR #37 merged fine, just unmarked). Quiet
run per rule 8. Next run: check for day 3, then start `/trending`.

## Decisions log
| Date | Decision | Why | Status | Reversibility |
|---|---|---|---|---|
| 2026-09-27 | Stack: Next.js/React/TS + Tailwind, Git-native MD content + Postgres/SQLite for volatile data | Owner spec + ADR-001 | LOCKED | expensive |
| 2026-09-27 | Hosting: Azure Storage static-website hosting (owner answered RG-2); app built with `output: "export"` from Phase 1 on | Owner reply + ADR-002 | ANSWERED | expensive |
| 2026-09-27 | Repo visibility: public | Owner confirmed ("happy with public") | ANSWERED | cheap |
| 2026-09-27 | RepositorySnapshot: committed SQLite (`data/repogrove.db`), not build-time regen | ADR-005 | LOCKED | cheap |

## Assumptions
- A1: "Grove"/repo pages are hand-authored/agent-drafted Markdown reviewed via PR, not
  auto-published scrapes (spec §3, §29).
- A2: No pilot customer — general public product; no contractual obligations to model.
- A3: Newsletter/community-submission features are Phase 2, not MVP (spec §30-31).

## Not doing (yet)
Accounts, paid subscriptions, watchlists/alerts, recommendation engine, massive
crawling infra, admin CMS, live deploy — see spec §30, §33 and ADR-002.

## Timebox
Phase 2: run 1 ingestion+schema (PR #22); run 2 star-growth chart (PR #31); runs 3-6
did unblocked tech debt/pipeline work (fonts PR #32, ingestion-to-TS PR #35,
contributor counts PR #37, watchers/subscribers_count fix PR #38) since #19-21 stayed
data-gated — a calendar-time blocker, not a failed attempt. Start `/trending` (#19)
once 3+ days of history exists.

## Blockers and attempts
None blocking (rule 8). `ingestion.yml`'s daily cron is confirmed working (fired
2026-09-28, 10:53 UTC); today's 2nd calendar day is captured, no new snapshot day yet.
Dependabot #28/#29 blocked upstream (typescript-eslint / eslint-plugin-react version
gaps), not fixable here.

## Milestones
- [x] 2026-09-27 — Repo bootstrapped; Phase 1 walking skeleton — #5, #6, #7
- [x] 2026-09-27 — Phase 2 ingestion job + schema (ADR-005) — #16/17, PR #22; repos 2→5
- [x] 2026-09-28 — CI red fixed (#26, PR #27); star-growth chart (#18, PR #31); self-hosted fonts (ADR-006, PR #32); ingestion scripts to TS (PR #35); contributor counts (PR #37); watchers/subscribers_count fix (PR #38).
- [ ] Phase 3 — search, SEO, newsletter signup
