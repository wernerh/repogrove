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
`/trending` (#19) / `/rising` (#20) / Heat (#21) still lead Phase 2 but are still
data-gated: `data/repogrove.db` is still at 2/3 days (same calendar day as last run —
no new day could accumulate) and `ingestion.yml`'s cron still hasn't self-fired (0
scheduled runs since 2026-09-27; both runs manual `workflow_dispatch`). This run did
unblocked tech debt instead: real self-hosted fonts via `next/font/google` (PR #32,
ADR-006). Next run: check for a 3rd calendar day of history (dispatch `ingestion.yml`
if not) — once present, start `/trending` (#19).

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
- A3: Newsletter/community-submission features are Phase 2, not MVP (spec §30–31).

## Not doing (yet)
Accounts, paid subscriptions, watchlists/alerts, elaborate recommendation engine, massive
crawling infra, admin CMS, live deploy — see spec §30, §33 and ADR-002.

## Timebox
Phase 2: run 1 shipped ingestion+schema (PR #22); run 2 the star-growth chart (PR #31);
run 3 (this run) did unblocked tech debt (fonts, PR #32) since #19-21 stayed
data-gated. Re-timebox #19-21 if still stuck after 1 more run.

## Blockers and attempts
None blocking (rule 8). `ingestion.yml`'s cron still hasn't self-fired (2 days, 0
scheduled runs) — worked around via manual dispatch; not yet worth an owner email.
Dependabot #28/#29 (typescript 7.0.2/eslint 10.11.0) fail their own CI, not merged;
#30 (jsdom 30.1.1) is green but outside this run's merge gate — see TECH-DEBT.md.

## Milestones
- [x] 2026-09-27 — Repo bootstrapped; Phase 1 walking skeleton — #5, #6, #7
- [x] 2026-09-27 — Phase 2 ingestion job + schema (ADR-005) — #16/17, PR #22; repos 2→5
- [x] 2026-09-28 — CI red on `main` fixed (react/react-dom peer + node:sqlite test env,
  #26, PR #27); dependabot groups react/react-dom now to prevent a repeat.
- [x] 2026-09-28 — Star-growth chart on repo pages (#18, PR #31).
- [x] 2026-09-28 — Real self-hosted fonts wired in (ADR-006, PR #32).
- [ ] Phase 3 — search, SEO, newsletter signup
