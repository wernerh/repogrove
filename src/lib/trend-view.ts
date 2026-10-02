/**
 * Pure view-model helpers for the redesigned `/trending` ("Hot Right Now") and
 * `/rising` pages (`TrendBoard`). Kept free of React, SQLite and `/content`
 * reads so they unit-test without fixtures.
 *
 * `leadParagraph` deliberately duplicates the tiny whitespace-collapsing
 * behaviour of `firstParagraph` in `src/lib/content.ts` instead of importing
 * it: the trending/rising page tests mock `@/lib/content` down to
 * `getAllRepos` only, so importing a second export from that module would
 * break them. Revisit if those mocks are ever widened (TECH-DEBT.md).
 */

export type TrendMode = "hot" | "rising";

export interface TrendItem {
  /** 1-indexed rank across the *whole* list — stays fixed when a filter hides rows. */
  rank: number;
  slug: string;
  name: string;
  github: string;
  /** Primary category (first entry of the repo's frontmatter `category`), if any. */
  category: string | null;
  /** One-line editorial blurb (first paragraph of the repo's Markdown body). */
  blurb: string;
  /** Page-formatted reason string, e.g. "+142 stars in the last 7 days". */
  reason: string;
  /** Headline figure shown large on the top-three cards, e.g. "+142" or "+3.2%". */
  metric: string;
  /** Short caption under the headline figure, e.g. "stars gained". */
  metricNote: string;
  /** The raw number the ranking sorts by (stars gained, or percent growth). */
  value: number;
  totalStars: number;
  days: number;
}

export type SizeBucket = "small" | "mid" | "large";

export const SIZE_BUCKETS: { id: SizeBucket; label: string }[] = [
  { id: "small", label: "Under 20k" },
  { id: "mid", label: "20k to 100k" },
  { id: "large", label: "100k+" },
];

export function sizeBucket(totalStars: number): SizeBucket {
  if (totalStars < 20_000) return "small";
  if (totalStars < 100_000) return "mid";
  return "large";
}

/** First Markdown paragraph with the leading `# Title` and inline markup removed. */
export function leadParagraph(body: string): string {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith("#"));
  const first = paragraphs[0] ?? "";
  return first
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface CategoryStat {
  category: string;
  count: number;
  /** Hot: share (0-100) of all positive stars gained. Rising: mean percent growth. */
  value: number;
}

/**
 * Per-category summary for the sidebar. In `hot` mode `value` is each
 * category's share of all stars gained (negative growth is ignored so shares
 * sum to 100); in `rising` mode it is the mean percent growth of the
 * category's repos. Repos without a category are grouped as "uncategorised".
 * Sorted by `value`, largest first.
 */
export function categoryStats(items: TrendItem[], mode: TrendMode): CategoryStat[] {
  const groups = new Map<string, TrendItem[]>();
  for (const item of items) {
    const key = item.category ?? "uncategorised";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  const stats: CategoryStat[] = [];
  if (mode === "hot") {
    const gained = (list: TrendItem[]) => list.reduce((sum, i) => sum + Math.max(0, i.value), 0);
    const total = gained(items);
    for (const [category, list] of groups) {
      stats.push({ category, count: list.length, value: total > 0 ? (gained(list) / total) * 100 : 0 });
    }
  } else {
    for (const [category, list] of groups) {
      stats.push({ category, count: list.length, value: list.reduce((s, i) => s + i.value, 0) / list.length });
    }
  }
  return stats.sort((a, b) => b.value - a.value);
}
