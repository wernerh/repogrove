# PROJECT_STATE

*Human-readable truth. ≤60 lines. Owned by the dev lane. Overflow → DECISIONS.md.*

## Goal and success test
Build RepoGrove: a curated discovery platform for OSS repos (Groves, repo intelligence,
alternatives, momentum, newsletter). MVP success test: a stranger lands on the
homepage, finds a repo or "alternative to X" page, and leaves knowing what it is,
whether it's active, what else they could use, and why they'd care — no account, DB
migration, or deploy target needed yet.

## Current phase
**Phase 3 — Search, SEO, alternatives, newsletter signup — COMPLETE (run 30).**
`docs/WORKPLAN.md`'s 17-item MVP gate (spec §30/PRODUCT.md) is now fully met; Phase 2
completed run 24.

## Next action (exactly one)
Run 62: RG-7/8/9 no reply (RG-7 defaults 2026-10-03T13:02:34Z). Cross-referenced all 4
groves vs. PRODUCT.md's named examples (Self-Hosted exhausted pending #125/#127); built
Open WebUI for AI, PR #128 — NOT merged, same issue #126 gate. Review caught a real
pre-merge error (claimed MIT; actual license is a modified BSD-3-Clause with a branding
clause since v0.6.6, not OSI-approved — fixed, re-reviewed PASS). Next: merge all 3 PRs
once #126 clears, apply RG-7's default if unanswered; AI's LiteLLM/Continue/Aider are
the next content gap.

## Decisions log
| Date | Decision | Why | Status | Reversibility |
|---|---|---|---|---|
| 2026-09-27 | Stack: Next.js/React/TS + Tailwind, Git-native MD content + Postgres/SQLite for volatile data | Owner spec + ADR-001 | LOCKED | expensive |
| 2026-09-27 | Hosting: Azure Storage static-website hosting (owner answered RG-2); app built with `output: "export"` from Phase 1 on | Owner reply + ADR-002 | ANSWERED | expensive |
| 2026-09-27 | Repo visibility: public | Owner confirmed ("happy with public") | ANSWERED | cheap |
| 2026-09-27 | RepositorySnapshot: committed SQLite (`data/repogrove.db`), not build-time regen | ADR-005 | LOCKED | cheap |
| 2026-09-29 | Grove Heat v1: star-growth-rate-only label, thresholds provisional | ADR-004 — other issue #21 inputs need new ingestion | PROVISIONAL | cheap |
| 2026-09-30 | Visual direction: editorial/content-forward (RG-4 defaulted, no owner reply) | Due date passed; formalizes existing DESIGN-SYSTEM.md/token work | DEFAULTED | cheap |
| 2026-09-30 | RG-7/8/9: hold Phase 4 until deployed? auth provider? public API scope now? | Phase 3 MVP gate complete; these gate Phase 4's expensive items (CLAUDE.md rule 6) | OPEN | cheap/expensive |

## Assumptions
- A1: "Grove"/repo pages are hand-authored/agent-drafted Markdown reviewed via PR, not auto-published scrapes (spec §3, §29).
- A2: No pilot customer — general public product; no contractual obligations to model.

## Not doing (yet)
Accounts, paid subscriptions, watchlists/alerts, recommendation engine, massive crawling infra, admin CMS, live deploy — spec §30, §33, ADR-002.

## Timebox
Phases 2 and 3 both completed within budget; no Phase 3 item needed a split.

## Blockers and attempts
PR #125/#127/#128 and main all hit the same Dependency vulnerability scan failure (issue
#126, no upstream fix); Lint/test/build/guardrails stay green. 3 open PRs also trip
Azure's staging quota on PR builds (not a merge gate, TECH-DEBT.md). Phase 4 stubbed.

## Milestones
- [x] 2026-09-27/30 — Phase 1 walking skeleton (#5-7); Phase 2 ingestion/metrics/
  Grove Heat v1 (#16-21); Phase 3 MVP gate: alternatives, comparisons, search,
  newsletter UI, news widget (#61-72).
- [x] 2026-09-30/10-03 — Decision-free content growth: dev-tools + Databases groves,
  all dangling alternative refs closed, full comparison matrices (#81-108); Pros/Cons
  truncation guard (#109); Immich/Portainer merged (#111/#121) — 4 groves/23 repos.
  Nextcloud/CasaOS/Open WebUI (#125/#127/#128, clean+reviewed) → 26 once #126 clears.
- [ ] Phase 4+ — not yet scoped; RG-7/8/9 raised (#76-78), awaiting owner
