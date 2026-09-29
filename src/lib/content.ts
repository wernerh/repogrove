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

export function parseGrove({ filename, data, body }: RawFile): Grove {
  const source = `content/groves/${filename}`;
  const slug = filename.replace(/\.md$/, "");
  const name = requireString(data, "name", source);
  const description = requireString(data, "description", source);
  const relatedGroves = optionalStringArray(data, "related_groves");

  return { slug, name, description, relatedGroves, body: stripLeadingTitle(body, name) };
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
