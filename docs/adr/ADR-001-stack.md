# ADR-001: Technology stack

**Status:** Accepted (owner-specified, LOCKED)
**Date:** 2026-09-27

## Context
The owner's spec (§28) names a preferred initial stack. This is an expensive-to-reverse
choice (framework), so it's recorded as an ADR rather than assumed.

## Decision
- Frontend: Next.js / React / TypeScript
- Styling: Tailwind CSS
- Content: Markdown/MDX in Git (`/content`)
- Database: SQLite pre-launch, PostgreSQL once hosting exists and scale warrants it
- Search: Postgres/SQLite full-text search initially
- Scheduled jobs: GitHub Actions
- Deployment: Cloudflare + a modern cloud host — target only, not provisioned (see
  ADR-002)

## Consequences
- Next.js gives static generation for content pages (good for SEO, matches spec §14)
  and API routes for the ingestion/ search endpoints without a separate backend service.
- SQLite-first keeps Phase 1–2 dependency-free (no DB server to run in CI or locally);
  the schema is designed (see `ARCHITECTURE.md`) to move to Postgres without a rewrite.
- Changing any part of this stack requires a new ADR and an owner decision per
  `CLAUDE.md` rule 3.
