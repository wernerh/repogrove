# TECH-DEBT.md

Append-only. Each lane appends its own rows; don't rewrite another lane's entries.

| Date added | Item | Why it's debt | Severity | Owning lane | Status |
|---|---|---|---|---|---|
| 2026-09-27 | No CI Postgres service yet — local dev/tests use SQLite only | Postgres-specific behaviour (full-text search, migrations) untested until Phase 2 | low | dev | open |
| 2026-09-27 | No deploy pipeline | Hosting undecided (RG-2); CI validates only | medium | dev | open — blocked on owner decision |
| 2026-09-27 | `content/repos/<name-slug>.md` filename isn't unique if two different-owner GitHub repos share a name | Content loader (Phase 1) must dedupe/validate on the `github:` frontmatter field, not the filename alone; add a build-time check that fails on a slug collision | low | dev | open |
| 2026-09-27 | Hosting target (RG-2) answered as Azure Storage static-website hosting, which serves static files only (no server, no API routes) | Phase 3's full-text search and newsletter-signup form both assumed a server API (`/api/*` per CLAUDE.md §6); needs a client-side-only search design and either Azure Static Web Apps/Functions, a third-party form endpoint, or a re-opened hosting decision for signup submissions — resolve via ADR before Phase 3 starts | medium | dev | open |
