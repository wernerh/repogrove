import { describe, expect, it } from "vitest";
import { alternativeDescription, buildSearchIndex } from "@/lib/search";
import { getAllAlternatives, getAllGroves, getAllRepos } from "@/lib/content";

// Pure ranking-logic tests (searchEntries, SearchEntry) live in
// tests/lib/search-match.test.ts, importing directly from
// @/lib/search-match — this file covers buildSearchIndex/
// alternativeDescription specifically, which need real /content fixtures
// (via content.ts/node:fs) and so stay server-only, same split as the
// source modules themselves (see search.ts/search-match.ts doc comments).

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
