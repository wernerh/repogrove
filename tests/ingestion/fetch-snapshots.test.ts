// @vitest-environment node
// This suite exercises Node-only ingestion scripts (node:sqlite via snapshots-db.ts);
// the jsdom environment made Vite refuse to bundle that built-in once vitest 5.0.1 /
// @vitejs/plugin-react 6.1.1 landed (PRs #14/#15) — see TECH-DEBT.md.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { openDb, getLatestSnapshot, getTrackedRepos, getReleases } from "../../scripts/ingestion/snapshots-db.ts";
import {
  readGithubSlugsFromContent,
  fetchRepoMetrics,
  fetchContributorCount,
  parseReleases,
  fetchRepoReleases,
  runIngestion,
} from "../../scripts/ingestion/fetch-snapshots.ts";

function withFixtureContentDir(files: Record<string, string>, run: (dir: string) => void) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "repogrove-ingestion-test-"));
  try {
    for (const [filename, contents] of Object.entries(files)) {
      fs.writeFileSync(path.join(dir, filename), contents);
    }
    run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => body,
  };
}

/** Like jsonResponse, but with a `Link` response header — what fetchContributorCount reads. */
function linkResponse(body: unknown, linkHeader: string | null, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    headers: { get: (name: string) => (name.toLowerCase() === "link" ? linkHeader : null) },
    json: async () => body,
  };
}

describe("readGithubSlugsFromContent", () => {
  it("reads the github field out of real content/repos frontmatter", () => {
    // Exercises the actual /content directory — the same source of truth
    // src/lib/content.ts reads, so this test catches drift between the two readers.
    const slugs = readGithubSlugsFromContent();
    expect(slugs).toContain("ollama/ollama");
    expect(slugs).toContain("supabase/supabase");
  });

  it("returns an empty list for a directory that doesn't exist", () => {
    expect(readGithubSlugsFromContent("/nonexistent/path/for/repogrove/tests")).toEqual([]);
  });

  it("skips a github field that isn't a valid owner/name slug, with a warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withFixtureContentDir(
      {
        "good.md": "---\ngithub: ollama/ollama\n---\nbody",
        "bad.md": '---\ngithub: "https://evil.example.com/repos/x"\n---\nbody',
        "missing.md": "---\nname: No github field\n---\nbody",
      },
      (dir) => {
        expect(readGithubSlugsFromContent(dir)).toEqual(["ollama/ollama"]);
      },
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("bad.md"));
    warnSpy.mockRestore();
  });

  it("rejects a bare-dot-segment slug (e.g. '../..') rather than treating it as a valid owner/name", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withFixtureContentDir(
      {
        "traversal.md": "---\ngithub: ../..\n---\nbody",
      },
      (dir) => {
        expect(readGithubSlugsFromContent(dir)).toEqual([]);
      },
    );
    warnSpy.mockRestore();
  });

  // SEC-001 follow-up: an independent security review of the SEC-001 PR found that the
  // pattern's *owner*-segment guard was dead code — `(?!\.{1,2}$)` anchors to the end of
  // the whole string, which a mandatory `/name` suffix makes unreachable for the first
  // segment, so "owner is '.' or '..'" was never actually being rejected. Only the name
  // segment (anchored at the real string end) was protected. That let a bare-dot owner
  // like "../rate_limit" through, which `new URL("https://api.github.com/repos/../rate_limit")`
  // resolves to `/rate_limit` — a same-host path-traversal-shaped request the code
  // comment and docs/security/README.md's A10 row both claimed was impossible.
  it("rejects a bare-dot-segment OWNER slug (e.g. '../rate_limit'), not just a bare-dot name", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withFixtureContentDir(
      {
        "traversal.md": "---\ngithub: ../rate_limit\n---\nbody",
        "traversal2.md": "---\ngithub: ./name\n---\nbody",
      },
      (dir) => {
        expect(readGithubSlugsFromContent(dir)).toEqual([]);
      },
    );
    warnSpy.mockRestore();
  });

  it("still accepts a real owner/name slug that merely contains dots (not a bare-dot segment)", () => {
    withFixtureContentDir(
      {
        "good.md": "---\ngithub: some.owner/some.repo-name_v2\n---\nbody",
      },
      (dir) => {
        expect(readGithubSlugsFromContent(dir)).toEqual(["some.owner/some.repo-name_v2"]);
      },
    );
  });
});

