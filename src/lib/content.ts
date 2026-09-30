/**
 * Content loader — reads RepoGrove's Git-native content database (`/content`)
 * at build time and returns typed, validated data to pages.
 *
 * Per ARCHITECTURE.md and ADR-003: the content repo's frontmatter is the
 * source of truth for editorial relationships (which repos are in which
 * Grove, what's an alternative to what). This module only *reads* that
 * source of truth — it never writes to `/content`, and nothing here talks
 * to the GitHub API or a database (that's Phase 2's ingestion job).
 *
 * A malformed content file throws `ContentValidationError`, which fails the
 * build loudly rather than shipping a page with missing data (CLAUDE.md
 * §3.4: "no agent's own generated output is authoritative" — that cuts both
 * ways, a bad edit shouldn't silently ship either).
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_ROOT = path.join(process.cwd(), "content");
const REPOS_DIR = path.join(CONTENT_ROOT, "repos");
const GROVES_DIR = path.join(CONTENT_ROOT, "groves");
const ALTERNATIVES_DIR = path.join(CONTENT_ROOT, "alternatives");
const COMPARISONS_DIR = path.join(CONTENT_ROOT, "comparisons");

export class ContentValidationError extends Error {}

export type RepoStatus = "active" | "maintained" | "inactive";
const REPO_STATUSES: readonly RepoStatus[] = ["active", "maintained", "inactive"];

export interface RepoAlternatives {
  open_source: string[];
  commercial: string[];
}

export interface Repo {
  /** Filename without extension, e.g. "ollama". Used for the `/repo/:slug` route. */
  slug: string;
  /** `owner/name` on GitHub — the field that actually disambiguates two repos
   * that would otherwise want the same filename (see TECH-DEBT.md). */
  github: string;
  name: string;
  category: string[];
  license: string;
  status: RepoStatus;
  featured: boolean;
  groves: string[];
  alternatives: RepoAlternatives;
  /** Raw Markdown body (rendered by the page via react-markdown, never
   * dangerouslySetInnerHTML — see docs/security/README.md). */
  body: string;
}

export interface Grove {
  /** Filename without extension, e.g. "ai". Used for the `/grove/:slug` route. */
  slug: string;
  name: string;
  description: string;
  relatedGroves: string[];
  body: string;
}

/**
 * `content/alternatives/<slug>.md` — a paid-product page (spec §4, e.g.
 * `notion.md`), answering "what's the best open-source/free/commercial
 * alternative to <product>". Distinct from `Repo.alternatives`
 * (`/repo/[slug]`'s "what else instead of *this* repo" table): a product
 * here (Notion) has no `content/repos/*.md` page of its own.
 *
 * Body sections (`## Open source`, `## Free`, `## Commercial`, `## Best
 * fit`) are plain Markdown bullet lists of display names, not slugs — see
 * `ARCHITECTURE.md`'s content schema. `openSource` items are resolved
 * against `content/repos/*.md` by the *page*, the same
 * resolved-or-plain-text convention `AlternativesTable` already uses for
 * `Repo.alternatives.open_source` (this module only parses; it doesn't look
 * repos up here, keeping content-loading and cross-referencing separate).
 */
export interface Alternative {
  /** Filename without extension, e.g. "notion". Used for the
   * `/alternative/:slug` route. */
  slug: string;
  product: string;
  category: string;
  openSource: string[];
  free: string[];
  commercial: string[];
  bestFit: string[];
}

/**
 * `content/comparisons/<a>-vs-<b>.md` (spec §10, §14; issue #62) — a
 * hand-curated `/compare/:a/:b` page, distinct from `/repo/[slug]`'s
 * `AlternativesTable` ("what else instead of *this* repo") and
 * `/alternative/:slug` ("what's the best alternative to *this paid
 * product*"): a comparison page is for two repos that *both* already have
 * their own `content/repos/*.md` page, answering spec §10's "Comparison —
 * how does it differ?" perspective directly, side by side.
 *
 * Deliberately thin: this module only owns the editorial part no computed
 * source can supply (`howTheyDiffer`, hand-written prose) plus which two
 * repos are being compared. Every structured fact a comparison page shows
 * (stars, license, status, momentum, category, pros/cons) is *reused* from
 * `getRepo`/`getGrowthSummaries`/`computeHeat` and the repos' own `## Pros`/
 * `## Cons` body sections (via `extractListItems`, exported for exactly this
 * reuse) at render time — never re-derived or re-typed into the comparison
 * content file itself, matching CLAUDE.md rule 4's "no raw scraping" spirit
 * applied to the factory's own other content, not just GitHub's.
 */
