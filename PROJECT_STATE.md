# PROJECT_STATE

*Human-readable truth. ≤60 lines. Owned by the dev lane. Overflow → DECISIONS.md.*

## Goal and success test
Build RepoGrove: a curated discovery platform for OSS repos (Groves, repo intelligence,
alternatives, momentum, newsletter). MVP success test: a stranger lands on the
homepage, finds a repo or "alternative to X" page, and leaves knowing what it is,
whether it's active, what else they could use, and why they'd care — no account, DB
migration story, or deploy target needed yet.

## Current phase
**Phase 2 — Ingestion & metrics**. Phase 1 landed in PR #10.

## Next action (exactly one)
Star-growth chart (#18, PR #31) shipped this run, computing growth over whatever
history exists rather than requiring 3+ days — didn't wait on data maturity. Next:
`/trending` (#19) / `/rising` (#20), which *do* need real cross-repo history per the
Phase 2 gate. `data/repogrove.db` now has 2/3 days (2026-09-27, -28, all 5 repos) after
this run manually dispatched `ingestion.yml` — its daily cron hasn't self-fired in 2
days (GitHub Actions scheduler quirk, cron syntax is correct, not PR-fixable). Keep
manually dispatching each run until cron fires or 1 more day clears the gate.

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
Phase 2 ingestion & metrics: run 1 shipped the ingestion job + schema (PR #22); run 2
shipped the star-growth chart (PR #31). `/trending`/`/rising`/Heat (#19-#21) next, once
cron delivers a 3rd day (or another manual dispatch does) — re-timebox if still stuck
after 2 more runs.

## Blockers and attempts
None blocking (rule 8). `ingestion.yml`'s cron hasn't self-fired in 2 days — worked
around via manual `workflow_dispatch`; not yet worth an owner email.

## Milestones
- [x] 2026-09-27 — Repo bootstrapped; Phase 1 walking skeleton (homepage + Grove/repo
  pages, static export for Azure Storage hosting) — #5, #6, #7
- [x] 2026-09-27 — Phase 2 ingestion job + `RepositorySnapshot` schema (ADR-005) — #16,
  #17, PR #22; repos expanded 2→5 (PR #23).
- [x] 2026-09-28 — CI red on `main` fixed (react/react-dom peer + node:sqlite test env,
  #26, PR #27); dependabot groups react/react-dom now to prevent a repeat.
- [x] 2026-09-28 — Star-growth chart on repo pages (#18, PR #31).
- [ ] Phase 3 — search, SEO, newsletter signup
