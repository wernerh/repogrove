/**
 * Read-side access to the committed release list (`data/repogrove.db`'s
 * `repository_releases` table) for build-time use by `/repo/[slug]`'s
 * "Latest" section (issue #72, spec §11 — basic news widget, v1: GitHub
 * Releases only).
 *
 * This module only *reads*. Nothing here writes to `data/repogrove.db` —
 * that's `scripts/ingestion/fetch-snapshots.ts`'s job alone (`CLAUDE.md`
 * rule 4: volatile/computed data is populated by ingestion jobs, never
 * hand-edited).
 *
 * Duplicates `src/lib/snapshots.ts`'s small `openReadOnly`/
 * `process.getBuiltinModule` helper rather than importing it: this module
 * is transitively reachable from `tests/app/repo-page.test.tsx`, which runs
 * under Vitest's jsdom environment for `@testing-library/react`, and (per
 * `snapshots.ts`'s own doc comment) Vite's bundler refuses to statically
 * bundle "node:sqlite" under jsdom. `process.getBuiltinModule` is an
 * ordinary runtime call rather than an import Vite's static analysis
 * recognizes, so it sidesteps the bundler entirely — the same trade-off
 * `scripts/ingestion/snapshots-db.ts`'s doc comment already accepts for its
 * own `SELECT_COLUMNS` constant ("kept in sync by hand ... isn't worth the
 * build-graph coupling for one small SQL fragment"), just within `src/lib`
 * instead of across the `scripts/`/`src/` boundary.
 */
import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "repogrove.db");

export interface ReleaseRow {
  github: string;
  tagName: string;
  /** Release title, or `null` when GitHub's release has none — the page falls back to
   * `tagName` for display rather than fabricating a name. */
  name: string | null;
  htmlUrl: string;
  /** ISO 8601 timestamp — GitHub's own `published_at` field. */
  publishedAt: string;
}

/**
 * Opens `dbPath` read-only, returning `null` (never throwing) if the file doesn't
 * exist, the table doesn't exist yet (no ingestion run has fetched releases yet), the
 * `node:sqlite` builtin isn't available, or opening it fails for any other reason —
 * every caller must treat "no data yet" as a normal state, matching
 * `src/lib/snapshots.ts`'s `getSnapshotHistory` (issue #72's acceptance criteria: a
 * repo with no releases gets an explicit "No recent releases" empty state, never a
 * fabricated one).
 */
function openReadOnly(dbPath: string): DatabaseSyncType | null {
  if (!fs.existsSync(dbPath)) return null;
  const sqlite = process.getBuiltinModule("node:sqlite");
  if (!sqlite) return null;
  try {
    return new sqlite.DatabaseSync(dbPath, { readOnly: true });
  } catch {
    return null;
  }
}

/**
 * Most recent releases for a repo, newest-published first. `limit` defaults to 5 —
 * a repo page shows a handful of recent items, not a full history (mirrors the
 * ingestion side's own `RELEASES_PER_REPO` cap in `scripts/ingestion/fetch-snapshots.ts`).
 * Returns `[]` if `data/repogrove.db` (or its `repository_releases` table) doesn't
 * exist yet, the repo has no releases on record, or the database can't be read for
 * any reason — never throws.
 */
export function getRecentReleases(
  github: string,
  limit: number = 5,
  dbPath: string = DEFAULT_DB_PATH,
): ReleaseRow[] {
  const db = openReadOnly(dbPath);
  if (!db) return [];
  try {
    const stmt = db.prepare(`
      SELECT github, tag_name AS tagName, name, html_url AS htmlUrl, published_at AS publishedAt
      FROM repository_releases
      WHERE github = ?
      ORDER BY published_at DESC
      LIMIT ?
    `);
    return stmt.all(github, limit) as unknown as ReleaseRow[];
  } catch {
    return [];
  } finally {
    db.close();
  }
}