export interface Comparison {
  /** Filename without extension, e.g. "ollama-vs-vllm". Used for
   * `generateStaticParams`, not the URL directly (`/compare/:a/:b` takes two
   * separate route segments — see `src/app/compare/[a]/[b]/page.tsx`). */
  slug: string;
  /** The two `content/repos/*.md` slugs being compared, in the file's own
   * authored order — `getComparison` matches either URL order against this
   * pair, but the page always renders in this canonical order so the same
   * comparison looks identical regardless of which repo the reader typed
   * first. */
  repoSlugs: [string, string];
  /** Raw Markdown from the required `## How they differ` section — the one
   * thing about a comparison that can't be computed from either repo's own
   * data. */
  howTheyDiffer: string;
}

export interface RawFile {
  filename: string;
  data: Record<string, unknown>;
  body: string;
}

function readMarkdownFiles(dir: string): RawFile[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((filename) => {
      const raw = fs.readFileSync(path.join(dir, filename), "utf8");
      const { data, content } = matter(raw);
      return { filename, data: data as Record<string, unknown>, body: content.trim() };
    });
}

function requireString(data: Record<string, unknown>, field: string, source: string): string {
  const value = data[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new ContentValidationError(
      `${source} is missing required frontmatter field "${field}" (expected a non-empty string)`,
    );
  }
  return value;
}

function requireStringArray(data: Record<string, unknown>, field: string, source: string): string[] {
  const value = data[field];
  if (!Array.isArray(value) || value.length === 0 || !value.every((v) => typeof v === "string")) {
    throw new ContentValidationError(
      `${source} is missing required frontmatter field "${field}" (expected a non-empty array of strings)`,
    );
  }
  return value;
}

function optionalStringArray(data: Record<string, unknown>, field: string): string[] {
  const value = data[field];
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    throw new ContentValidationError(`optional field "${field}" must be an array of strings when present`);
  }
  return value;
}

/**
 * Content files conventionally open with a `# <Name>` heading that repeats
 * the frontmatter `name` — good for reading the raw Markdown, redundant
 * once the page already renders `name` as its own `<h1>`. Drop just that
 * one leading line so pages don't show the title twice; leave everything
 * else in the body untouched (it's still the authoritative editorial copy).
 */
function stripLeadingTitle(body: string, name: string): string {
  const lines = body.split("\n");
  if (lines[0]?.trim().toLowerCase() === `# ${name}`.toLowerCase()) {
    let rest = lines.slice(1);
    while (rest[0]?.trim() === "") rest = rest.slice(1);
    return rest.join("\n");
  }
  return body;
}

/**
 * Plain-English first paragraph of a Markdown body — the "one-line
 * description" `RepoCard` uses (spec §8/§25's card pattern: hand-authored
 * editorial copy, never a second, competing description) and, since issue
 * #63, `buildSearchIndex`'s second real call site (`src/lib/search.ts`) —
 * extracted here rather than duplicated a second time, matching this
 * codebase's established "extract on second use" convention (see
 * `numberFormatter`'s `src/lib/format.ts` extraction, TECH-DEBT.md
 * 2026-09-29).
 */
export function firstParagraph(body: string): string {
  const paragraph = body.split(/\n\s*\n/)[0] ?? "";
  return paragraph.replace(/\s+/g, " ").trim();
}

