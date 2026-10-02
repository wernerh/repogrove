import { describe, expect, it } from "vitest";
import { categoryStats, leadParagraph, sizeBucket, type TrendItem } from "@/lib/trend-view";

function item(overrides: Partial<TrendItem>): TrendItem {
  return {
    rank: 1,
    slug: "a",
    name: "A",
    github: "o/a",
    category: "ai",
    blurb: "",
    reason: "",
    metric: "",
    metricNote: "",
    value: 10,
    totalStars: 1000,
    days: 5,
    ...overrides,
  };
}

describe("sizeBucket", () => {
  it("splits at 20k and 100k stars", () => {
    expect(sizeBucket(19_999)).toBe("small");
    expect(sizeBucket(20_000)).toBe("mid");
    expect(sizeBucket(99_999)).toBe("mid");
    expect(sizeBucket(100_000)).toBe("large");
  });
});

describe("leadParagraph", () => {
  it("skips the title, strips inline markup and collapses whitespace", () => {
    const body = "# Ollama\n\nRun **large** language\nmodels [locally](https://x.test).\n\nSecond paragraph.";
    expect(leadParagraph(body)).toBe("Run large language models locally.");
  });
  it("returns an empty string for an empty body", () => {
    expect(leadParagraph("")).toBe("");
  });
});

describe("categoryStats", () => {
  it("hot mode: shares of positive stars gained sum to 100 and ignore declines", () => {
    const stats = categoryStats(
      [
        item({ slug: "a", category: "ai", value: 30 }),
        item({ slug: "b", category: "ai", value: 10 }),
        item({ slug: "c", category: "db", value: 20 }),
        item({ slug: "d", category: "db", value: -50 }),
      ],
      "hot",
    );
    expect(stats.map((s) => s.category)).toEqual(["ai", "db"]);
    expect(stats[0].value).toBeCloseTo(66.67, 1);
    expect(stats[1].value).toBeCloseTo(33.33, 1);
  });
  it("rising mode: mean percent growth per category, highest first", () => {
    const stats = categoryStats(
      [
        item({ category: "ai", value: 1 }),
        item({ category: "ai", value: 3 }),
        item({ category: null, value: 5 }),
      ],
      "rising",
    );
    expect(stats).toEqual([
      { category: "uncategorised", count: 1, value: 5 },
      { category: "ai", count: 2, value: 2 },
    ]);
  });
});
