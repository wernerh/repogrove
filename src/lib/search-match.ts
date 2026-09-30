/**
 * Search v1 (issue #63, ADR-008) — the pure matching half, deliberately
 * split out of `src/lib/search.ts` so it has zero runtime dependency on
 * `src/lib/content.ts` (which imports `node:fs`). `SearchBox.tsx` (a Client
 * Component) imports only from *this* module — importing `searchEntries`
 * from `search.ts` instead pulls `content.ts`'s `node:fs` import into the
 * client bundle graph too (even though `searchEntries` itself never calls
 * it), which Turbopack's static-export build cannot chunk for the browser
 * ("the chunking context (unknown) does not support external modules
 * (request: node:fs)") — caught by CI on this PR's first push. `search.ts`
 * re-exports everything here for server-side/test convenience; only the
 * client component needs to care about the split.
 */
export type SearchEntryType = "repo" | "grove" | "alternative";

export interface SearchEntry {
  type: SearchEntryType;
  slug: string;
  title: string;
  /** Short, already-public description — never a second, hand-written copy
   * of editorial content; see ADR-008's "Index" section for where each
   * type's description comes from. */
  description: string;
  categories: string[];
  url: string;
}

/** Lower is better — the tier an entry matched on, used only to sort. */
enum MatchTier {
  ExactTitle = 0,
  TitleStartsWith = 1,
  TitleContains = 2,
  CategoryContains = 3,
  DescriptionContains = 4,
}

function matchTier(entry: SearchEntry, normalizedQuery: string): MatchTier | null {
  const title = entry.title.toLowerCase();
  if (title === normalizedQuery) return MatchTier.ExactTitle;
  if (title.startsWith(normalizedQuery)) return MatchTier.TitleStartsWith;
  if (title.includes(normalizedQuery)) return MatchTier.TitleContains;
  if (entry.categories.some((category) => category.toLowerCase().includes(normalizedQuery))) {
    return MatchTier.CategoryContains;
  }
  if (entry.description.toLowerCase().includes(normalizedQuery)) return MatchTier.DescriptionContains;
  return null;
}

/**
 * Pure substring ranking (ADR-008's "Matching" section) — no fuzzy/typo
 * tolerance, no external library, matching issue #63's own non-goal
 * ("semantic/AI-ranked search" is explicitly out). An empty/whitespace-only
 * query returns no results, so an untouched search box doesn't render every
 * piece of content unranked.
 */
export function searchEntries(index: SearchEntry[], query: string): SearchEntry[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery === "") return [];

  return index
    .map((entry) => ({ entry, tier: matchTier(entry, normalizedQuery) }))
    .filter((result): result is { entry: SearchEntry; tier: MatchTier } => result.tier !== null)
    .sort((a, b) => a.tier - b.tier || a.entry.title.localeCompare(b.entry.title))
    .map((result) => result.entry);
}