/**
 * Splits a repo's raw Markdown body around one `## <heading>` section
 * (removing it entirely), returning what comes before and after. Used by
 * `/repo/[slug]` to swap `content/repos/*.md`'s hand-authored "## Alternatives"
 * prose — explicitly a placeholder, see its own text, "until Phase 3 builds
 * alternative pages" — for the real, computed AlternativesTable
 * (`repo.alternatives`, already structured data) instead of rendering both
 * and duplicating the same names twice on one page. Purely a rendering-layer
 * split, same category as `stripLeadingTitle` above: the source Markdown
 * file itself is untouched, so anyone reading the raw content still sees the
 * hand-authored prose in full.
 *
 * Matches an exact `## <heading>` line (case-insensitive) and removes every
 * line up to (not including) the next `## ` heading or the end of the body.
 * Returns `{ before: body, after: "" }` unchanged if the heading isn't found
 * — every repo today has one, but a future body that omits it must still
 * render safely rather than silently dropping content.
 */
export function splitOutSection(body: string, heading: string): { before: string; after: string } {
  const lines = body.split("\n");
  const headingLine = `## ${heading}`.toLowerCase();
  const startIdx = lines.findIndex((line) => line.trim().toLowerCase() === headingLine);
  if (startIdx === -1) return { before: body, after: "" };

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].trim().toLowerCase().startsWith("## ")) {
      endIdx = i;
      break;
    }
  }

  const before = lines.slice(0, startIdx).join("\n").trimEnd();
  const after = lines.slice(endIdx).join("\n").trimStart();
  return { before, after };
}

/**
 * Extracts the bullet-list items (`- Item`) under one `## <heading>` section
 * of a Markdown body — `content/alternatives/*.md`'s "Open source" / "Free"
 * / "Commercial" / "Best fit" sections are plain bullet lists (spec §4,
 * `ARCHITECTURE.md`), not YAML frontmatter arrays like `Repo.alternatives`.
 *
 * Only matches the `- ` bullet marker (this project's content convention,
 * followed consistently by every existing `content/*.md` file — see e.g.
 * `content/repos/ollama.md`'s "## Pros"/"## Cons" lists) — not CommonMark's
 * `*`/`+` alternatives. A file using one of those would silently produce an
 * empty section rather than failing loudly; editors should stick to `-`.
 *
 * A missing heading, or a heading with no bullet lines under it (e.g. a
 * hand-authored placeholder like `_(to be filled in — Phase 3)_`), both
 * return `[]` rather than throwing — these sections are optional (a product
 * might genuinely have no known commercial alternative), matching the
 * codebase's "omit, don't fabricate" convention rather than requiring every
 * section to always be non-empty. `parseAlternative` separately requires
 * *at least one* of the three alternative-type sections to be non-empty, so
 * a content file that's entirely blank still fails loudly.
 *
 * Exported (not just `parseAlternative`'s private helper) so `/compare/:a/:b`
 * (issue #62) can reuse it directly on a `Repo.body`'s own `## Pros`/`## Cons`
 * sections — the same generic "bullet list under a `## ` heading" shape,
 * reused rather than re-implemented for a second content type.
 */
export function extractListItems(body: string, heading: string): string[] {
  const lines = body.split("\n");
  const headingLine = `## ${heading}`.toLowerCase();
  const startIdx = lines.findIndex((line) => line.trim().toLowerCase() === headingLine);
  if (startIdx === -1) return [];

  const items: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.toLowerCase().startsWith("## ")) break;
    if (line.startsWith("- ")) items.push(line.slice(2).trim());
  }
  return items;
}

/**
 * Extracts the raw Markdown *content* (not bullet items) under one
 * `## <heading>` section of a body — `content/comparisons/*.md`'s
 * `## How they differ` section is hand-written prose, not a list, so
 * `extractListItems`'s bullet-only extraction doesn't fit here. Same
 * heading-matching rules as `extractListItems`/`splitOutSection` (exact
 * `## <heading>` line, case-insensitive, up to the next `## ` heading or end
 * of body); trimmed, and `""` for a missing heading or one with only
 * whitespace beneath it — `parseComparison` is what turns that `""` into a
 * loud failure, this function itself stays a plain extractor.
 */
function extractSectionBody(body: string, heading: string): string {
  const lines = body.split("\n");
  const headingLine = `## ${heading}`.toLowerCase();
  const startIdx = lines.findIndex((line) => line.trim().toLowerCase() === headingLine);
  if (startIdx === -1) return "";

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].trim().toLowerCase().startsWith("## ")) {
      endIdx = i;
      break;
    }
  }
  return lines.slice(startIdx + 1, endIdx).join("\n").trim();
}

