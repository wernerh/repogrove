# ROADMAP.md

Phased roadmap, mirrored as GitHub issues (labelled `phase-0`…`phase-N`). See
`docs/WORKPLAN.md` for the gate each phase must pass before the next starts. Each roadmap
issue follows: Problem / Proposed solution / Scope / Non-goals / Acceptance criteria /
Technical considerations / Testing / Security / Rollout / Documentation / Dependencies.

## Phase 0 — Discovery & bootstrap
- [x] Factory bootstrap (this PR)

## Phase 1 — Walking skeleton
- [x] Scaffold Next.js + TypeScript + Tailwind app in `/src` (#5)
- [x] Content loader: read `/content` Markdown + YAML frontmatter at build time (#6)
- [x] Homepage (minimal — links to the one Grove and one repo page) (#7)
- [x] One Grove page (`/grove/ai`) rendering from `content/groves/ai.md` (#7)
- [x] One repo page (`/repo/ollama`) rendering from `content/repos/ollama.md` (#7)
- [x] Smoke tests for all three pages; CI lint/test/build green (#7)

## Phase 2 — Ingestion & metrics
- [x] GitHub API ingestion job (GitHub Actions) → snapshot storage (#16, PR #22)
- [x] `RepositorySnapshot` schema + SQLite storage (ADR-005) (#17, PR #22)
- [x] Star-growth chart on repo pages (#18, PR #31)
- [x] Trending page (`/trending`) (#19, PR #55)
- [x] Rising page (`/rising`) — fast growth, not just absolute size (#20, PR #56)
- [x] Momentum/"Heat" methodology implemented + documented (ADR-004) (#21, PR #59) — v1
  scope: star-growth-rate-only label (see ADR-004 for the v2 revisit list: commit
  recency, release frequency, external mentions all need new ingestion)

## Phase 3 — Search, SEO, alternatives, newsletter signup
- [x] Alternatives pages (`/alternative/:slug`) — open-source / free / commercial + best fit (#61, PR #66)
- [x] Comparison pages (`/compare/:a/:b`) (#62, PR #67)
- [x] Full-text search across repos/Groves/alternatives (#63, PR #70) — v1 scope: static
  build-time index, client-side substring matching (ADR-008)
- [x] Sitemap + robots.txt + SEO metadata baseline (#64, PR #69) — OG image generation
  and JSON-LD stay out per the issue's own non-goals
- [x] Newsletter signup form (storage only, no send automation) (#65, PR #71) — form UI
  only per the issue's own acceptance criteria; no working submit path until the
  storage/vendor owner decision is made
- [x] Basic news widget (#72, PR #74) — v1 scope: per-repo "Latest" section on
  `/repo/[slug]` listing recent GitHub releases (name/tag, publish date, link),
  ingested into `data/repogrove.db` via a third per-repo API call (ADR-005's
  2026-09-30 addendum). Phase 3's 17-item MVP gate (`docs/WORKPLAN.md`) is now
  complete.

## Phase 4+ — Deferred product roadmap (spec §31–32)
- [ ] Historical charts, watchlists/alerts (Phase 2 of product)
- [ ] Community submission workflow (issue → AI research → draft PR → approval)
- [ ] Newsletter automation
- [ ] Discovery/classification/research/editorial/SEO agents (spec §19) formalised
- [ ] Public API (`api.repogrove.com`)
- [ ] RepoGrove Pro / B2B intelligence (Phase 3 of product)

Issues for Phase 1 items are opened in this bootstrap PR's follow-up (see GitHub Issues,
label `phase-1`). Later phases' issues are opened when the prior phase's gate passes, not
in advance — per `CLAUDE.md` rule 8 ("a quiet run is a success"), we don't want a backlog
of stale, pre-guessed issues.
