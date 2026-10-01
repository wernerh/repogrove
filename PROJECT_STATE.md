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
Run 37: RG-7/8/9 still no reply (RG-7 defaults 2026-10-03). Held off Phase 4 again;
added LocalAI to the AI grove instead (PR #86). Next: re-check RG-7/8/9 each run;
once resolved, pick up decision-free Phase 4 items.

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
- A1: "Grove"/repo pages are hand-authored/agent-drafted Markdown reviewed via PR, not
  auto-published scrapes (spec §3, §29).
- A2: No pilot customer — general public product; no contractual obligations to model.

## Not doing (yet)
Accounts, paid subscriptions, watchlists/alerts, recommendation engine, massive
crawling infra, admin CMS, live deploy — spec §30, §33, ADR-002.

## Timebox
Phases 2 and 3 both completed within budget; no Phase 3 item needed a split.

## Blockers and attempts
None blocking (rule 8). RG-7/8/9 open (see Next action) — Phase 4 stays stubbed on RG-8/RG-9 until answered (no auto-default, expensive-to-reverse).

## Milestones
- [x] 2026-09-27 — Repo bootstrapped; Phase 1 walking skeleton — #5, #6, #7
- [x] 2026-09-27/28 — Phase 2 ingestion (ADR-005, #16/17); star-growth chart (#18);
  self-hosted fonts (ADR-006); contributor counts.
- [x] 2026-09-29 — `/trending`/`/rising` (#19/#20); Grove Heat v1 (#21) — Phase 2 done.
  Phase 3 issues filed (#61-65).
- [x] 2026-09-29/30 — `/alternative/:slug` (#61), `/compare/:a/:b` (#62),
  sitemap/robots (#64), `/search` (#63, ADR-008), newsletter form UI (#65, PR #71),
  basic news widget (#72, PR #74) — Phase 3 MVP gate complete.
- [x] 2026-09-30/10-01 — Decision-free content: Developer Tools grove (#81);
  Self-Hosted grove +PocketBase/Appwrite (#83); alternatives.commercial slug-display
  fix (#84); backend-trio comparison pages (#85); LocalAI added to AI grove (#86).
- [ ] Phase 4+ — not yet scoped; RG-7/8/9 raised (issues #76-78), awaiting owner
