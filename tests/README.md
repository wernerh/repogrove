# /tests

Automated tests for the app in `/src`, added starting Phase 1. Tests are proportional to
risk (per `CLAUDE.md` principles) — the walking skeleton needs a render smoke test per
page; ingestion (Phase 2) needs tests around snapshot idempotency and rate-limit
handling; content-schema validation (frontmatter shape) is worth testing early since
every later feature depends on it.
