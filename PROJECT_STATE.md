# PROJECT_STATE

*Human-readable truth. ≤60 lines. Owned by the dev lane. Overflow → DECISIONS.md.*

## Goal and success test
Build RepoGrove: a curated discovery platform for OSS repos (Groves, repo intelligence,
alternatives, momentum, newsletter). MVP success test: a stranger lands on the
homepage, finds a repo or "alternative to X" page, and leaves knowing what it is,
whether it's active, what else they could use, and why they'd care — no account, DB
migration story, or deploy target needed yet.

## Current phase
**Phase 2 — Ingestion & metrics** (started this run). Phase 1 landed in PR #10.

## Next action (exactly one)
Still gated on data maturity: `data/repogrove.db` has only day-1 history (2026-09-27),
all 5 repos; daily `ingestion.yml` (`17 4 * * *` UTC) hadn't fired its 2nd run as of this
run (03:11 UTC, before today's 04:17 slot). Once 3+ consecutive days of history exist
for at least one repo, build the star-growth chart on `/repo/[slug]` via
`getSnapshotHistory` (#18) — check row-count-per-repo first; under 3 days is a
quiet-run, not a blocker.

## Decisions log
| Date | Decision | Why | Status | Reversibility |
|---|---|---|---|---|
| 2026-09-27 | Stack: Next.js/React/TS + Tailwind, Git-native MD content + Postgres/SQLite for volatile data | Owner spec + ADR-001 | LOCKED | expensive |
| 2026-09-27 | Hosting: Azure Storage static-website hosting (owner answered RG-2); app built with `output: "export"` from Phase 1 on | Owner reply + ADR-002 | ANSWERED | expensive |
| 2026-09-27 | Repo visibility: public | Owner confirmed ("happy with public") | ANSWERED | cheap |
| 2026-09-27 | RepositorySnapshot: committed SQLite (`data/repogrove.db`), not build-time regen | ADR-005 | LOCKED | cheap |

## Assumptions
- A1: "Grove"/repo pages are hand-authored/agent-drafted Markdown reviewed via PR, not
  auto-published scrapes (per spec §3, §29).
- A2: No pilot customer — general public product; no contractual obligations to model.
- A3: Newsletter/community-submission features are Phase 2, not MVP (spec §30–31).

## Not doing (yet)
Accounts, paid subscriptions, watchlists/alerts, elaborate recommendation engine, massive
crawling infra, admin CMS, live deploy — see spec §30, §33 and ADR-002.

## Timebox
Phase 2 ingestion & metrics: 2 dev-lane runs (4h) before re-scoping — run 1 shipped the
ingestion job + schema (PR #22); run 2 covers the star-growth chart, once history exists.

## Blockers and attempts
None — waiting on data maturity (not a blocker per rule 8). CI on `main` was red this
run (issue #26 + a vitest-environment regression) — fixed and merged as PR #27,
unblocking design's PR #25. Process note (TECH-DEBT.md): this run's lock-acquire commit
used a placeholder timestamp, so security's scheduled run saw it as stale and took the
lock over mid-run — no work lost; always write the real UTC time.

## Milestones
- [x] 2026-09-27 — Repo bootstrapped; Phase 1 walking skeleton (homepage + Grove/repo
  pages, static export for Azure Storage hosting) — #5, #6, #7
- [x] 2026-09-27 — Phase 2 ingestion job + `RepositorySnapshot` schema (ADR-005) — #16,
  #17, PR #22 (daily cron scheduled); repos expanded 2→5 (PR #23), Phase 2 gate minimum
  met; chart/trending/rising/heat (#18-#21) open, gated on 3+ days of history.
- [x] 2026-09-28 — CI red on `main` fixed (react/react-dom peer + node:sqlite test env,
  #26, PR #27); dependabot groups react/react-dom now to prevent a repeat.
- [ ] Phase 3 — search, SEO, newsletter signup