describe("fetchRepoMetrics", () => {
  it("maps the GitHub API repo response to our metric fields, using subscribers_count (the real watch count) for watchers, not watchers_count (which mirrors stars)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        stargazers_count: 12345,
        forks_count: 678,
        open_issues_count: 42,
        // `watchers_count` deliberately mirrors stars here — the real GitHub API
        // behaviour this test guards against regressing back to. `subscribers_count`
        // is the distinct, genuinely-lower "watch" count.
        watchers_count: 12345,
        subscribers_count: 842,
      }),
    );
    // `token: ""` (not `undefined`) forces "no token" — an omitted/undefined token
    // falls back to process.env.GITHUB_TOKEN by design (see fetchRepoMetrics), which in
    // CI is always set, so `undefined` alone can't simulate "no token" here.
    const metrics = await fetchRepoMetrics("ollama/ollama", { fetchImpl, token: "" });
    expect(metrics).toEqual({ stars: 12345, forks: 678, openIssues: 42, watchers: 842 });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.github.com/repos/ollama/ollama",
      expect.objectContaining({ headers: expect.not.objectContaining({ Authorization: expect.anything() }) }),
    );
  });

  it("sends a bearer token when one is available (e.g. the Actions GITHUB_TOKEN)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ stargazers_count: 1, forks_count: 0, open_issues_count: 0, watchers_count: 1, subscribers_count: 1 }),
    );
    await fetchRepoMetrics("ollama/ollama", { fetchImpl, token: "test-token" });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer test-token" }) }),
    );
  });

  it("throws on a non-2xx response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ message: "rate limited" }, false, 403));
    await expect(fetchRepoMetrics("ollama/ollama", { fetchImpl, token: "" })).rejects.toThrow(/403/);
  });

  it("passes an abort signal so a hung request doesn't block the run forever", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ stargazers_count: 1, forks_count: 0, open_issues_count: 0, watchers_count: 1, subscribers_count: 1 }),
    );
    await fetchRepoMetrics("ollama/ollama", { fetchImpl, token: "" });
    const [, options] = fetchImpl.mock.calls[0];
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("propagates a timeout abort as a rejected fetch (runIngestion's job to catch it)", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError"));
    await expect(fetchRepoMetrics("ollama/ollama", { fetchImpl, token: "" })).rejects.toThrow(/timed out/i);
  });
});

describe("fetchContributorCount", () => {
  it("reads the total off the Link header's rel=\"last\" page number", async () => {
    const linkHeader =
      '<https://api.github.com/repositories/1/contributors?per_page=1&anon=true&page=2>; rel="next", ' +
      '<https://api.github.com/repositories/1/contributors?per_page=1&anon=true&page=214>; rel="last"';
    const fetchImpl = vi.fn().mockResolvedValue(linkResponse([{ login: "octocat" }], linkHeader));

    const count = await fetchContributorCount("ollama/ollama", { fetchImpl, token: "" });

    expect(count).toBe(214);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.github.com/repos/ollama/ollama/contributors?per_page=1&anon=true",
      expect.objectContaining({ headers: expect.not.objectContaining({ Authorization: expect.anything() }) }),
    );
  });

  it("falls back to the response body's length when there's no Link header (0 or 1 total contributor)", async () => {
    const oneContributor = vi.fn().mockResolvedValue(linkResponse([{ login: "solo-maintainer" }], null));
    expect(await fetchContributorCount("solo/repo", { fetchImpl: oneContributor, token: "" })).toBe(1);

    const zeroContributors = vi.fn().mockResolvedValue(linkResponse([], null));
    expect(await fetchContributorCount("empty/repo", { fetchImpl: zeroContributors, token: "" })).toBe(0);
  });

  it("sends a bearer token when one is available", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(linkResponse([], null));
    await fetchContributorCount("ollama/ollama", { fetchImpl, token: "test-token" });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer test-token" }) }),
    );
  });

  it("throws on a non-2xx response, like fetchRepoMetrics", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(linkResponse({ message: "rate limited" }, null, false, 403));
    await expect(fetchContributorCount("ollama/ollama", { fetchImpl, token: "" })).rejects.toThrow(/403/);
  });

  it('throws rather than silently under-counting when a Link header is present but has no rel="last" (e.g. only rel="next")', async () => {
    // A response mid-pagination that somehow only carries "next" (no "last") would,
    // if this fell through to the response body's length, silently record 0 or 1 as
    // the total for what could be a repo with hundreds of contributors. Must throw
    // instead, so runIngestion logs it and stores `contributors: null`.
    const linkHeader = '<https://api.github.com/repositories/1/contributors?per_page=1&anon=true&page=2>; rel="next"';
    const fetchImpl = vi.fn().mockResolvedValue(linkResponse([{ login: "octocat" }], linkHeader));
    await expect(fetchContributorCount("ollama/ollama", { fetchImpl, token: "" })).rejects.toThrow(/rel="last"/);
  });
});