/** `"AppFlowy"` -> `"appflowy"`, `"LM Studio"` -> `"lm-studio"` — a
 * candidate `content/repos/*.md` slug to try resolving a plain display name
 * against (see `Alternative`'s doc comment). Purely a best-effort guess: the
 * caller falls back to unresolved/plain-text rendering when `getRepo` of
 * this candidate returns nothing, same as `AlternativesTable`'s explicit-slug
 * resolution already does for genuinely unmatched entries.
 */
export function slugifyAlternativeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function assertNoDuplicateListItems(items: string[], sectionLabel: string, source: string): void {
  const dupe = findDuplicate(items);
  if (dupe) {
    throw new ContentValidationError(
      `${source} lists "${dupe}" more than once under "${sectionLabel}"`,
    );
  }
}

/**
 * Validates `alternatives` frontmatter the way `assertNoGithubCollisions`
 * validates cross-file `github:` fields — fail the build loudly rather than
 * let a bad edit ship silently (CLAUDE.md §3.4). Independent review of the
 * AlternativesTable component (2026-09-29) flagged that neither of these was
 * previously checked, so a duplicate or self-referencing slug would have
 * degraded silently (a duplicate React key on the rendered row, or a repo
 * quietly listed as its own alternative) instead of failing here where an
 * editor would actually see it.
 */
function assertValidAlternatives(alternatives: RepoAlternatives, slug: string, source: string): void {
  if (alternatives.open_source.includes(slug)) {
    throw new ContentValidationError(
      `${source} lists itself ("${slug}") as its own open-source alternative — remove it from "alternatives.open_source"`,
    );
  }
  const dupeOpenSource = findDuplicate(alternatives.open_source);
  if (dupeOpenSource) {
    throw new ContentValidationError(
      `${source} lists "${dupeOpenSource}" more than once under "alternatives.open_source"`,
    );
  }
  const dupeCommercial = findDuplicate(alternatives.commercial);
  if (dupeCommercial) {
    throw new ContentValidationError(
      `${source} lists "${dupeCommercial}" more than once under "alternatives.commercial"`,
    );
  }
}

function findDuplicate(values: string[]): string | undefined {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return undefined;
}

export function parseRepo({ filename, data, body }: RawFile): Repo {
  const source = `content/repos/${filename}`;
  const slug = filename.replace(/\.md$/, "");
  const github = requireString(data, "github", source);
  const name = requireString(data, "name", source);
  const category = requireStringArray(data, "category", source);
  const license = requireString(data, "license", source);
  const status = requireString(data, "status", source);
  const groves = requireStringArray(data, "groves", source);

  if (!REPO_STATUSES.includes(status as RepoStatus)) {
    throw new ContentValidationError(
      `${source} has invalid "status" value "${status}" — expected one of ${REPO_STATUSES.join(", ")}`,
    );
  }

  const featured = typeof data.featured === "boolean" ? data.featured : false;

  const altRaw = (data.alternatives ?? {}) as Record<string, unknown>;
  if (data.alternatives !== undefined && (typeof altRaw !== "object" || altRaw === null || Array.isArray(altRaw))) {
    throw new ContentValidationError(`${source} has an invalid "alternatives" field — expected an object`);
  }
  const alternatives: RepoAlternatives = {
    open_source: optionalStringArray(altRaw, "open_source"),
    commercial: optionalStringArray(altRaw, "commercial"),
  };
  assertValidAlternatives(alternatives, slug, source);

  return {
    slug,
    github,
    name,
    category,
    license,
    status: status as RepoStatus,
    featured,
    groves,
    alternatives,
    body: stripLeadingTitle(body, name),
  };
}

