# /data

Ingestion output that is safe to commit — small seed/fixture files used by tests, plus
one deliberate exception below. **Not** a place for anything resembling real user data
(subscriber emails, accounts); that will belong in a real database if/when one is
provisioned (see `ARCHITECTURE.md`). `.gitignore` blocks `*.csv`/`*.xlsx`/`*.sqlite`/`*.db`
here by default — fixtures that need those formats live under a `fixtures/` subfolder,
which is explicitly excepted.

## `repogrove.db` — the RepositorySnapshot store

The one named exception to the rule above: `data/repogrove.db` is a small SQLite
database, committed to Git on purpose and updated only by the scheduled ingestion job
(`scripts/ingestion/fetch-snapshots.mjs`, run by `.github/workflows/ingestion.yml`).
It holds `RepositorySnapshot` history (stars/forks/open_issues/watchers per repo per
day) — public GitHub repo metadata, never user data — and is the input the Phase 2
star-growth chart/trending/rising pages will read at `next build` time.

Why it's committed rather than kept in a live database: see
`docs/adr/ADR-005-repository-snapshot-storage.md`. Short version — Azure Storage
static-website hosting (ADR-002/RG-2) has no server runtime to query a live DB from,
and GitHub's API has no historical-snapshot endpoint, so the history has to be
accumulated incrementally, once per day, somewhere durable between separate CI runs;
Git is that store for now. Never hand-edit this file — it is rewritten by the ingestion
script only (`CLAUDE.md` rule 4: volatile data is never hand-edited).
