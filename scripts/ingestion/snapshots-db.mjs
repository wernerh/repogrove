/**
 * RepositorySnapshot storage — a small SQLite database committed to Git.
 *
 * See docs/adr/ADR-005-repository-snapshot-storage.md for why this data lives in a
 * committed SQLite file (data/repogrove.db) rather than a live database or being
 * regenerated at build time. Nothing here is hand-edited: rows are written only by
 * scripts/ingestion/fetch-snapshots.mjs — CLAUDE.md rule 4 ("volatile / computed data
 * ... lives in the database, populated by ingestion jobs, never hand-edited").
 *
 * Plain JS (not TypeScript): node:sqlite ships with Node 22 but isn't in the
 * @types/node version this project currently pins (see TECH-DEBT.md). Keeping this
 * module untyped avoids fighting that gap; it isn't part of the Next.js app's
 * type-checked surface.
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
export function openDb(dbPath = DEFAULT_DB_PATH) {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec(SCHEMA);
  return db;
}

const REQUIRED_FIELDS = ["github", "capturedOn", "stars", "forks", "openIssues", "watchers", "fetchedAt"];

/**
 * Idempotently writes one snapshot row. Calling this twice for the same
 * (github, capturedOn) pair updates the existing row instead of creating a duplicate —
 * the idempotency docs/WORKPLAN.md's Phase 2 gate requires.
 */
export function upsertSnapshot(db, snapshot) {
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

// Kept in sync by hand with the identical constant in src/lib/snapshots.ts
// (that file's the read side used by src/app/repo/[slug]/page.tsx; this one
// stays plain JS — see TECH-DEBT.md — so it can't import the TS copy). If
// the schema changes, update both.
const SELECT_COLUMNS = `
  github, captured_on AS capturedOn, stars, forks, open_issues AS openIssues,
  watchers, source, fetched_at AS fetchedAt
`;

/** Most recent snapshot for a repo, or null if none has ever been captured. */
export function getLatestSnapshot(db, github) {
  const stmt = db.prepare(`
    SELECT ${SELECT_COLUMNS}
    FROM repository_snapshots
    WHERE github = ?
    ORDER BY captured_on DESC
    LIMIT 1
  `);
  return stmt.get(github) ?? null;
}

/** Full snapshot history for a repo, oldest first — the input a star-growth chart needs. */
export function getSnapshotHistory(db, github) {
  const stmt = db.prepare(`
    SELECT ${SELECT_COLUMNS}
    FROM repository_snapshots
    WHERE github = ?
    ORDER BY captured_on ASC
  `);
  return stmt.all(github);
}

/** All distinct repos that have at least one snapshot. */
export function getTrackedRepos(db) {
  const stmt = db.prepare(`SELECT DISTINCT github FROM repository_snapshots ORDER BY github ASC`);
  return stmt.all().map((row) => row.github);
}
