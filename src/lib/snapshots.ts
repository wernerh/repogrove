/**
 * Read-side access to the committed RepositorySnapshot store
 * (`data/repogrove.db`) for build-time use by Next.js pages — the
 * star-growth chart (issue #18) is the first reader; `/trending` and
 * `/rising` (#19, #20) will read the same helpers later.
 *
 * This module only *reads*. Nothing here writes to `data/repogrove.db` —
 * that's `scripts/ingestion/fetch-snapshots.ts`'s job alone (CLAUDE.md
 * rule 4: volatile/computed data is populated by ingestion jobs, never
 * hand-edited). See docs/adr/ADR-005-repository-snapshot-storage.md for why
 * this file is committed SQLite, read synchronously at `next build` time,
 * rather than a live database or a build-time API fetch.
 *
 * Node's built-in `node:sqlite` is loaded via `process.getBuiltinModule`
 * rather than a static `import "node:sqlite"`. A static import works fine
 * under `next build` (real Node), but this module is also reachable from
 * `src/app/repo/[slug]/page.tsx`, which `tests/app/repo-page.test.tsx`
 * exercises under Vitest's jsdom test environment — and Vite's bundler
 * refuses to bundle a Node built-in at all under jsdom ("Cannot bundle
 * Node.js built-in \"node:sqlite\""), the same issue TECH-DEBT.md already
 * recorded for the ingestion test files (PRs #14/#15). Those were fixed
 * with a per-file `@vitest-environment node` override, which doesn't work
 * here: this module is loaded transitively by a test that needs jsdom for
 * `@testing-library/react`. `process.getBuiltinModule` is an ordinary
 * runtime function call rather than an import/require Vite's static
 * analysis recognizes, so it sidesteps the bundler entirely. Requires
 * Node >= 22.3.0; CI and local dev both pin Node 22.
 */
import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "repogrove.db");

export interface SnapshotRow {
  github: string;
  /** YYYY-MM-DD, the calendar day the ingestion job captured this snapshot. */
  capturedOn: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  source: string;
  fetchedAt: string;
  /** Total contributor count, or `null` for a row whose contributor fetch failed or
   * predates this column (see scripts/ingestion/snapshots-db.ts's migration). */
  contributors: number | null;
}

// Kept in sync by hand with the identical constant in
// scripts/ingestion/snapshots-db.ts — both are now TypeScript, but one is a
// standalone Node script run directly by `node` (ingestion.yml) and the
// other is bundled into the Next.js app; sharing an import across
// `scripts/` and `src/` isn't worth the build-graph coupling for one small
// SQL fragment. If the schema changes, update both.
const SELECT_COLUMNS = `
  github, captured_on AS capturedOn, stars, forks, open_issues AS openIssues,
  watchers, source, fetched_at AS fetchedAt, contributors
`;

/**
 * Opens `dbPath` read-only, returning null (never throwing) if the file
 * doesn't exist, the `node:sqlite` builtin isn't available, or opening it
 * fails for any other reason — every caller must treat "no data yet" as a
 * normal state, not an error (issue #18's acceptance criteria: repo pages
 * with no history yet must degrade gracefully rather than crash the static
 * build).
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
 * Full snapshot history for a repo, oldest first — the input a star-growth
 * chart needs. Returns `[]` if `data/repogrove.db` doesn't exist yet
 * (before the first ingestion run), the repo has never been captured, or
 * the database can't be read for any reason.
 */
export function getSnapshotHistory(github: string, dbPath: string = DEFAULT_DB_PATH): SnapshotRow[] {
  const db = openReadOnly(dbPath);
  if (!db) return [];
  try {
    const stmt = db.prepare(`
      SELECT ${SELECT_COLUMNS}
      FROM repository_snapshots
      WHERE github = ?
      ORDER BY captured_on ASC
    `);
    return stmt.all(github) as unknown as SnapshotRow[];
  } catch {
    return [];
  } finally {
    db.close();
  }
}

export interface GrowthSummary {
  currentStars: number;
  /** stars(latest) - stars(baseline); can be negative. */
  deltaStars: number;
  /** Whole days spanned between the baseline snapshot and the latest one.
   * `0` means only one snapshot exists yet — not enough history for a
   * delta, distinct from a real "+0 stars" reading. */
  days: number;
  /** `captured_on` of the earliest snapshot on record for this repo. */
  trackingSince: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Growth summary ("+1,240 stars / 30 days", spec §6), computed from
 * whatever history exists rather than requiring a fixed minimum: the
 * baseline is the oldest snapshot within the last 30 days, or the very
 * first snapshot if tracking hasn't run that long yet. Returns `null` for
 * no history at all; callers should treat `days === 0` (only one snapshot
 * so far) as "not enough history for a delta yet", not "+0 stars".
 *
 * Sorts defensively (oldest-first by `capturedOn`) rather than trusting the
 * caller: `getSnapshotHistory` always returns rows in that order today, but
 * this module's own doc comment promises `/trending` (#19) and `/rising`
 * (#20) will reuse these helpers later, and a future caller silently
 * passing unsorted rows should not get silently wrong growth numbers.
 */
export function getGrowthSummary(unsortedHistory: SnapshotRow[]): GrowthSummary | null {
  if (unsortedHistory.length === 0) return null;
  const history = [...unsortedHistory].sort((a, b) => a.capturedOn.localeCompare(b.capturedOn));
  const latest = history[history.length - 1];
  const latestMs = Date.parse(`${latest.capturedOn}T00:00:00Z`);
  const targetMs = latestMs - 30 * MS_PER_DAY;

  // history is oldest-first (sorted above); the first row on/after the
  // 30-day cutoff is the right baseline (falls back to `latest` itself,
  // giving days === 0, if every row — including latest — is somehow before
  // the cutoff, which can't actually happen since latestMs >= targetMs
  // always holds).
  let baseline = history[0];
  for (const row of history) {
    if (Date.parse(`${row.capturedOn}T00:00:00Z`) >= targetMs) {
      baseline = row;
      break;
    }
  }

  const baselineMs = Date.parse(`${baseline.capturedOn}T00:00:00Z`);
  const days = Math.round((latestMs - baselineMs) / MS_PER_DAY);

  return {
    currentStars: latest.stars,
    deltaStars: latest.stars - baseline.stars,
    days,
    trackingSince: history[0].capturedOn,
  };
}
