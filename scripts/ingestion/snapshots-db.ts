/**
 * RepositorySnapshot storage — a small SQLite database committed to Git.
 *
 * See docs/adr/ADR-005-repository-snapshot-storage.md for why this data lives in a
 * committed SQLite file (data/repogrove.db) rather than a live database or being
 * regenerated at build time. Nothing here is hand-edited: rows are written only by
 * scripts/ingestion/fetch-snapshots.ts — CLAUDE.md rule 4 ("volatile / computed data
 * ... lives in the database, populated by ingestion jobs, never hand-edited").
 *
 * TypeScript: `@types/node` is now `^26` and ships `node:sqlite`'s types (see
 * TECH-DEBT.md — this file and fetch-snapshots.ts used to stay plain JS because the
 * previously-pinned `@types/node` didn't have them). Uses a static
 * `import { DatabaseSync } from "node:sqlite"` — safe here because, unlike
 * src/lib/snapshots.ts, nothing in this file is ever reachable from a Vitest test that
 * needs the jsdom environment (see that file's doc comment for why *it* can't do the
 * same); this module is only ever run directly under Node (the ingestion job) or
 * imported by tests/ingestion/*.test.ts, both under `@vitest-environment node`.
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Default location of the committed snapshot database. */
export const DEFAULT_DB_PATH = path.join(__dirname, "..", "..", "data", "repogrove.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS repository_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  github TEXT NOT NULL,
  captured_on TEXT NOT NULL,
  stars INTEGER NOT NULL,
  forks INTEGER NOT NULL,
  open_issues INTEGER NOT NULL,
  watchers INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'github-api',
  fetched_at TEXT NOT NULL,
  UNIQUE(github, captured_on)
);
CREATE INDEX IF NOT EXISTS idx_repository_snapshots_github
  ON repository_snapshots (github, captured_on);

-- Issue #72 (basic news widget, v1: GitHub Releases only) — a repo's current list of
-- recent releases, not a per-day historical series like repository_snapshots above.
-- Unlike a snapshot (one row per (github, captured_on), meant to accumulate forever),
-- a release row is upserted by (github, tag_name): a release doesn't change once
-- published except for edits GitHub itself allows (name/body), which the next
-- ingestion run's upsert simply overwrites. See docs/adr/ADR-005-repository-snapshot-storage.md's
-- 2026-09-30 addendum for why this lives in the same committed data/repogrove.db
-- rather than a new storage decision.
CREATE TABLE IF NOT EXISTS repository_releases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  github TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  name TEXT,
  html_url TEXT NOT NULL,
  published_at TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  UNIQUE(github, tag_name)
);
CREATE INDEX IF NOT EXISTS idx_repository_releases_github
  ON repository_releases (github, published_at);
`;

/**
 * Schema migrations applied after `SCHEMA`'s `CREATE TABLE IF NOT EXISTS`, which only
 * creates the table the first time and never alters an existing one. Each entry here
 * must be safe to run every time `openDb` is called (checks before it acts), so the
 * committed `data/repogrove.db` — which already has rows from before a given column
 * existed — upgrades in place rather than needing a one-off backfill script.
 */
function migrate(db: DatabaseSync): void {
  const columns = db.prepare(`PRAGMA table_info(repository_snapshots)`).all() as unknown as { name: string }[];
  const hasContributors = columns.some((col) => col.name === "contributors");
  if (!hasContributors) {
    // Nullable, not NOT NULL: pre-migration rows (and any future row whose
    // contributor-count fetch failed independently of the main metrics fetch — see
    // fetch-snapshots.ts's runIngestion) have no value for this column, and that's a
    // real "unknown", not a data-entry omission the schema should reject.
    db.exec(`ALTER TABLE repository_snapshots ADD COLUMN contributors INTEGER`);
  }
}

/**
 * Opens (creating if needed) the snapshot database and ensures its schema exists.
 * Pass ":memory:" in tests to avoid touching disk.
 */
export function openDb(dbPath: string = DEFAULT_DB_PATH): DatabaseSync {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

export interface SnapshotInput {
  github: string;
  /** YYYY-MM-DD, the calendar day the ingestion job captured this snapshot. */
  capturedOn: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  fetchedAt: string;
  source?: string;
  /** Total contributor count, or `null`/omitted if that fetch failed or hasn't run yet
   * for this row (see fetch-snapshots.ts's `fetchContributorCount` — a separate,
   * best-effort API call from the main stars/forks/issues/watchers fetch). */
  contributors?: number | null;
}

export interface SnapshotRow {
  github: string;
  capturedOn: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  source: string;
  fetchedAt: string;
  contributors: number | null;
}

const REQUIRED_FIELDS = ["github", "capturedOn", "stars", "forks", "openIssues", "watchers", "fetchedAt"] as const;

/**
 * Idempotently writes one snapshot row. Calling this twice for the same
 * (github, capturedOn) pair updates the existing row instead of creating a duplicate —
 * the idempotency docs/WORKPLAN.md's Phase 2 gate requires.
 */
export function upsertSnapshot(db: DatabaseSync, snapshot: SnapshotInput): void {
  for (const field of REQUIRED_FIELDS) {
    if (snapshot[field] === undefined || snapshot[field] === null) {
      throw new Error(`upsertSnapshot: missing required field "${field}"`);
    }
  }
  const {
    github,
    capturedOn,
    stars,
    forks,
    openIssues,
    watchers,
    fetchedAt,
    source = "github-api",
    contributors = null,
  } = snapshot;

  const stmt = db.prepare(`
    INSERT INTO repository_snapshots
      (github, captured_on, stars, forks, open_issues, watchers, source, fetched_at, contributors)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(github, captured_on) DO UPDATE SET
      stars = excluded.stars,
      forks = excluded.forks,
      open_issues = excluded.open_issues,
      watchers = excluded.watchers,
      source = excluded.source,
      fetched_at = excluded.fetched_at,
      -- A re-run whose contributor fetch failed (or that simply omits it) must not
      -- clobber a good value already on record for this (github, captured_on) row —
      -- only overwrite when the new upsert actually has one.
      contributors = COALESCE(excluded.contributors, repository_snapshots.contributors)
  `);
  stmt.run(github, capturedOn, stars, forks, openIssues, watchers, source, fetchedAt, contributors);
}

// Kept in sync by hand with the identical constant in src/lib/snapshots.ts (that
// file's the read side used by src/app/repo/[slug]/page.tsx, and stays on
// `process.getBuiltinModule` rather than importing this module directly — see its own
// doc comment for why). If the schema changes, update both.
const SELECT_COLUMNS = `
  github, captured_on AS capturedOn, stars, forks, open_issues AS openIssues,
  watchers, source, fetched_at AS fetchedAt, contributors
