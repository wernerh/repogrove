/**
 * Search v1 (issue #63, ADR-008) — the index-building half, which needs
 * `content.ts` (and therefore `node:fs`) and so is server-only. The pure
 * matching half (`searchEntries`, the `SearchEntry`/`SearchEntryType`
 * types) lives in `./search-match` instead — see that file's doc comment
 * for why the split exists (a real Turbopack client-bundling failure this
 * PR hit on its first CI run). Re-exported here so server code and tests
 * can import everything from one place; `SearchBox.tsx` (Client Component)
 * must import from `./search-match` directly, never from here.
 */
import { firstParagraph, getAllAlternatives, getAllGroves, getAllRepos, type Alternative } from "./content";
import { type SearchEntry } from "./search-match";

export { searchEntries, type SearchEntry, type SearchEntryType } from "./search-match";

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
