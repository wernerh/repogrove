# /data

Ingestion output that is safe to commit — small seed/fixture files used by tests and the
Phase 1 walking skeleton. **Not** a place for live scrape dumps, real metrics history, or
anything resembling user data; that belongs in the database once one is provisioned (see
`ARCHITECTURE.md`). `.gitignore` blocks `*.csv`/`*.xlsx`/`*.sqlite` here by default —
fixtures that need those formats live under a `fixtures/` subfolder, which is explicitly
excepted.
