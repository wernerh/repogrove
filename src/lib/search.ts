/**
 * Search v1 (issue #63, ADR-008) — a static, build-time index matched
 * entirely client-side. See ADR-008 for the full architecture reasoning;
 * this module is deliberately split into two pure, independently-testable
 * halves: `buildSearchIndex` (what's searchable) and `searchEntries` (how a
 * query ranks against it) — no component, no React, no DOM.
 */
import { firstParagraph, getAllAlternatives, getAllGroves, getAllRepos, type Alternative } from "./content";

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

/**
 * Reads the same content-loader functions every page already calls
 * (`getAllRepos`/`getAllGroves`/`getAllAlternatives`) — nothing here touches
 * `data/repogrove.db` or any volatile/computed data, so the index can never
 * expose more than the equivalent public pages already do (issue #63's
 * security note). `content/comparisons/*.md` is deliberately not indexed —
 * see ADR-008.
 */
export function buildSearchIndex(): SearchEntry[] {
  const repoEntries: SearchEntry[] = getAllRepos().map((repo) => ({
    type: "repo",
    slug: repo.slug,
    title: repo.name,
    description: firstParagraph(repo.body),
    categories: repo.category,
    url: `/repo/${repo.slug}`,
  }));

  const groveEntries: SearchEntry[] = getAllGroves().map((grove) => ({
    type: "grove",
    slug: grove.slug,
    title: grove.name,
    description: grove.description,
    categories: [],
    url: `/grove/${grove.slug}`,
  }));

  const alternativeEntries: SearchEntry[] = getAllAlternatives().map((alternative) => ({
    type: "alternative",
    slug: alternative.slug,
    title: alternative.product,
    description: alternativeDescription(alternative),
    categories: [alternative.category],
    url: `/alternative/${alternative.slug}`,
  }));

  return [...repoEntries, ...groveEntries, ...alternativeEntries];
}

/**
 * `Alternative` has no free-text body (see content.ts) — `bestFit` is the
 * closest thing to a description it has. `bestFit` is legitimately optional
 * (`parseAlternative` only requires at least one of openSource/free/
 * commercial to be non-empty), so an alternative without it gets an empty
 * description rather than a fabricated sentence — matching this codebase's
 * "omit, don't fabricate" convention (e.g. RepoCard/AlternativesTable/
 * heat.ts all drop a field rather than synthesize text for it).
 * `SearchResultRow` already renders nothing for an empty description.
 * Exported as its own pure function (not inlined into `buildSearchIndex`'s
 * `.map`) so this branch is directly unit-testable without needing to mock
 * `getAllAlternatives`.
 */
export function alternativeDescription(alternative: Pick<Alternative, "product" | "bestFit">): string {
  return alternative.bestFit.length > 0 ? `Best for: ${alternative.bestFit.join(", ")}` : "";
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
