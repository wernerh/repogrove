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

/**
 * Shared batching step: opens `dbPath` exactly once and returns every
 * requested repo's full snapshot history (oldest first), grouped by
 * `github` slug — every requested slug is present as a key, `[]` for a repo
 * that isn't tracked or when the database can't be opened at all (never a
 * missing key a caller might mistake for "still loading"). Both
 * `getGrowthSummaries` and `getSnapshotHistories` below build on this one
 * query rather than duplicating the "open once, `WHERE github IN (...)`,
 * group by repo" logic twice.
 */
function fetchHistoriesByGithub(
  githubSlugs: string[],
  dbPath: string,
): Map<string, SnapshotRow[]> {
  const result = new Map<string, SnapshotRow[]>();
  if (githubSlugs.length === 0) return result;
  for (const slug of githubSlugs) result.set(slug, []);

  const db = openReadOnly(dbPath);
  if (!db) return result;

  try {
    const placeholders = githubSlugs.map(() => "?").join(", ");
    const stmt = db.prepare(`
      SELECT ${SELECT_COLUMNS}
      FROM repository_snapshots
      WHERE github IN (${placeholders})
      ORDER BY captured_on ASC
    `);
    const rows = stmt.all(...githubSlugs) as unknown as SnapshotRow[];
    for (const row of rows) {
      result.get(row.github)?.push(row);
    }
    return result;
  } catch {
    for (const slug of githubSlugs) result.set(slug, []);
    return result;
  } finally {
    db.close();
  }
}

/**
 * Batched counterpart to calling `getGrowthSummary(getSnapshotHistory(github))`
 * once per repo — opens `dbPath` exactly once for however many `githubSlugs`
 * are requested, rather than once per repo. `src/app/page.tsx`'s homepage
 * cards and `/trending` (issue #19) both need a growth figure for every
 * tracked repo at once; the original per-repo pattern was flagged as
 * dev-lane tech debt (TECH-DEBT.md, 2026-09-29) once a real caller (the
 * repo/Grove card pattern) started looping it.
 *
 * Every requested slug is present as a key in the result — `null` for a
 * repo that isn't tracked (or when the database can't be opened at all),
 * matching `getGrowthSummary`'s own "no history" contract, never a missing
 * key a caller might mistake for "still loading".
 */
export function getGrowthSummaries(
  githubSlugs: string[],
  dbPath: string = DEFAULT_DB_PATH,
): Map<string, GrowthSummary | null> {
  const byRepo = fetchHistoriesByGithub(githubSlugs, dbPath);
  const result = new Map<string, GrowthSummary | null>();
  for (const slug of githubSlugs) {
    result.set(slug, getGrowthSummary(byRepo.get(slug) ?? []));
  }
  return result;
}

/**
 * Batched counterpart to calling `getSnapshotHistory(github)` once per repo
 * — same "open the db once" reasoning as `getGrowthSummaries` above, for a
 * caller that needs each repo's *full* history (e.g. `computeHeat`, which
 * `getGrowthSummaries`'s growth-summary-only result can't feed), not just
 * the growth summary. `/compare/:a/:b` (issue #62) is the first caller: it
 * needs Grove Heat for two different repos on one page, and calling
 * `getSnapshotHistory` once per repo would reopen the database a second
 * time for no reason — independent review flagged this as the same N+1
 * pattern TECH-DEBT.md already recorded for looping a single-repo read over
 * a list, even though here the list is always exactly 2 (see
 * `ComparePage`'s own doc comment on why 2 stays fixed).
 */
export function getSnapshotHistories(
  githubSlugs: string[],
  dbPath: string = DEFAULT_DB_PATH,
): Map<string, SnapshotRow[]> {
  return fetchHistoriesByGithub(githubSlugs, dbPath);
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
 * The baseline snapshot `getGrowthSummary` compares against: the oldest
 * snapshot within the last 30 days of the latest one, or the very first
 * snapshot if tracking hasn't run that long yet. Exported (not just an
 * implementation detail of `getGrowthSummary`) so a caller that needs more
 * than the star-count delta — `src/lib/heat.ts`'s `computeHeat`, which also
 * reads `openIssues`/`contributors` off the *same* baseline row — can reuse
 * the identical windowing logic rather than picking its own "oldest" (e.g.
 * `history[0]`, the absolute earliest snapshot ever) and silently comparing
 * two different time windows on what looks like one figure once a repo
 * accumulates more than 30 days of history.
 *
 * Sorts defensively (oldest-first by `capturedOn`) rather than trusting the
 * caller — same reasoning as `getGrowthSummary` below. Returns `null` for
 * no history at all.
 */
export function getGrowthBaseline(unsortedHistory: SnapshotRow[]): SnapshotRow | null {
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
  return baseline;
}

/**
 * Growth summary ("+1,240 stars / 30 days", spec §6), computed from
 * whatever history exists rather than requiring a fixed minimum — see
 * `getGrowthBaseline` for how the baseline snapshot is chosen. Returns
 * `null` for no history at all; callers should treat `days === 0` (only
 * one snapshot so far) as "not enough history for a delta yet", not "+0
 * stars".
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
  const baseline = getGrowthBaseline(unsortedHistory)!;

  const latestMs = Date.parse(`${latest.capturedOn}T00:00:00Z`);
  const baselineMs = Date.parse(`${baseline.capturedOn}T00:00:00Z`);
  const days = Math.round((latestMs - baselineMs) / MS_PER_DAY);

  return {
    currentStars: latest.stars,
    deltaStars: latest.stars - baseline.stars,
    days,
    trackingSince: history[0].capturedOn,
  };
}
