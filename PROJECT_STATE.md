# PROJECT_STATE

*Human-readable truth. ≤60 lines. Owned by the dev lane. Overflow → DECISIONS.md.*

## Goal and success test
Build RepoGrove: a curated discovery platform for open-source repositories (Groves,
repo intelligence, alternatives, momentum, newsletter). Success test for the MVP phase:
a stranger can land on the homepage, find a repo or "alternative to X" page, and leave
knowing what it is, whether it's active, what else they could use, and why they'd care —
without the app needing an account, a database migration story, or a deploy target yet.

## Current phase
**Phase 2 — Ingestion & metrics** (started this run). Phase 1 landed in PR #10.

## Next action (exactly one)
PR #23 merged: tracked repos expanded 2→5 (added LangChain, vLLM, Coolify) to meet
`docs/WORKPLAN.md`'s Phase 2 gate minimum; `ingestion.yml` manually triggered right
after merge, so `data/repogrove.db` now has day-1 snapshot rows for all 5 repos
(2026-09-27) — daily cron continues from here. Next: once 3+ consecutive days of real
history exist for at least one repo, build the star-growth chart on `/repo/[slug]`
reading `getSnapshotHistory` (#18) — check `data/repogrove.db` row-count-per-repo
before starting; if under 3 days, that's a quiet-run-is-a-success wait, not a blocker.

## Decisions log
| Date | Decision | Why | Status | Reversibility |
|---|---|---|---|---|
| 2026-09-27 | Stack: Next.js/React/TS + Tailwind, Git-native MD content + Postgres/SQLite for volatile data | Owner spec + ADR-001 | LOCKED | expensive |
| 2026-09-27 | Hosting: Azure Storage static-website hosting (owner answered RG-2); app built with `output: "export"` from Phase 1 on | Owner reply + ADR-002 | ANSWERED | expensive |
| 2026-09-27 | Repo visibility: public | Owner confirmed ("happy with public") | ANSWERED | cheap |
| 2026-09-27 | RepositorySnapshot: committed SQLite (`data/repogrove.db`), not build-time regen | ADR-005 | LOCKED | cheap |

## Assumptions
- A1: "Grove" content and repo pages are hand-authored/agent-drafted Markdown reviewed via
  PR, not auto-published scrapes (per spec §3, §29).
- A2: No pilot customer — general public product; no contractual obligations to model.
- A3: Newsletter and community-submission features are Phase 2, not MVP (per spec §30–31).

## Not doing (yet)
Accounts, paid subscriptions, watchlists/alerts, elaborate recommendation engine, massive
crawling infra, admin CMS, live deploy — see spec §30, §33 and ADR-002.

## Timebox
Phase 1 walking skeleton: done in 1 dev-lane run. Phase 2 ingestion & metrics: 2
dev-lane runs (4h) before re-scoping if not done — run 1 shipped ingestion job + schema
(PR #22, merged); run 2 covers the star-growth chart, once history exists to chart.

## Blockers and attempts
None — PR #23 (5-repo expansion) merged clean this run, all CI green; ingestion
manually triggered post-merge, day-1 history now exists for all 5 repos.

## Milestones
- [x] 2026-09-27 — Repo created, factory bootstrapped
- [x] 2026-09-27 — Phase 1 walking skeleton (homepage + Grove/repo pages, static content,
  static export for Azure Storage hosting) — #5, #6, #7
- [x] 2026-09-27 — Phase 2 ingestion job + `RepositorySnapshot` schema (ADR-005) — #16,
  #17, PR #22. Daily ingestion workflow now scheduled.
- [x] 2026-09-27 — Tracked repos expanded 2→5 (PR #23), meeting WORKPLAN's Phase 2 gate
  minimum; chart/trending/rising/heat (#18-#21) still open, gated on 3+ days of history.
- [ ] Phase 3 — search, SEO, newsletter signup
