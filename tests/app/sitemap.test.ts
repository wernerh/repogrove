import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { getAllAlternatives, getAllComparisons, getAllGroves, getAllRepos } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

describe("sitemap (issue #64 — real /content fixtures)", () => {
  it("includes every real repo slug from /content/repos", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const repo of getAllRepos()) {
      expect(urls).toContain(`${SITE_URL}/repo/${repo.slug}`);
    }
    // Guards against a future content file silently not showing up (the
    // acceptance criterion this test exists for) rather than just checking
    // a hardcoded subset.
    expect(getAllRepos().length).toBeGreaterThan(0);
  });

  it("includes every real Grove slug from /content/groves", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const grove of getAllGroves()) {
      expect(urls).toContain(`${SITE_URL}/grove/${grove.slug}`);
    }
    expect(getAllGroves().length).toBeGreaterThan(0);
  });

  it("includes every real alternative slug from /content/alternatives", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const alternative of getAllAlternatives()) {
      expect(urls).toContain(`${SITE_URL}/alternative/${alternative.slug}`);
    }
    expect(getAllAlternatives().length).toBeGreaterThan(0);
  });

  it("includes every real comparison, in its file's canonical repo order", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const comparison of getAllComparisons()) {
      expect(urls).toContain(
        `${SITE_URL}/compare/${comparison.repoSlugs[0]}/${comparison.repoSlugs[1]}`,
      );
    }
    expect(getAllComparisons().length).toBeGreaterThan(0);
  });

  it("does not list the reversed comparison URL alongside the canonical one", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const comparison of getAllComparisons()) {
      expect(urls).not.toContain(
        `${SITE_URL}/compare/${comparison.repoSlugs[1]}/${comparison.repoSlugs[0]}`,
      );
    }
  });

  it("includes the static top-level routes", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain(SITE_URL);
    expect(urls).toContain(`${SITE_URL}/trending`);
    expect(urls).toContain(`${SITE_URL}/rising`);
  });

  it("every entry is an absolute https URL under SITE_URL with no duplicates", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const url of urls) {
      expect(url.startsWith(SITE_URL)).toBe(true);
    }
    expect(new Set(urls).size).toBe(urls.length);
  });
});
