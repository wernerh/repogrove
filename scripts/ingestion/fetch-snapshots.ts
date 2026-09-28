#!/usr/bin/env node
/**
 * Ingestion job — Phase 2's RepositorySnapshot collector.
 *
 * Run daily by .github/workflows/ingestion.yml. Reads every repo referenced in
 * `/content` frontmatter, fetches current stars/forks/open_issues/watchers plus a
 * total contributor count from the GitHub API, and idempotently upserts one row per
 * (github, captured_on) into data/repogrove.db. See
 * docs/adr/ADR-005-repository-snapshot-storage.md for why this data is stored this
 * way, and its "contributor counts" addendum for why the contributor fetch is a
 * second, independently-failable API call rather than part of fetchRepoMetrics.
 *
 * Never fails the workflow because one repo's fetch failed (network blip, rate limit,
 * a renamed/deleted repo) — logs a warning and moves on, per docs/WORKPLAN.md's Phase 2
 * gate: ingestion "doesn't fail CI when GitHub API is rate-limited". A contributor-count
 * fetch failing on its own is even less disruptive: the star/fork/issue snapshot for
 * that repo is still captured, just with `contributors: null` for the day.
 *
 * TypeScript: see snapshots-db.ts's header comment — `@types/node` now ships
 * `node:sqlite`'s types, so this and snapshots-db.ts no longer need to stay plain JS
 * (TECH-DEBT.md). Run directly via `node scripts/ingestion/fetch-snapshots.ts`; Node 22
 * strips TS syntax at runtime without a build step (no enums/namespaces/decorators used
 * here, so nothing this project relies on needs full type-checking to execute — CI's
 * separate `tsc --noEmit` step still type-checks it).
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { openDb, upsertSnapshot } from "./snapshots-db.ts";

const CONTENT_REPOS_DIR = path.join(process.cwd(), "content", "repos");

// `owner/name` on GitHub: letters/digits/hyphens/underscores/dots either side of exactly
// one slash, with each side rejected outright if it's just "." or ".." (a bare dot
// segment has no legitimate GitHub owner/repo meaning and is the one thing that could
// turn a same-host request into a path-traversal-shaped one, e.g. "../rate_limit").
// Guards the URL this value gets interpolated into in fetchRepoMetrics — the host is
// always the hardcoded api.github.com, so this was never a true cross-host SSRF (no way
// to redirect off that host), but docs/security/README.md's OWASP A10 row flags this
// exact value for review, so it's held to a real allowlist shape rather than a loose
// one. content.ts already requires `github` to be a non-empty string; this is the
// additional shape check that field doesn't enforce.
//
// SEC-001 follow-up (2026-09-27): the previous version of this pattern —
// `/^(?!\.{1,2}$)[\w.-]+\/(?!\.{1,2}$)[\w.-]+$/` — had a dead owner-segment guard: its
// `(?!\.{1,2}$)` lookahead anchors to the end of the *whole* matched string, which the
// mandatory `/name` suffix makes unreachable for the first segment, so an owner of "."
// or ".." was never actually rejected (only the name segment, whose lookahead sits at
// the real string end, was enforced). "../rate_limit" passed validation as a result —
// `new URL("https://api.github.com/repos/../rate_limit").pathname` resolves to
// `/rate_limit`, a same-host path-traversal-shaped request. Each segment is now
// anchored to its own boundary (the `/` on one side, start/end of string on the other),
// so a bare `.`/`..` is rejected on either side of the slash. See
// tests/ingestion/fetch-snapshots.test.ts for the regression tests.
const GITHUB_SLUG_PATTERN = /^(?!\.{1,2}\/)[\w.-]+\/(?!\.{1,2}$)[\w.-]+$/;

/** Every valid `github: owner/name` value declared in content/repos/*.md frontmatter. */
export function readGithubSlugsFromContent(dir: string = CONTENT_REPOS_DIR): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((filename) => filename.endsWith(".md"))
    .flatMap((filename) => {
      const raw = fs.readFileSync(path.join(dir, filename), "utf8");
      const { data } = matter(raw);
      const github = data.github;
      if (typeof github !== "string" || !GITHUB_SLUG_PATTERN.test(github)) {
        if (github !== undefined) {
          console.warn(`[ingestion] ${filename}: "github: ${github}" isn't a valid "owner/name" slug — skipping`);
        }
        return [];
      }
      return [github];
    });
}

