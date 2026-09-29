/**
 * Rising ranking (`/rising`, issue #20; spec §6/§8 "Rising Repositories") —
 * pure ranking logic kept separate from `src/lib/snapshots.ts` (SQLite
 * reads) and `src/lib/content.ts` (Markdown/frontmatter reads) so it can be
 * unit-tested without either a database or `/content` fixtures — the same
 * split `src/lib/trending.ts` (#19) already uses.
 *
 * "Rising" ranks by growth *relative to a repo's own size* (percent change),
 * unlike `/trending` (#19), which ranks by raw stars gained. This is the
 * spec's own distinction (§6/§8): a "Hot Right Now"-style absolute sort
 * favors already-large repos, while a relative sort is what surfaces a
 * smaller repo growing unusually fast before it's mainstream. This module
 * does not compute the Grove Heat/momentum score (issue #21/ADR-004,
 * separately data-gated, and this issue's own explicit non-goal) — a
 * simpler relative-growth-rate sort is this page's starting point.
 */
import type { Repo } from "@/lib/content";
import type { GrowthSummary } from "@/lib/snapshots";

export interface RisingEntry {
  repo: Repo;
  summary: GrowthSummary;
  /** `deltaStars / baselineStars * 100` — percent change over `summary.days`. */
  percentGrowth: number;
}

/**
 * Ranks `repos` by percent star growth descending, using each repo's
 * growth summary from `summaries` (keyed by `repo.github`, as returned by
 * `getGrowthSummaries`). A repo is left out — not shown with a fabricated
 * or nonsensical figure — when:
 *  - it has no entry in `summaries`, or the entry is `null` (no snapshot
 *    history at all yet); or
 *  - `summary.days === 0` (only one snapshot so far — not enough history
 *    for a delta yet, the same convention `rankByAbsoluteGrowth` uses); or
 *  - its baseline star count (`currentStars - deltaStars`) is zero or
 *    negative — dividing by it would produce `Infinity`/`NaN`, not a real
 *    percentage.
 *
 * A repo with negative growth still ranks — sorted toward the bottom, not
 * excluded — since a real decline is itself a fact worth showing, not one
 * this page hides (same convention as `/trending`).
 */
export function rankByRelativeGrowth(
  repos: Repo[],
  summaries: Map<string, GrowthSummary | null>,
): RisingEntry[] {
  const entries: RisingEntry[] = [];
  for (const repo of repos) {
    const summary = summaries.get(repo.github);
    if (!summary || summary.days === 0) continue;

    const baselineStars = summary.currentStars - summary.deltaStars;
    if (baselineStars <= 0) continue;

    entries.push({ repo, summary, percentGrowth: (summary.deltaStars / baselineStars) * 100 });
  }
  return entries.sort((a, b) => b.percentGrowth - a.percentGrowth);
}
