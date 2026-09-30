import { describe, expect, it } from "vitest";
// Imports directly from search-match, not @/lib/search — the same path
// SearchBox.tsx (Client Component) must use, so this test file exercises
// the module in isolation from content.ts/node:fs, matching the split
// ADR-008/search-match.ts's doc comment describes.
import { searchEntries, type SearchEntry } from "@/lib/search-match";

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