`;

// `StatementSync.get`/`.all` (@types/node) type each column as
// `SQLOutputValue` (a union including `bigint`/`Uint8Array`/`null`, since
// SQLite columns can hold any of those), not the narrower shape this schema
// actually produces. The `as unknown as` casts below assert what the SCHEMA
// constant above guarantees (every column is `NOT NULL TEXT`/`INTEGER`) —
// this was always an implicit assumption in the pre-TypeScript version of
// this file; the cast just makes it visible rather than changing behavior.

/** Most recent snapshot for a repo, or null if none has ever been captured. */
export function getLatestSnapshot(db: DatabaseSync, github: string): SnapshotRow | null {
  const stmt = db.prepare(`
    SELECT ${SELECT_COLUMNS}
    FROM repository_snapshots
    WHERE github = ?
    ORDER BY captured_on DESC
    LIMIT 1
  `);
  return (stmt.get(github) as unknown as SnapshotRow) ?? null;
}

/** Full snapshot history for a repo, oldest first — the input a star-growth chart needs. */
export function getSnapshotHistory(db: DatabaseSync, github: string): SnapshotRow[] {
  const stmt = db.prepare(`
    SELECT ${SELECT_COLUMNS}
    FROM repository_snapshots
    WHERE github = ?
    ORDER BY captured_on ASC
  `);
  return stmt.all(github) as unknown as SnapshotRow[];
}

/** All distinct repos that have at least one snapshot. */
export function getTrackedRepos(db: DatabaseSync): string[] {
  const stmt = db.prepare(`SELECT DISTINCT github FROM repository_snapshots ORDER BY github ASC`);
  return (stmt.all() as unknown as { github: string }[]).map((row) => row.github);
}

// --- repository_releases (issue #72, basic news widget v1) -----------------------

export interface ReleaseInput {
  github: string;
  tagName: string;
  /** Release title, or `null`/omitted for a release GitHub itself has no name for
   * (some repos only ever set a tag) — the reader falls back to `tagName` for display,
   * this table just stores what GitHub actually returned. */
  name?: string | null;
  htmlUrl: string;
  /** ISO 8601 timestamp — GitHub's own `published_at` field. */
  publishedAt: string;
  fetchedAt: string;
}

export interface ReleaseRow {
  github: string;
  tagName: string;
  name: string | null;
  htmlUrl: string;
  publishedAt: string;
  fetchedAt: string;
}

const RELEASE_REQUIRED_FIELDS = ["github", "tagName", "htmlUrl", "publishedAt", "fetchedAt"] as const;

/**
 * Idempotently writes one release row. Calling this twice for the same
 * (github, tagName) pair updates the existing row rather than creating a duplicate —
 * a release can be edited (name/body) after publishing, and re-ingesting it should
 * reflect that, not accumulate stale copies.
 */
export function upsertRelease(db: DatabaseSync, release: ReleaseInput): void {
  for (const field of RELEASE_REQUIRED_FIELDS) {
    if (release[field] === undefined || release[field] === null) {
      throw new Error(`upsertRelease: missing required field "${field}"`);
    }
  }
  const { github, tagName, name = null, htmlUrl, publishedAt, fetchedAt } = release;

  const stmt = db.prepare(`
    INSERT INTO repository_releases
      (github, tag_name, name, html_url, published_at, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(github, tag_name) DO UPDATE SET
      name = excluded.name,
      html_url = excluded.html_url,
      published_at = excluded.published_at,
      fetched_at = excluded.fetched_at
  `);
  stmt.run(github, tagName, name, htmlUrl, publishedAt, fetchedAt);
}

const RELEASE_SELECT_COLUMNS = `
  github, tag_name AS tagName, name, html_url AS htmlUrl,
  published_at AS publishedAt, fetched_at AS fetchedAt
`;

/** All releases on record for a repo, most recently published first. Mostly a test/
 * inspection helper on the write side — `src/lib/releases.ts`'s `getRecentReleases`
 * is the real read path Next.js pages use at build time. */
export function getReleases(db: DatabaseSync, github: string): ReleaseRow[] {
  const stmt = db.prepare(`
    SELECT ${RELEASE_SELECT_COLUMNS}
    FROM repository_releases
    WHERE github = ?
    ORDER BY published_at DESC
  `);
  return stmt.all(github) as unknown as ReleaseRow[];
}
