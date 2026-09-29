/**
 * Trending ranking (`/trending`, issue #19; spec §8 "Hot Right Now") — pure
 * ranking logic kept separate from `src/lib/snapshots.ts` (SQLite reads) and
 * `src/lib/content.ts` (Markdown/frontmatter reads) so it can be unit-tested
 * without either a database or `/content` fixtures.
 *
 * "Absolute" here is the spec's own word for this page (issue #19): ranked
 * by raw stars gained, as opposed to `/rising` (#20, not yet built), which
 * will rank by growth *relative to a repo's size* instead. This module does
 * not compute the Grove Heat/momentum score (issue #21/ADR-004, separately
 * data-gated) — a simpler absolute-growth sort is this page's explicit
 * non-goal-free starting point per the issue body.
 */
import type { Repo } from "@/lib/content";
import type { GrowthSummary } from "@/lib/snapshots";

export interface TrendingEntry {
  repo: Repo;
  summary: GrowthSummary;
}

/**
 * Ranks `repos` by `deltaStars` descending, using each repo's growth summary
 * from `summaries` (keyed by `repo.github`, as returned by
 * `getGrowthSummaries`). A repo is left out — not shown with a fabricated
 * "+0" — when:
 *  - it has no entry in `summaries`, or the entry is `null` (no snapshot
 *    history at all yet); or
 *  - `summary.days === 0` (only one snapshot so far — not enough history
 *    for a delta yet, the same convention `StarGrowthChart` already uses).
 *
 * A repo with negative growth still ranks — sorted toward the bottom, not
 * excluded — since a real decline is itself a fact worth showing, not one
 * this page hides.
 */
export function rankByAbsoluteGrowth(
  repos: Repo[],
  summaries: Map<string, GrowthSummary | null>,
): TrendingEntry[] {
  const entries: TrendingEntry[] = [];
  for (const repo of repos) {
    const summary = summaries.get(repo.github);
    if (summary && summary.days > 0) entries.push({ repo, summary });
  }
  return entries.sort((a, b) => b.summary.deltaStars - a.summary.deltaStars);
}
