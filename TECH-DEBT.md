# TECH-DEBT.md

Append-only. Each lane appends its own rows; don't rewrite another lane's entries.

| Date added | Item | Why it's debt | Severity | Owning lane | Status |
|---|---|---|---|---|---|
| 2026-09-27 | No CI Postgres service yet — local dev/tests use SQLite only | Postgres-specific behaviour (full-text search, migrations) untested until Phase 2 | low | dev | open |
| 2026-09-27 | No deploy pipeline | Hosting undecided (RG-2); CI validates only | medium | dev | open — blocked on owner decision |
| 2026-09-27 | `content/repos/<name-slug>.md` filename isn't unique if two different-owner GitHub repos share a name | Content loader (Phase 1) must dedupe/validate on the `github:` frontmatter field, not the filename alone; add a build-time check that fails on a slug collision | low | dev | open |
