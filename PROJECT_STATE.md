# PROJECT_STATE

*Human-readable truth. ≤60 lines. Owned by the dev lane. Overflow → DECISIONS.md.*

## Goal and success test
Build RepoGrove: a curated discovery platform for OSS repos (Groves, repo intelligence,
alternatives, momentum, newsletter). MVP success test: a stranger lands on the
homepage, finds a repo or "alternative to X" page, and leaves knowing what it is,
whether it's active, what else they could use, and why they'd care — no account, DB
migration, or deploy target needed yet.

## Current phase
**Phase 3 — Search, SEO, alternatives, newsletter signup**. Phase 2 completed run 24.
NOT gate-complete yet: `docs/WORKPLAN.md`'s Phase 3 gate is the 17-item MVP list (spec
§30/PRODUCT.md), and item 11 ("basic news") was never filed until #72 (run 29).

## Next action (exactly one)
Run 29 shipped the newsletter signup form UI (#65, PR #71). While closing out, found
MVP-list item 11 ("basic news", spec §11) was never scoped into an issue across 28 runs
— filed #72 (v1: GitHub Releases only, no new vendor/licensing risk). Next action: #72.

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
Phase 2 complete (run 24, within budget). Every shipped Phase 3 item (#61/#62/#64/#63/#65)
landed within budget, no split needed. No timebox set on #72 (basic news) yet.

## Blockers and attempts
None blocking (rule 8). Dependabot #29 (eslint) blocked upstream (eslint-plugin-react
gap); #28 (typescript) resolved via revert (PR #45) + ignore rule. 5 open dependabot
PRs (#29, #46-49) outside this lane's merge gate — owner merges these directly.

## Milestones
- [x] 2026-09-27 — Repo bootstrapped; Phase 1 walking skeleton — #5, #6, #7
- [x] 2026-09-27/28 — Phase 2 ingestion (ADR-005, #16/17); CI fixes; star-growth chart
  (#18); self-hosted fonts (ADR-006); contributor counts; watchers fix.
- [x] 2026-09-29 — `/trending` (#19) + `/rising` (#20); Grove Heat v1 (#21, ADR-004) —
  Phase 2 complete. Phase 3 issues filed (#61-65).
- [x] 2026-09-29 — `/alternative/:slug` (#61); `/compare/:a/:b` (#62); sitemap/robots
  (#64).
- [x] 2026-09-30 — `/search` (#63, ADR-008); newsletter signup form UI (#65, PR #71).
- [ ] Phase 3 remaining — basic news widget, v1 GitHub-Releases-only (#72)