describe("parseReleases", () => {
  it("maps a GitHub releases API response to our release fields", () => {
    const releases = parseReleases([
      {
        tag_name: "v1.8.0",
        name: "v1.8.0",
        html_url: "https://github.com/ollama/ollama/releases/tag/v1.8.0",
        published_at: "2026-09-20T12:00:00Z",
        draft: false,
        prerelease: false,
      },
    ]);
    expect(releases).toEqual([
      {
        tagName: "v1.8.0",
        name: "v1.8.0",
        htmlUrl: "https://github.com/ollama/ollama/releases/tag/v1.8.0",
        publishedAt: "2026-09-20T12:00:00Z",
      },
    ]);
  });

  it("excludes draft releases — they aren't publicly visible on GitHub either", () => {
    const releases = parseReleases([
      {
        tag_name: "v1.9.0-draft",
        name: "WIP",
        html_url: "https://github.com/ollama/ollama/releases/tag/v1.9.0-draft",
        published_at: null,
        draft: true,
      },
      {
        tag_name: "v1.8.0",
        name: "v1.8.0",
        html_url: "https://github.com/ollama/ollama/releases/tag/v1.8.0",
        published_at: "2026-09-20T12:00:00Z",
        draft: false,
      },
    ]);
    expect(releases.map((r) => r.tagName)).toEqual(["v1.8.0"]);
  });

  it("keeps prereleases — they're real, publicly linkable releases", () => {
    const releases = parseReleases([
      {
        tag_name: "v2.0.0-rc1",
        name: "v2.0.0 RC1",
        html_url: "https://github.com/ollama/ollama/releases/tag/v2.0.0-rc1",
        published_at: "2026-09-20T12:00:00Z",
        draft: false,
        prerelease: true,
      },
    ]);
    expect(releases.map((r) => r.tagName)).toEqual(["v2.0.0-rc1"]);
  });

  it("falls back to null when a release has no name — never fabricates one", () => {
    const releases = parseReleases([
      {
        tag_name: "v1.0.0",
        name: null,
        html_url: "https://github.com/ollama/ollama/releases/tag/v1.0.0",
        published_at: "2026-09-20T12:00:00Z",
        draft: false,
      },
    ]);
    expect(releases[0].name).toBeNull();
  });

  it("falls back to created_at when published_at is missing (e.g. a draft-turned-live edge case)", () => {
    const releases = parseReleases([
      {
        tag_name: "v1.0.0",
        name: "v1.0.0",
        html_url: "https://github.com/ollama/ollama/releases/tag/v1.0.0",
        created_at: "2026-09-19T00:00:00Z",
        draft: false,
      },
    ]);
    expect(releases[0].publishedAt).toBe("2026-09-19T00:00:00Z");
  });

  it("returns an empty list for a non-array body", () => {
    expect(parseReleases({ message: "not found" })).toEqual([]);
    expect(parseReleases(null)).toEqual([]);
  });

  it("skips a malformed (non-object) entry rather than throwing", () => {
    expect(parseReleases(["not an object"])).toEqual([]);
  });

  // Independent review flagged this before push: an earlier version of parseReleases
  // coerced every field with String(...), so a genuinely missing field became the
  // literal text "undefined" rather than being skipped — that string then reached
  // `new Date(...)` on /repo/[slug] (dateFormatter.format), which throws on an
  // Invalid Date and would have broken that repo's whole page render for one
  // malformed release. These entries must be skipped, not stored with a placeholder.
  it("skips an entry missing tag_name, rather than storing the string \"undefined\"", () => {
    const releases = parseReleases([
      { name: "v1.0.0", html_url: "https://github.com/ollama/ollama/releases/tag/v1.0.0", published_at: "2026-09-20T12:00:00Z", draft: false },
    ]);
    expect(releases).toEqual([]);
  });

  it("skips an entry missing both published_at and created_at (no resolvable date)", () => {
    const releases = parseReleases([
      { tag_name: "v1.0.0", name: "v1.0.0", html_url: "https://github.com/ollama/ollama/releases/tag/v1.0.0", draft: false },
    ]);
    expect(releases).toEqual([]);
  });

  it("skips an entry whose published_at/created_at doesn't parse as a date", () => {
    const releases = parseReleases([
      {
        tag_name: "v1.0.0",
        name: "v1.0.0",
        html_url: "https://github.com/ollama/ollama/releases/tag/v1.0.0",
        published_at: "not-a-date",
        draft: false,
      },
    ]);
    expect(releases).toEqual([]);
  });

  it("skips an entry whose html_url isn't a real https://github.com/... link", () => {
    const releases = parseReleases([
      {
        tag_name: "v1.0.0",
        name: "v1.0.0",
        html_url: "javascript:alert(1)",
        published_at: "2026-09-20T12:00:00Z",
        draft: false,
      },
    ]);
    expect(releases).toEqual([]);
  });
});

