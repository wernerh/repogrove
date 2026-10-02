/**
 * Server-side assembly of the Grove page's data: turns `/content` repos plus
 * their `data/repogrove.db` snapshot history into `GroveRow`s and the
 * aggregate figures in the page's stat strip and Trendspotting card.
 *
 * Everything here is derived from data the product really holds. Nothing is
 * estimated or filled in: a repo with no snapshot yet carries `stars: null`
 * and is left out of every aggregate (the same "omit, don't fabricate"
 * convention `RepoCard`/`StarGrowthChart` use), and an aggregate with nothing
 * to aggregate over is `null`, which the UI renders as an em dash.
 *
 * Server-only: imports `firstParagraph` from `content.ts` (reads `node:fs`).
 * The client-safe row type and list logic live in `grove-view.ts`.
 */
import { firstParagraph, type Repo, type RepoStatus } from "@/lib/content";
import type { GroveRow } from "@/lib/grove-view";
import { getGrowthSummary, type SnapshotRow } from "@/lib/snapshots";

/** `"neovim/neovim"` -> `"NE"`, `"zed-industries/zed"` -> `"ZE"`,
 * `"open-webui/open-webui"` -> `"OW"`. */
export function initialsFor(repoName: string): string {
  const words = repoName.split(/[-_.\s]+/).filter(Boolean);
  const letters =
    words.length >= 2 ? words[0].charAt(0) + words[1].charAt(0) : (words[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

/**
 * Builds one row per repo. `resolveAlternative` maps an `alternatives.
 * open_source` slug to a display name (an unresolvable slug passes through
 * as-is, same as `RepoCard`'s caller). Commercial alternatives are already
 * display names (enforced by `assertValidAlternatives`).
 */
export function buildGroveRows(
  repos: Repo[],
  histories: Map<string, SnapshotRow[]>,
  resolveAlternative: (slug: string) => string,
): GroveRow[] {
  return repos.map((repo) => {
    const history = [...(histories.get(repo.github) ?? [])].sort((a, b) =>
      a.capturedOn.localeCompare(b.capturedOn),
    );
    const summary = getGrowthSummary(history);
    const [owner, repoName] = repo.github.split("/");

    return {
      slug: repo.slug,
      github: repo.github,
      owner,
      repoName,
      name: repo.name,
      initials: initialsFor(repoName),
      description: firstParagraph(repo.body),
      status: repo.status,
      license: repo.license,
      categories: repo.category,
      alternatives: [
        ...repo.alternatives.open_source.map(resolveAlternative),
        ...repo.alternatives.commercial,
      ],
      stars: summary ? summary.currentStars : null,
      deltaStars: summary ? summary.deltaStars : null,
      days: summary ? summary.days : 0,
      trend: history.map((row) => row.stars),
      latestCapturedOn: history.length > 0 ? history[history.length - 1].capturedOn : null,
    };
  });
}

export interface GroveStats {
  repoCount: number;
  /** Repos with at least one snapshot. */
  trackedCount: number;
  /** Sum of latest star counts over tracked repos; `null` if none tracked. */
  collectiveStars: number | null;
  /** Median of each repo's stars-gained-per-day over its own growth window;
   * `null` until at least one repo has two or more snapshots. */
  medianDailyGain: number | null;
  /** How many repos that median is over. */
  growthSampleSize: number;
  /** Licenses by frequency, most common first (ties alphabetical). */
  licenses: { license: string; count: number }[];
  statusCounts: Record<RepoStatus, number>;
  /** Most recent snapshot date across the Grove, `null` if none. */
  updatedOn: string | null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function computeGroveStats(rows: GroveRow[]): GroveStats {
  const tracked = rows.filter((row) => row.stars !== null);
  const dailyGains = rows
    .filter((row) => row.deltaStars !== null && row.days > 0)
    .map((row) => (row.deltaStars as number) / row.days);

  const licenseCounts = new Map<string, number>();
  const statusCounts: Record<RepoStatus, number> = { active: 0, maintained: 0, inactive: 0 };
  for (const row of rows) {
    licenseCounts.set(row.license, (licenseCounts.get(row.license) ?? 0) + 1);
    statusCounts[row.status] += 1;
  }

  const dates = rows.map((row) => row.latestCapturedOn).filter((d): d is string => d !== null);

  return {
    repoCount: rows.length,
    trackedCount: tracked.length,
    collectiveStars:
      tracked.length > 0 ? tracked.reduce((sum, row) => sum + (row.stars as number), 0) : null,
    medianDailyGain: median(dailyGains),
    growthSampleSize: dailyGains.length,
    licenses: [...licenseCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([license, count]) => ({ license, count })),
    statusCounts,
    updatedOn: dates.length > 0 ? dates.sort().at(-1)! : null,
  };
}

/**
 * Biggest star gainers for the "Trendspotting" card. Only repos with a real
 * growth window (`days > 0`) and a *positive* gain qualify — a card named for
 * rising tools shouldn't list a repo whose stars fell or stood still (those
 * still appear, honestly, in the main list and on `/trending`).
 */
export function topGainers(rows: GroveRow[], limit = 3): GroveRow[] {
  return rows
    .filter((row) => row.days > 0 && (row.deltaStars ?? 0) > 0)
    .sort((a, b) => (b.deltaStars as number) - (a.deltaStars as number) || a.github.localeCompare(b.github))
    .slice(0, limit);
}
