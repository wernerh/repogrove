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
`;

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
  const { github, capturedOn, stars, forks, openIssues, watchers, fetchedAt, source = "github-api" } = snapshot;

  const stmt = db.prepare(`
    INSERT INTO repository_snapshots
      (github, captured_on, stars, forks, open_issues, watchers, source, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(github, captured_on) DO UPDATE SET
      stars = excluded.stars,
      forks = excluded.forks,
      open_issues = excluded.open_issues,
      watchers = excluded.watchers,
      source = excluded.source,
      fetched_at = excluded.fetched_at
  `);
  stmt.run(github, capturedOn, stars, forks, openIssues, watchers, source, fetchedAt);
}

// Kept in sync by hand with the identical constant in src/lib/snapshots.ts (that
// file's the read side used by src/app/repo/[slug]/page.tsx, and stays on
// `process.getBuiltinModule` rather than importing this module directly — see its own
// doc comment for why). If the schema changes, update both.
const SELECT_COLUMNS = `
  github, captured_on AS capturedOn, stars, forks, open_issues AS openIssues,
  watchers, source, fetched_at AS fetchedAt
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
