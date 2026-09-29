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
- [ ] Momentum/"Heat" methodology implemented + documented (ADR-004) (#21)

## Phase 3 — Search, SEO, alternatives, newsletter signup
- [ ] Alternatives pages (`/alternative/:slug`) — open-source / free / commercial + best fit
- [ ] Comparison pages (`/compare/:a/:b`)
- [ ] Full-text search across repos/Groves/alternatives
- [ ] Sitemap + OpenGraph cards + SEO metadata
- [ ] Newsletter signup form (storage only, no send automation)

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