export function parseAlternative({ filename, data, body }: RawFile): Alternative {
  const source = `content/alternatives/${filename}`;
  const slug = filename.replace(/\.md$/, "");
  const product = requireString(data, "product", source);
  const category = requireString(data, "category", source);

  const openSource = extractListItems(body, "Open source");
  const free = extractListItems(body, "Free");
  const commercial = extractListItems(body, "Commercial");
  const bestFit = extractListItems(body, "Best fit");

  if (openSource.length === 0 && free.length === 0 && commercial.length === 0) {
    throw new ContentValidationError(
      `${source} must list at least one alternative under "## Open source", "## Free", or "## Commercial"`,
    );
  }
  assertNoDuplicateListItems(openSource, "Open source", source);
  assertNoDuplicateListItems(free, "Free", source);
  assertNoDuplicateListItems(commercial, "Commercial", source);
  assertNoDuplicateListItems(bestFit, "Best fit", source);

  return { slug, product, category, openSource, free, commercial, bestFit };
}

export function parseGrove({ filename, data, body }: RawFile): Grove {
  const source = `content/groves/${filename}`;
  const slug = filename.replace(/\.md$/, "");
  const name = requireString(data, "name", source);
  const description = requireString(data, "description", source);
  const relatedGroves = optionalStringArray(data, "related_groves");

  return { slug, name, description, relatedGroves, body: stripLeadingTitle(body, name) };
}

/**
 * `content/comparisons/<a>-vs-<b>.md` — see `Comparison`'s doc comment for
 * what this content type is and isn't. Same fail-loudly convention as
 * `parseRepo`/`parseAlternative`: missing/malformed `repos` frontmatter, a
 * self-comparison, or a missing/empty `## How they differ` section all throw
 * `ContentValidationError` rather than shipping a broken or half-empty page.
 * Cross-file checks (both repos actually exist, no duplicate pair across two
 * different files) are deliberately *not* done here — same split
 * `assertNoGithubCollisions` uses, since they need the full parsed set, not
 * just this one file — see `assertComparisonReposExist`/
 * `assertNoDuplicateComparisonPairs` below, called from `getAllComparisons`.
 */
export function parseComparison({ filename, data, body }: RawFile): Comparison {
  const source = `content/comparisons/${filename}`;
  const slug = filename.replace(/\.md$/, "");
  const repoSlugs = requireStringArray(data, "repos", source);

  if (repoSlugs.length !== 2) {
    throw new ContentValidationError(
      `${source} has a "repos" frontmatter field with ${repoSlugs.length} entries — expected exactly 2`,
    );
  }
  const [a, b] = repoSlugs;
  if (a === b) {
    throw new ContentValidationError(
      `${source} compares "${a}" against itself — "repos" must name two different content/repos/*.md slugs`,
    );
  }

  const howTheyDiffer = extractSectionBody(body, "How they differ");
  if (howTheyDiffer === "") {
    throw new ContentValidationError(
      `${source} is missing a non-empty "## How they differ" section — every comparison page needs the one thing ` +
        "that can't be computed from either repo's own data",
    );
  }

  return { slug, repoSlugs: [a, b], howTheyDiffer };
}

/**
 * A comparison content file can only name repos that actually have their
 * own `content/repos/*.md` page — unlike `/alternative/:slug`'s tolerant
 * resolved-or-plain-text rendering, a comparison page has nothing to render
 * (no stars, license, status, pros/cons) for a repo that doesn't exist yet,
 * so this fails the build loudly instead of shipping a half-populated page
 * (issue #62's acceptance criteria: "two repos that already have
 * content/repos/*.md pages").
 */
export function assertComparisonReposExist(comparisons: Comparison[], repos: Repo[]): void {
  const knownSlugs = new Set(repos.map((repo) => repo.slug));
  for (const comparison of comparisons) {
    for (const slug of comparison.repoSlugs) {
      if (!knownSlugs.has(slug)) {
        throw new ContentValidationError(
          `content/comparisons/${comparison.slug}.md names "${slug}" under "repos", but no content/repos/${slug}.md exists`,
        );
      }
    }
  }
}

/**
 * Two different comparison files covering the same unordered pair of repos
 * (`ollama-vs-vllm.md` and a hypothetical `vllm-vs-ollama.md`) would make
 * `getComparison`'s order-independent lookup ambiguous about which one to
 * return — fail loudly rather than silently picking whichever file
 * `readMarkdownFiles`'s alphabetical sort happens to see first.
 */