/** Per-repo request timeout — see runIngestion's header comment for why this matters:
 * without it, one hung connection would block every repo behind it in the sequential
 * loop, and (via the workflow's cancel-in-progress: false) the next scheduled run too. */
const FETCH_TIMEOUT_MS = 15_000;

export interface RepoMetrics {
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
}

function githubHeaders(token: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "repogrove-ingestion",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * Fetches the current metrics GitHub exposes for one `owner/name` repo.
 * Throws on any non-2xx response, network failure, or timeout — callers decide how to
 * handle that per-repo failure (see runIngestion, which logs and continues).
 */
export async function fetchRepoMetrics(
  github: string,
  { fetchImpl = fetch, token = process.env.GITHUB_TOKEN }: { fetchImpl?: typeof fetch; token?: string } = {},
): Promise<RepoMetrics> {
  const response = await fetchImpl(`https://api.github.com/repos/${github}`, {
    headers: githubHeaders(token),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} ${response.statusText} for ${github}`);
  }
  const body = await response.json();
  return {
    stars: body.stargazers_count,
    forks: body.forks_count,
    openIssues: body.open_issues_count,
    // NOTE: `watchers_count` currently mirrors `stargazers_count` in the GitHub REST
    // API, not the older distinct "watch" concept. The real watch count
    // (`subscribers_count`) needs a separate endpoint — deferred, see TECH-DEBT.md.
    watchers: body.watchers_count,
  };
}

// Matches the `rel="last"` link's `page=N` query param in a GitHub API `Link` response
// header, e.g. `<https://api.github.com/repositories/123/contributors?page=2>; rel="last"`.
const LAST_PAGE_PATTERN = /[?&]page=(\d+)[^>]*>;\s*rel="last"/;

/**
 * Fetches the total contributor count for one `owner/name` repo — a separate API call
 * from `fetchRepoMetrics` (see TECH-DEBT.md: "needs a separate paginated GitHub
 * endpoint, more rate-limit budget", deferred at ADR-005 until the daily stars/forks
 * pipeline was proven).
 *
 * Uses `GET /repos/{owner}/{repo}/contributors?per_page=1&anon=true` — one page per
 * contributor — and reads the total off the `Link` response header's `rel="last"` page
 * number, the standard GitHub pagination-count trick, rather than paging through every
 * contributor. `anon=true` counts contributors GitHub can't map to a user account
 * (common on older repos), matching what a repo's contributor-graph page shows.
 *
 * This is the plain (synchronous) `contributors` listing endpoint, not the heavier
 * `/stats/contributors` endpoint — the latter can return `202` while GitHub computes
 * results in the background and needs a poll-and-retry loop; this one always answers
 * directly with the requested page, so no such handling is needed here.
 *
 * Throws on any non-2xx response, network failure, or timeout, exactly like
 * `fetchRepoMetrics` — but runIngestion treats a *contributor-count* failure as
 * independently recoverable (log a warning, store `contributors: null` for this run,
 * keep the star/fork/issue snapshot), unlike a `fetchRepoMetrics` failure, which skips
 * the whole repo for the day.
 */
export async function fetchContributorCount(
  github: string,
  { fetchImpl = fetch, token = process.env.GITHUB_TOKEN }: { fetchImpl?: typeof fetch; token?: string } = {},
): Promise<number> {
  const response = await fetchImpl(`https://api.github.com/repos/${github}/contributors?per_page=1&anon=true`, {
    headers: githubHeaders(token),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} ${response.statusText} for ${github} contributors`);
  }
  const linkHeader = response.headers.get("link");
  if (linkHeader) {
    const match = linkHeader.match(LAST_PAGE_PATTERN);
    if (match) return Number(match[1]);
  }
  // No `Link` header at all means the whole result fit on one page — at `per_page=1`,
  // that's 0 or 1 total contributors; the response body (an array) says which.
  const body = await response.json();
  return Array.isArray(body) ? body.length : 0;
}

export interface IngestionResults {
  ok: string[];
  failed: string[];
}

/**
 * Fetches and upserts a snapshot for each given `owner/name` slug, skipping (with a
 * logged warning) any repo whose fetch fails, so one bad/rate-limited call never stops
 * the rest of the run or throws away already-committed history. Repos are fetched
 * sequentially, not in parallel — fine for the handful of repos /content has today
 * (see TECH-DEBT.md for when that stops being true) — which is why fetchRepoMetrics'
 * own per-request timeout matters: a single hung connection would otherwise stall every
 * repo behind it, and the workflow's `cancel-in-progress: false` would let that stall
 * push into the next scheduled run too.
 */
export async function runIngestion({
  db,
  githubSlugs,
  fetchMetrics = fetchRepoMetrics,
  fetchContributors = fetchContributorCount,
  now = () => new Date(),
}: {
  db: ReturnType<typeof openDb>;
  githubSlugs: string[];
  fetchMetrics?: (github: string) => Promise<RepoMetrics>;
  fetchContributors?: (github: string) => Promise<number>;
  now?: () => Date;
}): Promise<IngestionResults> {
  const timestamp = now();
  const capturedOn = timestamp.toISOString().slice(0, 10); // YYYY-MM-DD — one row/repo/day
  const results: IngestionResults = { ok: [], failed: [] };

  for (const github of githubSlugs) {
    try {
      const metrics = await fetchMetrics(github);

      // Contributor count is a second, independent API call (see fetchContributorCount's
      // doc comment) — its failure must not throw away a perfectly good star/fork/issue
      // snapshot the way a fetchMetrics failure does. Logged and stored as `null`
      // (upsertSnapshot's COALESCE keeps any previously known value for this row).
      let contributors: number | null = null;
      try {
        contributors = await fetchContributors(github);
      } catch (err) {
        console.warn(
          `[ingestion] ${github}: contributor count unavailable (${err instanceof Error ? err.message : String(err)}) — keeping star/fork/issue snapshot without it`,
        );
      }

      upsertSnapshot(db, {
        github,
        capturedOn,
        stars: metrics.stars,
        forks: metrics.forks,
        openIssues: metrics.openIssues,
        watchers: metrics.watchers,
        fetchedAt: timestamp.toISOString(),
        contributors,
      });
      results.ok.push(github);
    } catch (err) {
      console.warn(`[ingestion] skipping ${github}: ${err instanceof Error ? err.message : String(err)}`);
      results.failed.push(github);
    }
  }
  return results;
}

async function main(): Promise<void> {
  const githubSlugs = readGithubSlugsFromContent();
  if (githubSlugs.length === 0) {
    console.warn("[ingestion] no repos found in content/repos — nothing to do");
    return;
  }

  const db = openDb();
  try {
    const results = await runIngestion({ db, githubSlugs });
    console.log(
      `[ingestion] captured ${results.ok.length}/${githubSlugs.length} repo(s)` +
        (results.failed.length ? `; ${results.failed.length} failed (see warnings above)` : ""),
    );
  } finally {
    db.close();
  }
}

// Only auto-run when executed directly (`node scripts/ingestion/fetch-snapshots.ts`),
// never when imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("[ingestion] fatal error:", err);
    process.exitCode = 1;
  });
}