describe("fetchRepoReleases", () => {
  it("fetches per_page=10 recent releases (over-fetches 2x what it keeps) and parses them", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse([
        {
          tag_name: "v1.8.0",
          name: "v1.8.0",
          html_url: "https://github.com/ollama/ollama/releases/tag/v1.8.0",
          published_at: "2026-09-20T00:00:00Z",
          draft: false,
        },
      ]),
    );
    const releases = await fetchRepoReleases("ollama/ollama", { fetchImpl, token: "" });
    expect(releases).toEqual([
      {
        tagName: "v1.8.0",
        name: "v1.8.0",
        htmlUrl: "https://github.com/ollama/ollama/releases/tag/v1.8.0",
        publishedAt: "2026-09-20T00:00:00Z",
      },
    ]);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.github.com/repos/ollama/ollama/releases?per_page=10",
      expect.objectContaining({ headers: expect.not.objectContaining({ Authorization: expect.anything() }) }),
    );
  });

  it("sends a bearer token when one is available", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse([]));
    await fetchRepoReleases("ollama/ollama", { fetchImpl, token: "test-token" });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer test-token" }) }),
    );
  });

  it("throws on a non-2xx response, like fetchRepoMetrics/fetchContributorCount", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ message: "rate limited" }, false, 403));
    await expect(fetchRepoReleases("ollama/ollama", { fetchImpl, token: "" })).rejects.toThrow(/403/);
  });

  // TECH-DEBT.md 2026-09-30: GitHub applies `per_page` *server-side*, before we can
  // filter out drafts — so a draft among the most-recently-created releases used to
  // push a real, already-published release out of the top-5 window. This mock
  // reproduces that server-side truncation (slicing the fixture to the *requested*
  // `per_page` before responding, exactly like the real API would), so it genuinely
  // exercises the bug: under the old `per_page=5` request, the 5 most-recently-created
  // entries are all drafts, so GitHub would hand back only those 5 and every one gets
  // filtered out downstream, leaving 0 releases. Requesting `per_page=10` (this fix)
  // gets all 10 back, `parseReleases` drops the 5 drafts, and the 5 real releases
  // survive.
  it("doesn't let drafts among the most-recent releases push real releases out of the top 5", async () => {
    const drafts = Array.from({ length: 5 }, (_, i) => ({
      tag_name: `v0.0.${i}-draft`,
      name: null,
      html_url: `https://github.com/ollama/ollama/releases/tag/v0.0.${i}-draft`,
      published_at: "2026-09-25T00:00:00Z",
      draft: true,
    }));
    const realReleases = Array.from({ length: 5 }, (_, i) => ({
      tag_name: `v1.${i}.0`,
      name: `v1.${i}.0`,
      html_url: `https://github.com/ollama/ollama/releases/tag/v1.${i}.0`,
      published_at: "2026-09-2" + i + "T00:00:00Z",
      draft: false,
    }));
    // Newest-created-first, same order GitHub's real /releases endpoint returns.
    const allReleasesNewestFirst = [...drafts, ...realReleases];
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const perPage = Number(new URL(url.toString()).searchParams.get("per_page"));
      return jsonResponse(allReleasesNewestFirst.slice(0, perPage)) as unknown as Response;
    });
    const releases = await fetchRepoReleases("ollama/ollama", { fetchImpl, token: "" });
    expect(releases).toHaveLength(5);
    expect(releases.every((r) => !r.tagName.includes("draft"))).toBe(true);
    expect(releases.map((r) => r.tagName)).toEqual(["v1.0.0", "v1.1.0", "v1.2.0", "v1.3.0", "v1.4.0"]);
  });
});

