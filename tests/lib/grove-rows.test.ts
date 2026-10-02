import { describe, expect, it } from "vitest";
import type { Repo } from "@/lib/content";
import { buildGroveRows, computeGroveStats, initialsFor, topGainers } from "@/lib/grove-rows";
import type { SnapshotRow } from "@/lib/snapshots";
import { makeRow } from "./grove-fixtures";

function snap(github: string, capturedOn: string, stars: number): SnapshotRow {
  return {
    github,
    capturedOn,
    stars,
    forks: 0,
    openIssues: 0,
    watchers: 0,
    source: "test",
    fetchedAt: `${capturedOn}T00:00:00Z`,
    contributors: null,
  };
}

function makeRepo(overrides: Partial<Repo> & { slug: string; github: string }): Repo {
  return {
    name: overrides.slug,
    category: ["devtools", "git"],
    license: "MIT",
    status: "active",
    featured: false,
    groves: ["developer-tools"],
    alternatives: { open_source: [], commercial: [] },
    body: "First paragraph.\n\nSecond paragraph.",
    ...overrides,
  };
}

describe("initialsFor", () => {
  it("uses the first letters of the first two words when hyphenated", () => {
    expect(initialsFor("zed-industries")).toBe("ZI");
    expect(initialsFor("open-webui")).toBe("OW");
  });

  it("uses the first two characters of a single word", () => {
    expect(initialsFor("neovim")).toBe("NE");
    expect(initialsFor("x")).toBe("X");
  });
});

describe("buildGroveRows", () => {
  const repos = [
    makeRepo({
      slug: "lazygit",
      github: "jesseduffield/lazygit",
      alternatives: { open_source: ["tig", "unknown-slug"], commercial: ["GitKraken"] },
    }),
    makeRepo({ slug: "tig", github: "jonas/tig" }),
  ];
  const histories = new Map<string, SnapshotRow[]>([
    // Deliberately out of order: the builder must not assume oldest-first input.
    [
      "jesseduffield/lazygit",
      [snap("jesseduffield/lazygit", "2026-10-02", 1100), snap("jesseduffield/lazygit", "2026-10-01", 1000)],
    ],
    ["jonas/tig", []],
  ]);
  const rows = buildGroveRows(repos, histories, (slug) => (slug === "tig" ? "Tig" : slug));

  it("splits owner/name, takes the editorial first paragraph, and resolves alternatives", () => {
    expect(rows[0]).toMatchObject({
      slug: "lazygit",
      owner: "jesseduffield",
      repoName: "lazygit",
      initials: "LA",
      description: "First paragraph.",
      alternatives: ["Tig", "unknown-slug", "GitKraken"],
    });
  });

  it("derives stars, growth and the sparkline series from real history", () => {
    expect(rows[0]).toMatchObject({
      stars: 1100,
      deltaStars: 100,
      days: 1,
      trend: [1000, 1100],
      latestCapturedOn: "2026-10-02",
    });
  });

  it("represents an untracked repo with nulls and a zero-length window, never a fake 0 stars", () => {
    expect(rows[1]).toMatchObject({
      stars: null,
      deltaStars: null,
      days: 0,
      trend: [],
      latestCapturedOn: null,
    });
  });
});

describe("computeGroveStats", () => {
  const rows = [
    makeRow({ slug: "a", stars: 1000, deltaStars: 20, days: 2, license: "MIT", latestCapturedOn: "2026-10-01" }),
    makeRow({ slug: "b", stars: 500, deltaStars: 30, days: 3, license: "MIT", latestCapturedOn: "2026-10-02" }),
    makeRow({ slug: "c", stars: 250, deltaStars: 0, days: 0, license: "GPL-2.0", status: "maintained" }),
    makeRow({ slug: "d", stars: null, deltaStars: null, days: 0, license: "Apache-2.0", latestCapturedOn: null }),
  ];
  const stats = computeGroveStats(rows);

  it("counts repos and tracked repos separately", () => {
    expect(stats.repoCount).toBe(4);
    expect(stats.trackedCount).toBe(3);
  });

  it("sums stars over tracked repos only", () => {
    expect(stats.collectiveStars).toBe(1750);
  });

  it("takes the median daily gain over repos with a real window (2 repos: 10/day and 10/day)", () => {
    expect(stats.medianDailyGain).toBe(10);
    expect(stats.growthSampleSize).toBe(2);
  });

  it("ranks licenses by frequency then alphabetically and counts statuses", () => {
    expect(stats.licenses).toEqual([
      { license: "MIT", count: 2 },
      { license: "Apache-2.0", count: 1 },
      { license: "GPL-2.0", count: 1 },
    ]);
    expect(stats.statusCounts).toEqual({ active: 3, maintained: 1, inactive: 0 });
  });

  it("reports the most recent snapshot date", () => {
    expect(stats.updatedOn).toBe("2026-10-02");
  });

  it("returns nulls, not zeros, when nothing is tracked", () => {
    const empty = computeGroveStats([makeRow({ slug: "x", stars: null, deltaStars: null, days: 0, latestCapturedOn: null })]);
    expect(empty.collectiveStars).toBeNull();
    expect(empty.medianDailyGain).toBeNull();
    expect(empty.updatedOn).toBeNull();
  });

  it("averages the two middle values for an even-sized sample", () => {
    const even = computeGroveStats([
      makeRow({ slug: "a", deltaStars: 10, days: 1 }),
      makeRow({ slug: "b", deltaStars: 30, days: 1 }),
    ]);
    expect(even.medianDailyGain).toBe(20);
  });
});

describe("topGainers", () => {
  const rows = [
    makeRow({ slug: "a", deltaStars: 5, days: 1 }),
    makeRow({ slug: "b", deltaStars: 50, days: 1 }),
    makeRow({ slug: "c", deltaStars: -9, days: 1 }),
    makeRow({ slug: "d", deltaStars: 0, days: 1 }),
    makeRow({ slug: "e", deltaStars: 99, days: 0 }),
    makeRow({ slug: "f", deltaStars: 20, days: 1 }),
    makeRow({ slug: "g", deltaStars: 10, days: 1 }),
  ];

  it("returns only repos with a real window and a positive gain, biggest first, capped at the limit", () => {
    expect(topGainers(rows).map((r) => r.slug)).toEqual(["b", "f", "g"]);
    expect(topGainers(rows, 2).map((r) => r.slug)).toEqual(["b", "f"]);
  });

  it("returns nothing when no repo has gained stars", () => {
    expect(topGainers([makeRow({ slug: "x", deltaStars: 0, days: 1 })])).toEqual([]);
  });
});
