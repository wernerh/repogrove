import { describe, expect, it } from "vitest";
import { alternativeDescription, buildSearchIndex, searchEntries, type SearchEntry } from "@/lib/search";
import { getAllAlternatives, getAllGroves, getAllRepos } from "@/lib/content";

function entry(overrides: Partial<SearchEntry> = {}): SearchEntry {
  return {
    type: "repo",
    slug: "ollama",
    title: "Ollama",
    description: "Run large language models locally.",
    categories: ["ai", "llm"],
    url: "/repo/ollama",
    ...overrides,
  };
}

describe("buildSearchIndex (issue #63, real /content fixtures)", () => {
  it("includes every real repo, with a firstParagraph description and its own categories/url", () => {
    const index = buildSearchIndex();
    for (const repo of getAllRepos()) {
      const found = index.find((e) => e.type === "repo" && e.slug === repo.slug);
      expect(found).toBeDefined();
      expect(found?.title).toBe(repo.name);
      expect(found?.categories).toEqual(repo.category);
      expect(found?.url).toBe(`/repo/${repo.slug}`);
      expect(found?.description.length).toBeGreaterThan(0);
    }
    expect(getAllRepos().length).toBeGreaterThan(0);
  });

  it("includes every real Grove, using its frontmatter description", () => {
    const index = buildSearchIndex();
    for (const grove of getAllGroves()) {
      const found = index.find((e) => e.type === "grove" && e.slug === grove.slug);
      expect(found).toBeDefined();
      expect(found?.title).toBe(grove.name);
      expect(found?.description).toBe(grove.description);
      expect(found?.url).toBe(`/grove/${grove.slug}`);
    }
    expect(getAllGroves().length).toBeGreaterThan(0);
  });

  it("includes every real alternative, titled by product with its category wrapped in an array", () => {
    const index = buildSearchIndex();
    for (const alternative of getAllAlternatives()) {
      const found = index.find((e) => e.type === "alternative" && e.slug === alternative.slug);
      expect(found).toBeDefined();
      expect(found?.title).toBe(alternative.product);
      expect(found?.categories).toEqual([alternative.category]);
      expect(found?.url).toBe(`/alternative/${alternative.slug}`);
    }
    expect(getAllAlternatives().length).toBeGreaterThan(0);
  });

  it("does not index comparisons (ADR-008: reached from a repo page, not searched directly)", () => {
    const index = buildSearchIndex();
    expect(index.some((e) => (e.type as string) === "comparison")).toBe(false);
  });

  it("omits rather than fabricates a description for an alternative with no bestFit items", () => {
    // Every real content/alternatives/*.md today has bestFit filled in, so
    // this exercises alternativeDescription directly (extracted from
    // buildSearchIndex's .map specifically to make this branch testable
    // without mocking getAllAlternatives) — matches this codebase's "omit,
    // don't fabricate" convention.
    expect(alternativeDescription({ product: "X", bestFit: [] })).toBe("");
  });

  it("still describes an alternative that does have bestFit items", () => {
    expect(alternativeDescription({ product: "X", bestFit: ["Teams", "Docs"] })).toBe("Best for: Teams, Docs");
  });
});

describe("searchEntries", () => {
  it("returns nothing for an empty or whitespace-only query", () => {
    const index = [entry()];
    expect(searchEntries(index, "")).toEqual([]);
    expect(searchEntries(index, "   ")).toEqual([]);
  });

  it("ranks an exact title match above a starts-with match above a contains match", () => {
    const exact = entry({ slug: "ai", title: "AI", categories: [] });
    const startsWith = entry({ slug: "ai-tools", title: "AI Tools", categories: [] });
    const contains = entry({ slug: "generative-ai", title: "Generative AI", categories: [] });
    const index = [contains, startsWith, exact];

    expect(searchEntries(index, "AI").map((e) => e.slug)).toEqual(["ai", "ai-tools", "generative-ai"]);
  });

  it("matches case-insensitively", () => {
    const index = [entry({ title: "Ollama" })];
    expect(searchEntries(index, "OLLAMA")).toHaveLength(1);
    expect(searchEntries(index, "ollama")).toHaveLength(1);
  });

  it("matches on category when the title doesn't match", () => {
    const index = [entry({ title: "Ollama", categories: ["ai", "llm"] })];
    expect(searchEntries(index, "llm")).toHaveLength(1);
    expect(searchEntries(index, "database")).toHaveLength(0);
  });

  it("matches on description as the lowest-priority tier", () => {
    const index = [entry({ title: "Ollama", categories: ["ai"], description: "Run large language models locally." })];
    expect(searchEntries(index, "locally")).toHaveLength(1);
  });

  it("ranks a title/category match above a description-only match for a different query", () => {
    const titleMatch = entry({ slug: "a", title: "Local Models", categories: [], description: "Nothing relevant here." });
    const descriptionMatch = entry({ slug: "b", title: "Ollama", categories: [], description: "Run local models on your machine." });
    const index = [descriptionMatch, titleMatch];

    expect(searchEntries(index, "local").map((e) => e.slug)).toEqual(["a", "b"]);
  });

  it("excludes entries that match no field at all", () => {
    const index = [entry({ title: "Ollama", categories: ["ai"], description: "Run large language models locally." })];
    expect(searchEntries(index, "spreadsheet")).toEqual([]);
  });

  it("sorts same-tier results alphabetically by title", () => {
    const b = entry({ slug: "b", title: "Beta Tools" });
    const a = entry({ slug: "a", title: "Alpha Tools" });
    const index = [b, a];
    expect(searchEntries(index, "Tools").map((e) => e.slug)).toEqual(["a", "b"]);
  });

  it("trims surrounding whitespace from the query", () => {
    const index = [entry({ title: "Ollama" })];
    expect(searchEntries(index, "  ollama  ")).toHaveLength(1);
  });
});