export function assertNoDuplicateComparisonPairs(comparisons: Comparison[]): void {
  const seen = new Map<string, string>();
  for (const comparison of comparisons) {
    const pairKey = [...comparison.repoSlugs].sort().join("|");
    const existing = seen.get(pairKey);
    if (existing) {
      throw new ContentValidationError(
        `content/comparisons/${existing}.md and content/comparisons/${comparison.slug}.md both compare the same ` +
          `pair of repos (${comparison.repoSlugs.join(", ")}) — keep only one comparison file per pair`,
      );
    }
    seen.set(pairKey, comparison.slug);
  }
}

export function assertNoGithubCollisions(repos: Repo[]): void {
  const seen = new Map<string, string>();
  for (const repo of repos) {
    const existing = seen.get(repo.github);
    if (existing) {
      throw new ContentValidationError(
        `content/repos/${existing}.md and content/repos/${repo.slug}.md both declare github: ${repo.github} — ` +
          "the github field must be unique across all repo content files (see TECH-DEBT.md)",
      );
    }
    seen.set(repo.github, repo.slug);
  }
}

let cachedRepos: Repo[] | null = null;
let cachedGroves: Grove[] | null = null;
let cachedAlternatives: Alternative[] | null = null;
let cachedComparisons: Comparison[] | null = null;

export function getAllRepos(): Repo[] {
  if (cachedRepos) return cachedRepos;
  const repos = readMarkdownFiles(REPOS_DIR).map(parseRepo);
  assertNoGithubCollisions(repos);
  cachedRepos = repos;
  return repos;
}

export function getRepo(slug: string): Repo | undefined {
  return getAllRepos().find((repo) => repo.slug === slug);
}

export function getAllGroves(): Grove[] {
  if (cachedGroves) return cachedGroves;
  cachedGroves = readMarkdownFiles(GROVES_DIR).map(parseGrove);
  return cachedGroves;
}

export function getGrove(slug: string): Grove | undefined {
  return getAllGroves().find((grove) => grove.slug === slug);
}

/** Repos whose frontmatter `groves` array includes the given Grove slug. */
export function getReposInGrove(groveSlug: string): Repo[] {
  return getAllRepos().filter((repo) => repo.groves.includes(groveSlug));
}

export function getAllAlternatives(): Alternative[] {
  if (cachedAlternatives) return cachedAlternatives;
  cachedAlternatives = readMarkdownFiles(ALTERNATIVES_DIR).map(parseAlternative);
  return cachedAlternatives;
}

export function getAlternative(slug: string): Alternative | undefined {
  return getAllAlternatives().find((alternative) => alternative.slug === slug);
}

export function getAllComparisons(): Comparison[] {
  if (cachedComparisons) return cachedComparisons;
  const comparisons = readMarkdownFiles(COMPARISONS_DIR).map(parseComparison);
  assertComparisonReposExist(comparisons, getAllRepos());
  assertNoDuplicateComparisonPairs(comparisons);
  cachedComparisons = comparisons;
  return comparisons;
}

/**
 * Order-independent lookup — `/compare/[a]/[b]/page.tsx` (`src/app/compare`)
 * resolves both `/compare/ollama/vllm` and `/compare/vllm/ollama` to the same
 * `content/comparisons/ollama-vs-vllm.md` file, so the page always renders
 * in that file's own canonical order (`comparison.repoSlugs`) rather than
 * whichever order the reader happened to type into the URL.
 */
export function getComparison(a: string, b: string): Comparison | undefined {
  return getAllComparisons().find(
    (comparison) =>
      (comparison.repoSlugs[0] === a && comparison.repoSlugs[1] === b) ||
      (comparison.repoSlugs[0] === b && comparison.repoSlugs[1] === a),
  );
}

/** Every comparison involving the given repo slug — powers `/repo/[slug]`'s
 * small "Compared with" cross-link section, so a reader who lands on
 * Ollama's page can find the Ollama-vs-vLLM comparison without knowing
 * `/compare/:a/:b` exists. */
export function getComparisonsForRepo(slug: string): Comparison[] {
  return getAllComparisons().filter((comparison) => comparison.repoSlugs.includes(slug));
}