describe("runIngestion", () => {
  it("upserts a snapshot (including contributors) for every repo that fetches successfully", async () => {
    const db = openDb(":memory:");
    const fetchMetrics = vi.fn().mockResolvedValue({ stars: 10, forks: 1, openIssues: 0, watchers: 10 });
    const fetchContributors = vi.fn().mockResolvedValue(7);
    const fetchReleases = vi.fn().mockResolvedValue([]);

    const results = await runIngestion({
      db,
      githubSlugs: ["ollama/ollama", "supabase/supabase"],
      fetchMetrics,
      fetchContributors,
      fetchReleases,
      now: () => new Date("2026-09-27T08:00:00.000Z"),
    });

    expect(results).toEqual({ ok: ["ollama/ollama", "supabase/supabase"], failed: [] });
    expect(getTrackedRepos(db)).toEqual(["ollama/ollama", "supabase/supabase"]);
    expect(getLatestSnapshot(db, "ollama/ollama")).toMatchObject({ capturedOn: "2026-09-27", stars: 10, contributors: 7 });
    db.close();
  });

  it("logs a warning and keeps going when one repo's fetch fails — never crashes the run", async () => {
    const db = openDb(":memory:");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMetrics = vi.fn().mockImplementation(async (github: string) => {
      if (github === "flaky/repo") throw new Error("GitHub API returned 403 rate limited");
      return { stars: 5, forks: 0, openIssues: 0, watchers: 5 };
    });
    const fetchContributors = vi.fn().mockResolvedValue(3);
    const fetchReleases = vi.fn().mockResolvedValue([]);

    const results = await runIngestion({
      db,
      githubSlugs: ["flaky/repo", "ollama/ollama"],
      fetchMetrics,
      fetchContributors,
      fetchReleases,
      now: () => new Date("2026-09-27T08:00:00.000Z"),
    });

    expect(results).toEqual({ ok: ["ollama/ollama"], failed: ["flaky/repo"] });
    expect(getLatestSnapshot(db, "flaky/repo")).toBeNull();
    expect(getLatestSnapshot(db, "ollama/ollama")).not.toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("flaky/repo"));
    warnSpy.mockRestore();
    db.close();
  });

  it("is idempotent across repeated runs on the same day", async () => {
    const db = openDb(":memory:");
    const fetchMetrics = vi
      .fn()
      .mockResolvedValueOnce({ stars: 10, forks: 1, openIssues: 0, watchers: 10 })
      .mockResolvedValueOnce({ stars: 15, forks: 1, openIssues: 0, watchers: 15 });
    const fetchContributors = vi.fn().mockResolvedValue(4);
    const fetchReleases = vi.fn().mockResolvedValue([]);
    const now = () => new Date("2026-09-27T08:00:00.000Z");

    await runIngestion({ db, githubSlugs: ["ollama/ollama"], fetchMetrics, fetchContributors, fetchReleases, now });
    await runIngestion({ db, githubSlugs: ["ollama/ollama"], fetchMetrics, fetchContributors, fetchReleases, now });

    expect(getTrackedRepos(db)).toEqual(["ollama/ollama"]);
    expect(getLatestSnapshot(db, "ollama/ollama")).toMatchObject({ stars: 15, contributors: 4 });
    db.close();
  });

  it("keeps the star/fork/issue snapshot when only the contributor-count fetch fails, storing contributors: null", async () => {
    const db = openDb(":memory:");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMetrics = vi.fn().mockResolvedValue({ stars: 20, forks: 2, openIssues: 1, watchers: 20 });
    const fetchContributors = vi.fn().mockRejectedValue(new Error("GitHub API returned 403 rate limited"));
    const fetchReleases = vi.fn().mockResolvedValue([]);

    const results = await runIngestion({
      db,
      githubSlugs: ["ollama/ollama"],
      fetchMetrics,
      fetchContributors,
      fetchReleases,
      now: () => new Date("2026-09-27T08:00:00.000Z"),
    });

    expect(results).toEqual({ ok: ["ollama/ollama"], failed: [] });
    expect(getLatestSnapshot(db, "ollama/ollama")).toMatchObject({ stars: 20, contributors: null });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("contributor count unavailable"));
    warnSpy.mockRestore();
    db.close();
  });

  it("preserves a previously known contributor count when a later same-day re-run's contributor fetch fails", async () => {
    const db = openDb(":memory:");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMetrics = vi.fn().mockResolvedValue({ stars: 20, forks: 2, openIssues: 1, watchers: 20 });
    const now = () => new Date("2026-09-27T08:00:00.000Z");

    await runIngestion({
      db,
      githubSlugs: ["ollama/ollama"],
      fetchMetrics,
      fetchContributors: vi.fn().mockResolvedValue(9),
      fetchReleases: vi.fn().mockResolvedValue([]),
      now,
    });
    await runIngestion({
      db,
      githubSlugs: ["ollama/ollama"],
      fetchMetrics,
      fetchContributors: vi.fn().mockRejectedValue(new Error("timed out")),
      fetchReleases: vi.fn().mockResolvedValue([]),
      now,
    });

    expect(getLatestSnapshot(db, "ollama/ollama")).toMatchObject({ contributors: 9 });
    warnSpy.mockRestore();
    db.close();
  });

  it("defaults to the real fetchContributorCount when none is injected (production wiring)", async () => {
    // Doesn't hit the network: fetchMetrics fails first for this repo, so runIngestion's
    // try/catch skips straight to `results.failed` and never reaches the contributor
    // fetch at all — this only asserts the default parameter wiring compiles/behaves,
    // not fetchContributorCount's own logic (covered above).
    const db = openDb(":memory:");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMetrics = vi.fn().mockRejectedValue(new Error("network unreachable"));

    const results = await runIngestion({
      db,
      githubSlugs: ["ollama/ollama"],
      fetchMetrics,
      now: () => new Date("2026-09-27T08:00:00.000Z"),
    });

    expect(results).toEqual({ ok: [], failed: ["ollama/ollama"] });
    warnSpy.mockRestore();
    db.close();
  });

  describe("releases (issue #72)", () => {
    it("upserts every release fetchReleases returns for a repo", async () => {
      const db = openDb(":memory:");
      const fetchMetrics = vi.fn().mockResolvedValue({ stars: 10, forks: 1, openIssues: 0, watchers: 10 });
      const fetchContributors = vi.fn().mockResolvedValue(7);
      const fetchReleases = vi.fn().mockResolvedValue([
        { tagName: "v1.8.0", name: "v1.8.0", htmlUrl: "https://x/v1.8.0", publishedAt: "2026-09-20T00:00:00Z" },
        { tagName: "v1.7.0", name: null, htmlUrl: "https://x/v1.7.0", publishedAt: "2026-09-01T00:00:00Z" },
      ]);

      await runIngestion({
        db,
        githubSlugs: ["ollama/ollama"],
        fetchMetrics,
        fetchContributors,
        fetchReleases,
        now: () => new Date("2026-09-27T08:00:00.000Z"),
      });

      const releases = getReleases(db, "ollama/ollama");
      expect(releases.map((r) => r.tagName)).toEqual(["v1.8.0", "v1.7.0"]);
      expect(releases[1].name).toBeNull();
      db.close();
    });

    it("keeps the star/fork/issue snapshot and any previously known releases when the releases fetch fails", async () => {
      const db = openDb(":memory:");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const fetchMetrics = vi.fn().mockResolvedValue({ stars: 20, forks: 2, openIssues: 1, watchers: 20 });
      const fetchContributors = vi.fn().mockResolvedValue(3);

      // First run captures a real release...
      await runIngestion({
        db,
        githubSlugs: ["ollama/ollama"],
        fetchMetrics,
        fetchContributors,
        fetchReleases: vi.fn().mockResolvedValue([
          { tagName: "v1.8.0", name: "v1.8.0", htmlUrl: "https://x/v1.8.0", publishedAt: "2026-09-20T00:00:00Z" },
        ]),
        now: () => new Date("2026-09-27T08:00:00.000Z"),
      });

      // ...a later run's releases fetch fails, but the snapshot and the earlier
      // release must both survive — never wiped by an unrelated third-call failure.
      const results = await runIngestion({
        db,
        githubSlugs: ["ollama/ollama"],
        fetchMetrics,
        fetchContributors,
        fetchReleases: vi.fn().mockRejectedValue(new Error("GitHub API returned 403 rate limited")),
        now: () => new Date("2026-09-28T08:00:00.000Z"),
      });

      expect(results).toEqual({ ok: ["ollama/ollama"], failed: [] });
      expect(getLatestSnapshot(db, "ollama/ollama")).toMatchObject({ stars: 20 });
      expect(getReleases(db, "ollama/ollama").map((r) => r.tagName)).toEqual(["v1.8.0"]);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("releases unavailable"));
      warnSpy.mockRestore();
      db.close();
    });

    it("is idempotent — re-ingesting the same release updates it in place, not duplicated", async () => {
      const db = openDb(":memory:");
      const fetchMetrics = vi.fn().mockResolvedValue({ stars: 10, forks: 1, openIssues: 0, watchers: 10 });
      const fetchContributors = vi.fn().mockResolvedValue(7);
      const now = () => new Date("2026-09-27T08:00:00.000Z");
      const release = { tagName: "v1.8.0", name: "v1.8.0", htmlUrl: "https://x/v1.8.0", publishedAt: "2026-09-20T00:00:00Z" };

      await runIngestion({
        db,
        githubSlugs: ["ollama/ollama"],
        fetchMetrics,
        fetchContributors,
        fetchReleases: vi.fn().mockResolvedValue([release]),
        now,
      });
      await runIngestion({
        db,
        githubSlugs: ["ollama/ollama"],
        fetchMetrics,
        fetchContributors,
        fetchReleases: vi.fn().mockResolvedValue([{ ...release, name: "v1.8.0 (edited)" }]),
        now,
      });

      const releases = getReleases(db, "ollama/ollama");
      expect(releases).toHaveLength(1);
      expect(releases[0].name).toBe("v1.8.0 (edited)");
      db.close();
    });

    it("defaults to the real fetchRepoReleases when none is injected (production wiring)", async () => {
      // Same reasoning as the equivalent fetchContributorCount test above: fetchMetrics
      // fails first, so runIngestion never reaches the releases fetch at all — this
      // only asserts the default parameter wiring compiles/behaves.
      const db = openDb(":memory:");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const fetchMetrics = vi.fn().mockRejectedValue(new Error("network unreachable"));

      const results = await runIngestion({
        db,
        githubSlugs: ["ollama/ollama"],
        fetchMetrics,
        now: () => new Date("2026-09-27T08:00:00.000Z"),
      });

      expect(results).toEqual({ ok: [], failed: ["ollama/ollama"] });
      warnSpy.mockRestore();
      db.close();
    });
  });
});
