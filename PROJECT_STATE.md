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
`/trending` (#19) still data-gated (2/3 calendar days; today's 04:17 UTC ingestion still
hadn't fired as of this run's checks ~08:48-08:50 UTC, ~4h31-33m late — within past
lateness range, e.g. run 10's 6h37m delay). Run 21: quiet — `main` CI green, 0 dev PRs
open, 0 new dependabot PRs since #49, RG-4 re-checked (no reply since 2026-09-27
17:32:04Z, due 2026-09-30 — design lane's call). Next: check for day 3, then start
`/trending`.

## Decisions log
| Date | Decision | Why | Status | Reversibility |
|---|---|---|---|---|
| 2026-09-27 | Stack: Next.js/React/TS + Tailwind, Git-native MD content + Postgres/SQLite for volatile data | Owner spec + ADR-001 | LOCKED | expensive |
| 2026-09-27 | Hosting: Azure Storage static-website hosting (owner answered RG-2); app built with `output: "export"` from Phase 1 on | Owner reply + ADR-002 | ANSWERED | expensive |
| 2026-09-27 | Repo visibility: public | Owner confirmed ("happy with public") | ANSWERED | cheap |
| 2026-09-27 | RepositorySnapshot: committed SQLite (`data/repogrove.db`), not build-time regen | ADR-005 | LOCKED | cheap |
| 2026-09-28 | RG-6: grant `design-screenshots.yml` a scoped `contents:write` job to commit real screenshots | Design lane's sandbox can't reach GitHub artifact storage to review them any other way | ANSWERED ("go ahead") — see decisions.yaml | expensive |

## Assumptions
- A1: "Grove"/repo pages are hand-authored/agent-drafted Markdown reviewed via PR, not
  auto-published scrapes (spec §3, §29).
- A2: No pilot customer — general public product; no contractual obligations to model.
- A3: Newsletter/community-submission features are Phase 2, not MVP (spec §30-31).

## Not doing (yet)
Accounts, paid subscriptions, watchlists/alerts, recommendation engine, massive
crawling infra, admin CMS, live deploy — see spec §30, §33 and ADR-002.

## Timebox
Phase 2: run 1 ingestion+schema (PR #22); run 2 star-growth chart (PR #31); runs 3-6, 16
did unblocked tech debt/pipeline/CI work (PRs #32, #35, #37, #38, #45) since #19-21
stayed data-gated — a calendar-time blocker, not a failed attempt. #21 (ADR-004 Heat
methodology) explicitly needs real history to validate thresholds against too (per its
own issue body), so it's not separately actionable ahead of #19/#20. Start `/trending`
(#19) once 3+ days of history exists.

## Blockers and attempts
None blocking (rule 8). `ingestion.yml`'s cron works; 2nd calendar day captured, no new
snapshot day yet. Dependabot #29 (eslint) blocked upstream (eslint-plugin-react gap);
#28 (typescript) resolved via revert (PR #45) + ignore rule. 5 open dependabot PRs
(#29, #46-49) all outside this lane's merge gate — owner merges these directly.

## Milestones
- [x] 2026-09-27 — Repo bootstrapped; Phase 1 walking skeleton — #5, #6, #7
- [x] 2026-09-27 — Phase 2 ingestion job + schema (ADR-005) — #16/17, PR #22; repos 2→5
- [x] 2026-09-28 — CI red fixed (#26, PR #27); star-growth chart (#18, PR #31); self-hosted fonts (ADR-006, PR #32); ingestion scripts to TS (PR #35); contributor counts (PR #37); watchers/subscribers_count fix (PR #38); typescript-7 CI-red revert (PR #45).
- [ ] Phase 3 — search, SEO, newsletter signup
