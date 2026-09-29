import { describe, expect, it } from "vitest";
import { rankByRelativeGrowth } from "@/lib/rising";
import type { Repo } from "@/lib/content";
import type { GrowthSummary } from "@/lib/snapshots";

function repo(overrides: Partial<Repo> = {}): Repo {
  return {
    slug: "ollama",
    github: "ollama/ollama",
    name: "Ollama",
    category: ["ai"],
    license: "MIT",
    status: "active",
    featured: false,
    groves: ["ai"],
    alternatives: { open_source: [], commercial: [] },
    body: "Run large language models locally.",
    ...overrides,
  };
}

function summary(overrides: Partial<GrowthSummary> = {}): GrowthSummary {
  return { currentStars: 100, deltaStars: 10, days: 2, trackingSince: "2026-09-25", ...overrides };
}

describe("rankByRelativeGrowth", () => {
  it("sorts repos by percent growth descending (spec §6/§20: relative to size, not absolute stars)", () => {
    // A small repo gaining fewer absolute stars but a much bigger share of
    // its own size should outrank a much larger repo's bigger absolute
    // gain — the entire point of /rising vs. /trending (issue #20).
    const small = repo({
      slug: "small",
      github: "someone/small",
      name: "Small",
    });
    const large = repo({
      slug: "large",
      github: "someone/large",
      name: "Large",
    });
    const summaries = new Map([
      // baseline 100, +50 -> +50%
      ["someone/small", summary({ currentStars: 150, deltaStars: 50 })],
      // baseline 100,000, +5,000 -> +5%
      ["someone/large", summary({ currentStars: 105_000, deltaStars: 5_000 })],
    ]);

    const ranked = rankByRelativeGrowth([small, large], summaries);

    expect(ranked.map((entry) => entry.repo.slug)).toEqual(["small", "large"]);
    expect(ranked[0].percentGrowth).toBeCloseTo(50);
    expect(ranked[1].percentGrowth).toBeCloseTo(5);
  });

  it("excludes a repo with no snapshot history at all (summary is null)", () => {
    const tracked = repo({ slug: "ollama", github: "ollama/ollama" });
    const untracked = repo({ slug: "new-repo", github: "someone/new-repo" });
    const summaries = new Map([
      ["ollama/ollama", summary()],
      ["someone/new-repo", null],
    ]);

    const ranked = rankByRelativeGrowth([tracked, untracked], summaries);

    expect(ranked.map((entry) => entry.repo.slug)).toEqual(["ollama"]);
  });

  it("excludes a repo with only one snapshot (days === 0 — not enough history for a delta yet)", () => {
    const brandNew = repo({ slug: "brand-new", github: "someone/brand-new" });
    const summaries = new Map([["someone/brand-new", summary({ days: 0, deltaStars: 0 })]]);

    expect(rankByRelativeGrowth([brandNew], summaries)).toEqual([]);
  });

  it("does not throw when a repo's github slug is missing from the summaries map entirely", () => {
    const orphan = repo({ slug: "orphan", github: "someone/orphan" });
    expect(rankByRelativeGrowth([orphan], new Map())).toEqual([]);
  });

  it("keeps a repo with negative growth in the ranking, sorted to the bottom", () => {
    const declining = repo({ slug: "declining", github: "someone/declining" });
    const growing = repo({ slug: "growing", github: "someone/growing" });
    const summaries = new Map([
      // baseline 100, -5 -> -5%
      ["someone/declining", summary({ currentStars: 95, deltaStars: -5 })],
      // baseline 100, +5 -> +5%
      ["someone/growing", summary({ currentStars: 105, deltaStars: 5 })],
    ]);

    const ranked = rankByRelativeGrowth([declining, growing], summaries);

    expect(ranked.map((entry) => entry.repo.slug)).toEqual(["growing", "declining"]);
  });

  it("excludes a repo whose baseline star count is zero (percentage would be undefined/meaningless)", () => {
    // currentStars - deltaStars === 0: a repo that appears to have started
    // from 0 stars. Dividing by zero would produce Infinity/NaN, not a
    // real percentage — this page shows real numbers only, never a
    // fabricated or nonsensical one.
    const fromZero = repo({ slug: "from-zero", github: "someone/from-zero" });
    const summaries = new Map([["someone/from-zero", summary({ currentStars: 20, deltaStars: 20 })]]);

    expect(rankByRelativeGrowth([fromZero], summaries)).toEqual([]);
  });

  it("excludes a repo whose baseline star count is negative (same guard, the other side of the boundary)", () => {
    // currentStars - deltaStars < 0: not realistic for real GitHub data
    // (stars can't go negative), but the same `<= 0` guard covers it —
    // exercised explicitly here rather than assuming the zero case above
    // proves this branch too.
    const negativeBaseline = repo({ slug: "negative-baseline", github: "someone/negative-baseline" });
    const summaries = new Map([
      ["someone/negative-baseline", summary({ currentStars: 10, deltaStars: 20 })],
    ]);

    expect(rankByRelativeGrowth([negativeBaseline], summaries)).toEqual([]);
  });

  it("returns [] for an empty repo list", () => {
    expect(rankByRelativeGrowth([], new Map())).toEqual([]);
  });
});
