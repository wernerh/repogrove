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
Run 23: shipped `/rising` (#20, PR #56, relative/percent star growth). Both data-gated
Phase 2 pages are done; only Phase 2 item left is ADR-004 (Heat, #21) — its own inputs
list includes signals not yet ingested (commit recency, release frequency). Next run:
scope v1 to what's already in `data/repogrove.db` (star/contributor growth, open
issues), document the rest as a v2 extension (rule 4 — list provisional decisions
before >1 day of effort), and timebox if still too large for one run.

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
stayed data-gated — a calendar-time blocker, not a failed attempt. Run 22: `/trending`
(PR #55). Run 23: `/rising` (PR #56). ADR-004 (#21) is the last Phase 2 item — split
ADR+v1-signals from a v2/new-ingestion follow-up if it exceeds ~2x a normal run.

## Blockers and attempts
None blocking (rule 8). Dependabot #29 (eslint) blocked upstream (eslint-plugin-react
gap); #28 (typescript) resolved via revert (PR #45) + ignore rule. 5 open dependabot
PRs (#29, #46-49) outside this lane's merge gate — owner merges these directly.

## Milestones
- [x] 2026-09-27 — Repo bootstrapped; Phase 1 walking skeleton — #5, #6, #7
- [x] 2026-09-27 — Phase 2 ingestion job + schema (ADR-005) — #16/17, PR #22; repos 2→5
- [x] 2026-09-28 — CI red fixed (#26, PR #27); star-growth chart (#18, PR #31); self-hosted fonts (ADR-006, PR #32); ingestion scripts to TS (PR #35); contributor counts (PR #37); watchers/subscribers_count fix (PR #38); typescript-7 CI-red revert (PR #45).
- [x] 2026-09-29 — `/trending` (#19, PR #55) + `/rising` (#20, PR #56): absolute/relative star-growth rankings.
- [ ] Phase 3 — search, SEO, newsletter signup
