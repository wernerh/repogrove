# WORKPLAN.md — Phased build plan with gates

Each phase has a gate: don't start the next phase until the current one's gate passes.
This keeps the dev lane from building deep before the walking skeleton proves the shape.

## Phase 0 — Discovery & bootstrap (owner sign-off)
- Factory scaffolded, docs seeded, CI + guardrails wired, roadmap issues created.
- **Gate:** owner has seen the bootstrap PR and the Phase 0 decision email (RG-2 hosting,
  and any others raised). Owner does not need to answer before Phase 1 starts — hosting
  is stubbed — but must be *asked*.

## Phase 1 — Walking skeleton
- Next.js app scaffolded (`create-next-app`, TypeScript, Tailwind, App Router).
- Content loader reads Markdown + YAML frontmatter from `/content` at build time (no DB).
- Exactly one Grove page (`/grove/ai`), one repo page (`/repo/ollama`), and a minimal
  homepage linking them, using **hand-written fixture content**, not scraped data.
- Basic layout/typography only — no design system yet (design lane starts DESIGN-SYSTEM.md
  in parallel, doesn't block this).
- Lint, test (at least a smoke test per page), and build succeed in CI.
- **Gate:** `npm run build` succeeds in CI and the three pages render with real content
  from `/content`, not hardcoded strings in the component.

## Phase 2 — Ingestion & metrics
- GitHub Actions scheduled job pulls stars/forks/contributors/last-commit for every repo
  referenced in `/content` frontmatter, writes to SQLite (committed as a build artifact
  or regenerated at build time — decide via ADR, not ad hoc).
- `RepositorySnapshot` history enables star-growth charts.
- Trending / Rising pages computed from the snapshot history.
- Momentum ("Grove Heat") methodology implemented and documented (ADR-004).
- **Gate:** at least 5 real repos have 3+ days of snapshot history and a working
  trending page; ingestion job is idempotent and doesn't fail CI when GitHub API is
  rate-limited (handles it gracefully, doesn't crash the build).

## Phase 3 — Search, SEO, alternatives, newsletter signup
- Alternatives pages (`/alternative/:slug`) and comparison pages (`/compare/:a/:b`).
- Full-text search (Postgres/SQLite FTS) across repos/Groves/alternatives.
- Sitemap, OpenGraph cards, basic SEO metadata per spec §14.
- Newsletter signup form (storage only — no send automation yet; that's Phase 2 of the
  *product* roadmap, i.e. after this MVP).
- **Gate:** the 17-item MVP list in `PRODUCT.md` / spec §30 is complete.

## Phase 4+ — Product roadmap Phase 2/3 (spec §31–32)
Historical charts, watchlists/alerts, community submissions, newsletter automation,
discovery agents, API, RepoGrove Pro, B2B intelligence. Each is its own set of roadmap
issues, opened when Phase 3's gate passes — not before.

## Cross-cutting, every phase
- Security lane reviews every phase's surface area as it's built (OWASP coverage table
  grows incrementally, not all-at-once).
- Design lane builds the design system incrementally, starting with the tokens/typography
  needed for Phase 1's three pages, expanding as new patterns are needed.
