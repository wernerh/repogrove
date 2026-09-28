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
   ingestion script (`scripts/ingestion/fetch-snapshots.ts`) daily.
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
   `scripts/ingestion/snapshots-db.mjs`, converted to `snapshots-db.ts` once
   `@types/node` gained `node:sqlite` types — see `TECH-DEBT.md`); no page imports them
   yet. The star-growth
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

## Addendum (2026-09-28): contributor counts

This ADR originally deferred contributor counts (see "Deferred, not decided against"
above) until the daily stars/forks pipeline was proven. Two full days of successful
`workflow_dispatch` ingestion runs (2026-09-27, 2026-09-28), both idempotent and both
committing clean, is enough evidence for that — this run adds it as a schema evolution
of the same `data/repogrove.db`, not a new ADR (same file, same storage decision, no
new dependency or expensive-to-reverse choice).

- `repository_snapshots` gained a nullable `contributors INTEGER` column, applied via an
  additive `ALTER TABLE ... ADD COLUMN` migration in `snapshots-db.ts`'s `openDb()` —
  safe to run on every open (checks `PRAGMA table_info` first) and applied once, by
  hand, against the already-committed `data/repogrove.db` as part of this change so the
  schema on disk and the code reading it never disagree. Existing rows read back with
  `contributors: null` — a real "unknown for that day," not a data error.
- Fetched via a second GitHub API call,
  `GET /repos/{owner}/{repo}/contributors?per_page=1&anon=true`, reading the total off
  the `Link` header's `rel="last"` page number (the standard pagination-count trick) —
  not the `/stats/contributors` endpoint, which can return `202` while GitHub computes
  results asynchronously and would need its own poll/retry handling.
- Deliberately **not** the "lower-frequency" fetch this ADR's deferred note first
  imagined: at five tracked repos, one extra request per repo per day is two calls
  total per hour of ingestion budget-wise — nowhere near GitHub's rate limits (60/hr
  unauthenticated, 5,000/hr with the Actions `GITHUB_TOKEN`) to justify the added
  complexity of a separate lower-frequency schedule. Revisit if/when the tracked-repo
  count grows enough for that math to change.
- Failure isolation: a contributor-count fetch failing (rate limit, network blip) never
  throws away that day's star/fork/issue snapshot — `runIngestion` catches it
  independently of `fetchRepoMetrics`'s failure path and stores `contributors: null` for
  the row. A same-day re-run whose contributor fetch fails does not clobber an
  already-known value either (`upsertSnapshot`'s `ON CONFLICT` uses
  `COALESCE(excluded.contributors, repository_snapshots.contributors)`).
- Not yet surfaced on any page — `src/lib/snapshots.ts`'s `SnapshotRow` carries it
  through for `/repo/[slug]` and a future Heat methodology (ADR-004, issue #21, which
  lists "contributor growth" as one of its inputs) to use once there's a UI consumer.

## Addendum (2026-09-28): watchers/subscribers_count

This ADR's original "Deferred, not decided against" section also flagged that
`watchers_count` mirrors `stargazers_count` in the modern GitHub REST API, and that the
real, distinct "watch" count is `subscribers_count` — deferred at the time on the
(incorrect) assumption it would need its own endpoint the way contributor counts do.

It doesn't: `subscribers_count` is already a field on the same `GET
/repos/{owner}/{repo}` response `fetchRepoMetrics` was already calling. This run fixed
`fetchRepoMetrics` to read `body.subscribers_count` instead of `body.watchers_count` — a
one-line data-correctness fix, no new API call, no schema change (the `watchers` column
already existed; only the value written to it changes going forward). Existing rows keep
whatever `watchers_count`-mirrors-stars value they were captured with on their day; this
isn't backfilled (volatile, ingestion-owned data — the next daily snapshot naturally
records the correct figure).
