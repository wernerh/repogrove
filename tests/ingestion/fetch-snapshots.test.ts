import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
// Plain JS modules; see snapshots-db.test.ts for why no suppression comment is needed.
import { openDb, getLatestSnapshot, getTrackedRepos } from "../../scripts/ingestion/snapshots-db.mjs";
import { readGithubSlugsFromContent, fetchRepoMetrics, runIngestion } from "../../scripts/ingestion/fetch-snapshots.mjs";

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

describe("runIngestion", () => {
  it("upserts a snapshot for every repo that fetches successfully", async () => {
    const db = openDb(":memory:");
    const fetchMetrics = vi.fn().mockResolvedValue({ stars: 10, forks: 1, openIssues: 0, watchers: 10 });

    const results = await runIngestion({
      db,
      githubSlugs: ["ollama/ollama", "supabase/supabase"],
      fetchMetrics,
      now: () => new Date("2026-09-27T08:00:00.000Z"),
    });

    expect(results).toEqual({ ok: ["ollama/ollama", "supabase/supabase"], failed: [] });
    expect(getTrackedRepos(db)).toEqual(["ollama/ollama", "supabase/supabase"]);
    expect(getLatestSnapshot(db, "ollama/ollama")).toMatchObject({ capturedOn: "2026-09-27", stars: 10 });
    db.close();
  });

  it("logs a warning and keeps going when one repo's fetch fails — never crashes the run", async () => {
    const db = openDb(":memory:");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMetrics = vi.fn().mockImplementation(async (github: string) => {
      if (github === "flaky/repo") throw new Error("GitHub API returned 403 rate limited");
      return { stars: 5, forks: 0, openIssues: 0, watchers: 5 };
    });

    const results = await runIngestion({
      db,
      githubSlugs: ["flaky/repo", "ollama/ollama"],
      fetchMetrics,
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
    const now = () => new Date("2026-09-27T08:00:00.000Z");

    await runIngestion({ db, githubSlugs: ["ollama/ollama"], fetchMetrics, now });
    await runIngestion({ db, githubSlugs: ["ollama/ollama"], fetchMetrics, now });

    expect(getTrackedRepos(db)).toEqual(["ollama/ollama"]);
    expect(getLatestSnapshot(db, "ollama/ollama")).toMatchObject({ stars: 15 });
    db.close();
  });
});
