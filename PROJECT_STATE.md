# PROJECT_STATE

*Human-readable truth. ≤60 lines. Owned by the dev lane. Overflow → DECISIONS.md.*

## Goal and success test
Build RepoGrove: a curated discovery platform for OSS repos (Groves, repo intelligence,
alternatives, momentum, newsletter). MVP success test: a stranger lands on the
homepage, finds a repo or "alternative to X" page, and leaves knowing what it is,
whether it's active, what else they could use, and why they'd care — no account, DB
migration, or deploy target needed yet.

## Current phase
**Phase 3 — Search, SEO, alternatives, newsletter signup**. Phase 2 completed run 24
(all 6 ROADMAP items checked, see Milestones). Phase 3 issues filed run 25 (#61-65,
mirroring how #5-7/#16-21 mirrored Phase 1/2's ROADMAP rows).

## Next action (exactly one)
Run 26 shipped `/compare/:a/:b` (#62, PR #TBD). Next: #64 (sitemap/SEO) is unblocked.
#63 (search) needs a short ADR first (`output: "export"` has no server runtime for
DB-backed FTS). #65 (newsletter) is owner-decision-blocked on storage/vendor past its
form-UI-only first PR.

## Decisions log
| Date | Decision | Why | Status | Reversibility |
|---|---|---|---|---|
| 2026-09-27 | Stack: Next.js/React/TS + Tailwind, Git-native MD content + Postgres/SQLite for volatile data | Owner spec + ADR-001 | LOCKED | expensive |
| 2026-09-27 | Hosting: Azure Storage static-website hosting (owner answered RG-2); app built with `output: "export"` from Phase 1 on | Owner reply + ADR-002 | ANSWERED | expensive |
| 2026-09-27 | Repo visibility: public | Owner confirmed ("happy with public") | ANSWERED | cheap |
| 2026-09-27 | RepositorySnapshot: committed SQLite (`data/repogrove.db`), not build-time regen | ADR-005 | LOCKED | cheap |
| 2026-09-29 | Grove Heat v1: star-growth-rate-only label, thresholds provisional | ADR-004 — other issue #21 inputs need new ingestion | PROVISIONAL | cheap |

## Assumptions
- A1: "Grove"/repo pages are hand-authored/agent-drafted Markdown reviewed via PR, not
  auto-published scrapes (spec §3, §29).
- A2: No pilot customer — general public product; no contractual obligations to model.
- A3: Newsletter/community-submission features are Phase 2, not MVP (spec §30-31).

## Not doing (yet)
Accounts, paid subscriptions, watchlists/alerts, recommendation engine, massive
crawling infra, admin CMS, live deploy — see spec §30, §33 and ADR-002.

## Timebox
Phase 2 complete (run 24, within budget). Phase 3's first item (`/alternative/:slug`,
#61) shipped run 25, within budget, no split needed. No timebox set on the remaining
4 Phase 3 items yet.

## Blockers and attempts
None blocking (rule 8). Dependabot #29 (eslint) blocked upstream (eslint-plugin-react
gap); #28 (typescript) resolved via revert (PR #45) + ignore rule. 5 open dependabot
PRs (#29, #46-49) outside this lane's merge gate — owner merges these directly.

## Milestones
- [x] 2026-09-27 — Repo bootstrapped; Phase 1 walking skeleton — #5, #6, #7
- [x] 2026-09-27 — Phase 2 ingestion job + schema (ADR-005) — #16/17, PR #22; repos 2→5
- [x] 2026-09-28 — CI red fixed (#26, PR #27); star-growth chart (#18, PR #31); self-hosted fonts (ADR-006, PR #32); ingestion scripts to TS (PR #35); contributor counts (PR #37); watchers/subscribers_count fix (PR #38); typescript-7 CI-red revert (PR #45).
- [x] 2026-09-29 — `/trending` (#19, PR #55) + `/rising` (#20, PR #56): absolute/relative star-growth rankings.
- [x] 2026-09-29 — Grove Heat v1 (#21, PR #59): star-growth-rate momentum label — Phase 2 complete.
- [x] 2026-09-29 — Phase 3 issues filed (#61-65); `/alternative/:slug` shipped (#61, PR #66).
- [x] 2026-09-29 — `/compare/:a/:b` shipped (#62, PR #TBD): comparison pages.
- [ ] Phase 3 remaining — search, SEO, newsletter signup (#63-65)
