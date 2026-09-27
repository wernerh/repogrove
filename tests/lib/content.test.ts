import { describe, expect, it } from "vitest";
import {
  ContentValidationError,
  assertNoGithubCollisions,
  getAllGroves,
  getAllRepos,
  getGrove,
  getReposInGrove,
  getRepo,
  parseGrove,
  parseRepo,
  type Repo,
} from "@/lib/content";

describe("getAllRepos (real /content fixtures)", () => {
  it("loads both example repos", () => {
    const repos = getAllRepos();
    const slugs = repos.map((r) => r.slug).sort();
    expect(slugs).toEqual(["ollama", "supabase"]);
  });

  it("parses Ollama's frontmatter correctly", () => {
    const ollama = getRepo("ollama");
    expect(ollama).toBeDefined();
    expect(ollama?.github).toBe("ollama/ollama");
    expect(ollama?.name).toBe("Ollama");
    expect(ollama?.status).toBe("active");
    expect(ollama?.groves).toContain("ai");
    expect(ollama?.alternatives.open_source).toEqual(["lm-studio", "localai", "vllm"]);
  });

  it("returns undefined for a repo that doesn't exist", () => {
    expect(getRepo("does-not-exist")).toBeUndefined();
  });

  it("strips the redundant leading '# Name' heading from the body", () => {
    const ollama = getRepo("ollama");
    expect(ollama?.body.startsWith("# Ollama")).toBe(false);
    expect(ollama?.body).toContain("## What it does");
  });
});

describe("getAllGroves (real /content fixtures)", () => {
  it("loads both example groves", () => {
    const groves = getAllGroves();
    const slugs = groves.map((g) => g.slug).sort();
    expect(slugs).toEqual(["ai", "self-hosted"]);
  });

  it("parses the AI grove's frontmatter correctly", () => {
    const ai = getGrove("ai");
    expect(ai?.name).toBe("AI");
    expect(ai?.relatedGroves).toEqual(["developer-tools", "self-hosted"]);
  });
});

describe("getReposInGrove (derived from repo frontmatter, per ADR-003)", () => {
  it("finds Ollama under the AI grove via its groves: frontmatter field", () => {
    const reposInAi = getReposInGrove("ai");
    expect(reposInAi.map((r) => r.slug)).toEqual(["ollama"]);
  });

  it("finds Supabase under the self-hosted grove", () => {
    const reposInSelfHosted = getReposInGrove("self-hosted");
    expect(reposInSelfHosted.map((r) => r.slug)).toEqual(["supabase"]);
  });

  it("returns an empty array for a grove with no member repos", () => {
    expect(getReposInGrove("nonexistent-grove")).toEqual([]);
  });
});

describe("parseRepo — malformed frontmatter fails loudly", () => {
  const base = { filename: "broken.md", body: "Body text" };

  it("throws when a required field is missing", () => {
    expect(() =>
      parseRepo({
        ...base,
        data: {
          // github is missing
          name: "Broken",
          category: ["ai"],
          license: "MIT",
          status: "active",
          groves: ["ai"],
        },
      }),
    ).toThrow(ContentValidationError);
  });

  it("names the missing field and the file in the error message", () => {
    expect(() =>
      parseRepo({
        ...base,
        data: {
          name: "Broken",
          category: ["ai"],
          license: "MIT",
          status: "active",
          groves: ["ai"],
        },
      }),
    ).toThrow(/content\/repos\/broken\.md.*"github"/);
  });

  it("throws when status isn't one of the allowed values", () => {
    expect(() =>
      parseRepo({
        ...base,
        data: {
          github: "acme/broken",
          name: "Broken",
          category: ["ai"],
          license: "MIT",
          status: "definitely-not-a-status",
          groves: ["ai"],
        },
      }),
    ).toThrow(ContentValidationError);
  });

  it("defaults featured to false and alternatives to empty arrays when absent", () => {
    const repo = parseRepo({
      ...base,
      data: {
        github: "acme/minimal",
        name: "Minimal",
        category: ["ai"],
        license: "MIT",
        status: "active",
        groves: ["ai"],
      },
    });
    expect(repo.featured).toBe(false);
    expect(repo.alternatives).toEqual({ open_source: [], commercial: [] });
  });
});

describe("parseGrove — malformed frontmatter fails loudly", () => {
  it("throws when description is missing", () => {
    expect(() =>
      parseGrove({
        filename: "broken.md",
        body: "Body",
        data: { name: "Broken" },
      }),
    ).toThrow(ContentValidationError);
  });
});

describe("assertNoGithubCollisions", () => {
  const makeRepo = (slug: string, github: string): Repo => ({
    slug,
    github,
    name: slug,
    category: [],
    license: "MIT",
    status: "active",
    featured: false,
    groves: [],
    alternatives: { open_source: [], commercial: [] },
    body: "",
  });

  it("passes when every github field is unique", () => {
    expect(() =>
      assertNoGithubCollisions([makeRepo("a", "org/a"), makeRepo("b", "org/b")]),
    ).not.toThrow();
  });

  it("throws when two content files declare the same github repo", () => {
    expect(() =>
      assertNoGithubCollisions([makeRepo("a", "org/dup"), makeRepo("b", "org/dup")]),
    ).toThrow(ContentValidationError);
  });
});
