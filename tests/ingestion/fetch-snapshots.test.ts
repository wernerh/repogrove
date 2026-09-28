// @vitest-environment node
// This suite exercises Node-only ingestion scripts (node:sqlite via snapshots-db.ts);
// the jsdom environment made Vite refuse to bundle that built-in once vitest 5.0.1 /
// @vitejs/plugin-react 6.1.1 landed (PRs #14/#15) — see TECH-DEBT.md.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { openDb, getLatestSnapshot, getTrackedRepos } from "../../scripts/ingestion/snapshots-db.ts";
import {
  readGithubSlugsFromContent,
  fetchRepoMetrics,
  fetchContributorCount,
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
  it("maps the GitHub API repo response to our metric fields", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        stargazers_count: 12345,
        forks_count: 678,
        open_issues_count: 42,
        watchers_count: 12345,
      }),
    );
    // `token: ""` (not `undefined`) forces "no token" — an omitted/undefined token
    // falls back to process.env.GITHUB_TOKEN by design (see fetchRepoMetrics), which in
    // CI is always set, so `undefined` alone can't simulate "no token" here.
    const metrics = await fetchRepoMetrics("ollama/ollama", { fetchImpl, token: "" });
    expect(metrics).toEqual({ stars: 12345, forks: 678, openIssues: 42, watchers: 12345 });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.github.com/repos/ollama/ollama",
      expect.objectContaining({ headers: expect.not.objectContaining({ Authorization: expect.anything() }) }),
    );
  });

  it("sends a bearer token when one is available (e.g. the Actions GITHUB_TOKEN)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ stargazers_count: 1, forks_count: 0, open_issues_count: 0, watchers_count: 1 }));
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
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ stargazers_count: 1, forks_count: 0, open_issues_count: 0, watchers_count: 1 }));
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

describe("runIngestion", () => {
  it("upserts a snapshot (including contributors) for every repo that fetches successfully", async () => {
    const db = openDb(":memory:");
    const fetchMetrics = vi.fn().mockResolvedValue({ stars: 10, forks: 1, openIssues: 0, watchers: 10 });
    const fetchContributors = vi.fn().mockResolvedValue(7);

    const results = await runIngestion({
      db,
      githubSlugs: ["ollama/ollama", "supabase/supabase"],
      fetchMetrics,
      fetchContributors,
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

    const results = await runIngestion({
      db,
      githubSlugs: ["flaky/repo", "ollama/ollama"],
      fetchMetrics,
      fetchContributors,
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
    const now = () => new Date("2026-09-27T08:00:00.000Z");

    await runIngestion({ db, githubSlugs: ["ollama/ollama"], fetchMetrics, fetchContributors, now });
    await runIngestion({ db, githubSlugs: ["ollama/ollama"], fetchMetrics, fetchContributors, now });

    expect(getTrackedRepos(db)).toEqual(["ollama/ollama"]);
    expect(getLatestSnapshot(db, "ollama/ollama")).toMatchObject({ stars: 15, contributors: 4 });
    db.close();
  });

  it("keeps the star/fork/issue snapshot when only the contributor-count fetch fails, storing contributors: null", async () => {
    const db = openDb(":memory:");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMetrics = vi.fn().mockResolvedValue({ stars: 20, forks: 2, openIssues: 1, watchers: 20 });
    const fetchContributors = vi.fn().mockRejectedValue(new Error("GitHub API returned 403 rate limited"));

    const results = await runIngestion({
      db,
      githubSlugs: ["ollama/ollama"],
      fetchMetrics,
      fetchContributors,
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
      now,
    });
    await runIngestion({
      db,
      githubSlugs: ["ollama/ollama"],
      fetchMetrics,
      fetchContributors: vi.fn().mockRejectedValue(new Error("timed out")),
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
});
