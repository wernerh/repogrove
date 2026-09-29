import { describe, expect, it } from "vitest";
import { rankByAbsoluteGrowth } from "@/lib/trending";
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

describe("rankByAbsoluteGrowth", () => {
  it("sorts repos by deltaStars descending (spec §8/§19: absolute growth, not relative)", () => {
    const ollama = repo({ slug: "ollama", github: "ollama/ollama" });
    const supabase = repo({ slug: "supabase", github: "supabase/supabase" });
    const vllm = repo({ slug: "vllm", github: "vllm-project/vllm" });
    const summaries = new Map([
      ["ollama/ollama", summary({ deltaStars: 50 })],
      ["supabase/supabase", summary({ deltaStars: 200 })],
      ["vllm-project/vllm", summary({ deltaStars: 10 })],
    ]);

    const ranked = rankByAbsoluteGrowth([ollama, supabase, vllm], summaries);

    expect(ranked.map((entry) => entry.repo.slug)).toEqual(["supabase", "ollama", "vllm"]);
  });

  it("excludes a repo with no snapshot history at all (summary is null)", () => {
    const tracked = repo({ slug: "ollama", github: "ollama/ollama" });
    const untracked = repo({ slug: "new-repo", github: "someone/new-repo" });
    const summaries = new Map([
      ["ollama/ollama", summary()],
      ["someone/new-repo", null],
    ]);

    const ranked = rankByAbsoluteGrowth([tracked, untracked], summaries);

    expect(ranked.map((entry) => entry.repo.slug)).toEqual(["ollama"]);
  });

  it("excludes a repo with only one snapshot (days === 0 — not enough history for a delta yet)", () => {
    const brandNew = repo({ slug: "brand-new", github: "someone/brand-new" });
    const summaries = new Map([["someone/brand-new", summary({ days: 0, deltaStars: 0 })]]);

    expect(rankByAbsoluteGrowth([brandNew], summaries)).toEqual([]);
  });

  it("does not throw when a repo's github slug is missing from the summaries map entirely", () => {
    const orphan = repo({ slug: "orphan", github: "someone/orphan" });
    expect(rankByAbsoluteGrowth([orphan], new Map())).toEqual([]);
  });

  it("keeps a repo with negative growth in the ranking, sorted to the bottom", () => {
    const declining = repo({ slug: "declining", github: "someone/declining" });
    const growing = repo({ slug: "growing", github: "someone/growing" });
    const summaries = new Map([
      ["someone/declining", summary({ deltaStars: -5 })],
      ["someone/growing", summary({ deltaStars: 5 })],
    ]);

    const ranked = rankByAbsoluteGrowth([declining, growing], summaries);

    expect(ranked.map((entry) => entry.repo.slug)).toEqual(["growing", "declining"]);
  });

  it("returns [] for an empty repo list", () => {
    expect(rankByAbsoluteGrowth([], new Map())).toEqual([]);
  });
});
