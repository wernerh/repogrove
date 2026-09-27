# ADR-005: RepositorySnapshot storage — committed SQLite, not build-time regeneration

**Status:** Accepted
**Date:** 2026-09-27

## Context

`docs/WORKPLAN.md`'s Phase 2 gate explicitly leaves this open: SQLite storage for
ingested GitHub metrics is either "committed as a build artifact or regenerated at build
time — decide via ADR, not ad hoc." This ADR makes that call (numbered ADR-005, not ADR-004 — ARCHITECTURE.md and docs/WORKPLAN.md already reserve ADR-004 for the momentum/"Grove Heat" methodology) before any ingestion code
lands, per `CLAUDE.md` rule 4's anti-drift protocol (resolve provisional decisions before
building on top of them).

Two earlier ADRs pull in different directions and need reconciling:

- **ADR-003** (hybrid architecture, written before RG-2 was answered) argues GitHub
  metrics change "too fast and too mechanically to belong in Git" — implying a live
  database, refreshed independently of commits.
- **ADR-002** (hosting, updated same day once RG-2 was answered) already anticipated the
  conflict this creates and pre-committed to a different shape for Phase 2: "ingestion
  runs in GitHub Actions and writes committed data files; pages read them at build time,
  same static-export model."

The reason for the conflict: ADR-003 assumed a server process could query a live
database at request time. RG-2 (Azure Storage static-website hosting) closed that
option — Azure Storage serves pre-built static files only, no server runtime, no live
DB connection at runtime. `next build` with `output: "export"` must therefore have
every value it needs already available as build-time-readable files, exactly like
`/content` today (`src/lib/content.ts` reads Markdown off disk synchronously at build).

That constraint also rules out "regenerate at build time" as a real option: star
*growth* requires several days of history, and the GitHub API only returns a repo's
*current* counts — it has no historical-snapshot endpoint. A single build-time fetch
can never reconstruct history that wasn't captured on the days it happened. The history
has to be accumulated incrementally, once per day, by something that runs independently
of any given `next build` — and persisted somewhere that survives between separate CI
runs with no shared server or volume. Git is the only such durable store available under
the current hosting/hard-gate constraints (no cloud DB is provisioned; provisioning one
is a human gate per `CLAUDE.md` rule 6).

## Decision

`RepositorySnapshot` history lives in a SQLite database file, **`data/repogrove.db`,
committed to Git**, and updated incrementally:

1. A scheduled GitHub Actions workflow (`.github/workflows/ingestion.yml`) runs the
   ingestion script (`scripts/ingestion/fetch-snapshots.mjs`) daily.
2. The script reads every repo referenced in `/content` frontmatter (`github: owner/name`
   — via the same field `src/lib/content.ts` already validates as unique), fetches
   `GET /repos/{owner}/{repo}` from the GitHub API, and **upserts** one row per
   `(github, captured_on)` per day into `data/repogrove.db`. Re-running the same day
   updates that day's row rather than duplicating it — the idempotency the Phase 2 gate
   requires.
3. If a fetch fails (network error, rate limit, repo renamed/gone), the script logs a
   warning, skips that repo, and continues — a bad or rate-limited call to the GitHub API
   never fails the workflow or corrupts already-committed rows for other repos.
4. The workflow commits the updated `data/repogrove.db` directly to `main` if it changed
   (bot commit, `chore(data): refresh repository snapshots`) — no PR. This is
   deliberately different from editorial content, which always goes through a PR per
   `CLAUDE.md` rule 4: `data/repogrove.db` is exactly the "volatile / computed data ...
   populated by ingestion jobs, never hand-edited" case rule 4 already carves out. Nothing
   in it is authored, only mechanically fetched from a public API and idempotently
   upserted; there is no editorial judgment for a human or another agent to review before
   it's real.
5. `next build` will read `data/repogrove.db` synchronously at build time (mirroring how
   `content.ts` reads `/content`) once a page actually consumes it — no network call
   during the build, so build output stays reproducible and doesn't depend on GitHub API
   availability/rate limits at build time. **Not built yet as of this ADR**: this PR
   lands the storage/ingestion side only (schema + read helpers in
   `scripts/ingestion/snapshots-db.mjs`); no page imports them yet. The star-growth
   chart, `/trending`, and `/rising` (issues #18-#20) are what will actually call
   `getLatestSnapshot`/`getSnapshotHistory`/`getTrackedRepos` from `src/` — they're the
   ones that will exercise this build-time-read claim, once there's a few days of real
   history for it to be worth reading.

`data/repogrove.db` is added to `.gitignore` as a single explicit exception; the
blanket `*.db`/`*.sqlite` pattern stays in place for everything else (still guarding
against an accidentally-committed ad hoc export or a local dev scratch database).

**Library:** Node's built-in `node:sqlite` (`DatabaseSync`), not a new dependency
(`better-sqlite3` et al.) — CI already runs Node 22, which ships it. It is still
flagged upstream as experimental ("might change at any time"); tracked in
`TECH-DEBT.md` as a low-severity item to revisit (swap for `better-sqlite3`) if that
instability ever actually bites.

**Deferred, not decided against:** contributor counts (needs a separate paginated
GitHub endpoint, more API calls/rate-limit budget) and `watchers`/`subscribers_count`
nuance (the repo object's `watchers_count` field currently mirrors `stargazers_count` in
the GitHub API, not the older "watch" semantics) — tracked in `TECH-DEBT.md`, not blocking
the walking skeleton (stars/forks/open_issues are enough to prove the pipeline end to
end and start the star-growth chart in a follow-up run).

## Consequences

- Reconciles ADR-002 and ADR-003: ADR-003's "too fast for Git" reasoning holds for a
  future phase where hosting supports a live server/DB (Phase 3 already flags this same
  fork for search/newsletter-signup, per ADR-002's Phase 3 note) — it does not hold today,
  under static-only hosting. When hosting changes, this ADR should be revisited alongside
  ADR-002.
- `data/repogrove.db` diffs as an opaque binary in PRs/commits — acceptable for a
  single small file updated by one automated job, revisited if the file grows large
  enough to bloat the repo (tracked in `TECH-DEBT.md`).
- The ingestion workflow needs `contents: write` on the default `GITHUB_TOKEN` — no new
  secret, no cloud resource, nothing gated by `CLAUDE.md` rule 6.
- This is an implementation decision inside the already-locked stack (ADR-001: SQLite
  pre-launch) and an already-answered hosting decision (RG-2) — not a new
  expensive-to-reverse pivot, so it does not require a fresh owner decision under
  `docs/DECISION-PROTOCOL.md`.
