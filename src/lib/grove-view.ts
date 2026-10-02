/**
 * Client-safe view logic for the Grove page's repository list
 * (`/grove/[slug]`): row shape, category tabs, filtering, sorting and
 * pagination. Deliberately **pure and type-only-importing** — no `node:fs`,
 * no SQLite — because `GroveRepoList` (a Client Component) imports it, and
 * anything reachable from a client bundle must not touch Node built-ins
 * (`src/lib/content.ts` and `src/lib/snapshots.ts` both do). Everything that
 * *builds* rows from `/content` + `data/repogrove.db` lives in
 * `src/lib/grove-rows.ts` (server only).
 */
import type { RepoStatus } from "@/lib/content";

/** One repository as the Grove list renders it. Plain serializable data so a
 * Server Component can hand it to the Client Component unchanged. */
export interface GroveRow {
  /** `/repo/:slug` route segment. */
  slug: string;
  /** `owner/name` on GitHub. */
  github: string;
  owner: string;
  repoName: string;
  /** Editorial display name from frontmatter, e.g. "LazyGit". */
  name: string;
  /** Two-letter monogram for the avatar tile. */
  initials: string;
  /** Hand-authored plain-English first paragraph (never a GitHub scrape). */
  description: string;
  status: RepoStatus;
  license: string;
  categories: string[];
  /** Display names of open-source then commercial alternatives. */
  alternatives: string[];
  /** Latest known star count, `null` when untracked (never a fake 0). */
  stars: number | null;
  /** Star change over the growth window; `null` when untracked. */
  deltaStars: number | null;
  /** Whole days the growth window spans; `0` = a single snapshot, i.e. no
   * delta yet (same convention as `GrowthSummary.days`). */
  days: number;
  /** Star counts oldest-first; a sparkline needs at least 2. */
  trend: number[];
  /** Latest snapshot date (YYYY-MM-DD), `null` when untracked. */
  latestCapturedOn: string | null;
}

export type SortKey = "stars" | "growth" | "name";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "stars", label: "Stars (high to low)" },
  { key: "growth", label: "Star growth" },
  { key: "name", label: "Name (A–Z)" },
];

export const PER_PAGE_OPTIONS = [6, 12, 24] as const;
export const DEFAULT_PER_PAGE = 6;

/** Tags whose conventional spelling is an acronym, not a capitalised word. */
const ACRONYM_TAGS = new Set(["ai", "llm", "rag", "paas", "ui", "cli", "sql", "api", "ml", "ci"]);

/** `"self-hosted"` -> `"Self hosted"`, `"llm"` -> `"LLM"`. */
export function humanizeTag(tag: string): string {
  if (ACRONYM_TAGS.has(tag)) return tag.toUpperCase();
  const spaced = tag.replace(/[-_]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export interface CategoryTab {
  /** `"all"` or the raw category tag. */
  key: string;
  label: string;
  count: number;
}

const MAX_TAG_TABS = 4;

/**
 * "All" plus the category tags that actually *discriminate* inside this
 * Grove: a tag carried by every repo (e.g. `devtools` in Developer Tools)
 * filters nothing, and a tag on a single repo is noise, so both are left
 * out. Tags can overlap (a repo is both `editor` and `terminal`), so tab
 * counts don't have to sum to the total — each tab is "repos carrying this
 * tag". Ordered by count, then alphabetically, capped so the tab row stays
 * one line on desktop.
 */
export function deriveTabs(rows: GroveRow[]): CategoryTab[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const tag of new Set(row.categories)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const tagTabs = [...counts.entries()]
    .filter(([, count]) => count >= 2 && count < rows.length)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_TAG_TABS)
    .map(([key, count]) => ({ key, label: humanizeTag(key), count }));
  return [{ key: "all", label: "All", count: rows.length }, ...tagTabs];
}

/** Case-insensitive substring match on the fields a reader would type from. */
export function filterRows(rows: GroveRow[], opts: { tab: string; query: string }): GroveRow[] {
  const query = opts.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (opts.tab !== "all" && !row.categories.includes(opts.tab)) return false;
    if (query === "") return true;
    const haystack = [row.github, row.name, row.description, ...row.categories, ...row.alternatives]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

function byName(a: GroveRow, b: GroveRow): number {
  return a.github.toLowerCase().localeCompare(b.github.toLowerCase());
}

/**
 * Returns a sorted copy. Repos with no data for the sort key (untracked
 * stars, or a single snapshot so no growth yet) sink to the end rather than
 * being ranked as zero; ties fall back to stars, then name, so the order is
 * deterministic.
 */
export function sortRows(rows: GroveRow[], key: SortKey): GroveRow[] {
  const copy = [...rows];
  const starsDesc = (a: GroveRow, b: GroveRow) =>
    (b.stars ?? -1) - (a.stars ?? -1) || byName(a, b);

  if (key === "name") return copy.sort(byName);
  if (key === "stars") return copy.sort(starsDesc);

  const hasGrowth = (row: GroveRow) => row.deltaStars !== null && row.days > 0;
  return copy.sort((a, b) => {
    if (hasGrowth(a) !== hasGrowth(b)) return hasGrowth(a) ? -1 : 1;
    if (hasGrowth(a) && hasGrowth(b) && a.deltaStars !== b.deltaStars) {
      return (b.deltaStars as number) - (a.deltaStars as number);
    }
    return starsDesc(a, b);
  });
}

export interface Page<T> {
  items: T[];
  /** 1-based, clamped into range. */
  page: number;
  totalPages: number;
  total: number;
  /** 1-based inclusive range shown, `0`/`0` when empty. */
  from: number;
  to: number;
}

export function paginate<T>(items: T[], page: number, perPage: number): Page<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const clamped = Math.min(Math.max(1, page), totalPages);
  const start = (clamped - 1) * perPage;
  const slice = items.slice(start, start + perPage);
  return {
    items: slice,
    page: clamped,
    totalPages,
    total,
    from: total === 0 ? 0 : start + 1,
    to: total === 0 ? 0 : start + slice.length,
  };
}
