import { describe, expect, it } from "vitest";
import {
  ContentValidationError,
  assertNoGithubCollisions,
  getAllAlternatives,
  getAllGroves,
  getAllRepos,
  getAlternative,
  getGrove,
  getReposInGrove,
  getRepo,
  parseAlternative,
  parseGrove,
  parseRepo,
  slugifyAlternativeName,
  splitOutSection,
  type Repo,
} from "@/lib/content";

describe("getAllRepos (real /content fixtures)", () => {
  it("loads every repo content file", () => {
    const repos = getAllRepos();
    const slugs = repos.map((r) => r.slug).sort();
    expect(slugs).toEqual(["coolify", "langchain", "ollama", "supabase", "vllm"]);
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
  it("finds every AI-grove repo under the AI grove via its groves: frontmatter field", () => {
    const reposInAi = getReposInGrove("ai");
    expect(reposInAi.map((r) => r.slug).sort()).toEqual(["langchain", "ollama", "vllm"]);
  });

  it("finds every self-hosted-grove repo under the self-hosted grove", () => {
    const reposInSelfHosted = getReposInGrove("self-hosted");
    expect(reposInSelfHosted.map((r) => r.slug).sort()).toEqual(["coolify", "supabase"]);
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

  it("throws when a repo lists itself as its own open-source alternative", () => {
    expect(() =>
      parseRepo({
        filename: "self-ref.md",
        body: "Body text",
        data: {
          github: "acme/self-ref",
          name: "Self Ref",
          category: ["ai"],
          license: "MIT",
          status: "active",
          groves: ["ai"],
          alternatives: { open_source: ["self-ref"], commercial: [] },
        },
      }),
    ).toThrow(/lists itself/);
  });

  it("throws when the same slug appears twice under alternatives.open_source", () => {
    expect(() =>
      parseRepo({
        ...base,
        data: {
          github: "acme/broken",
          name: "Broken",
          category: ["ai"],
          license: "MIT",
          status: "active",
          groves: ["ai"],
          alternatives: { open_source: ["dupe", "dupe"], commercial: [] },
        },
      }),
    ).toThrow(/more than once under "alternatives.open_source"/);
  });

  it("throws when the same name appears twice under alternatives.commercial", () => {
    expect(() =>
      parseRepo({
        ...base,
        data: {
          github: "acme/broken",
          name: "Broken",
          category: ["ai"],
          license: "MIT",
          status: "active",
          groves: ["ai"],
          alternatives: { open_source: [], commercial: ["Firebase", "Firebase"] },
        },
      }),
    ).toThrow(/more than once under "alternatives.commercial"/);
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

describe("splitOutSection", () => {
  const body = [
    "Intro paragraph.",
    "",
    "## What it does",
    "Explanation.",
    "",
    "## Alternatives",
    "LM Studio, LocalAI (placeholder prose).",
    "",
    "## Related Grove",
    "[AI](/grove/ai)",
  ].join("\n");

  it("removes the named section and everything up to the next ## heading", () => {
    const { before, after } = splitOutSection(body, "Alternatives");
    expect(before).toContain("## What it does");
    expect(before).not.toContain("Alternatives");
    expect(after).toContain("## Related Grove");
    expect(after).not.toContain("LM Studio");
  });

  it("matches the heading case-insensitively", () => {
    const { before } = splitOutSection(body, "alternatives");
    expect(before).not.toContain("LM Studio");
  });

  it("removes a trailing section down to the end of the body with no after-content", () => {
    const { before, after } = splitOutSection(body, "Related Grove");
    expect(before).toContain("## Alternatives");
    expect(after).toBe("");
  });

  it("returns the body unchanged (and an empty after) when the heading isn't present", () => {
    const { before, after } = splitOutSection(body, "Pricing");
    expect(before).toBe(body);
    expect(after).toBe("");
  });

  it("matches ollama.md's real body: strips its Alternatives placeholder, keeps Related Grove", () => {
    const ollama = getRepo("ollama");
    const { before, after } = splitOutSection(ollama!.body, "Alternatives");
    expect(before).toContain("## What it does");
    expect(before).not.toContain("placeholder links");
    expect(after).toContain("## Related Grove");
  });
});

describe("getAllAlternatives (real /content fixtures)", () => {
  it("loads every alternatives content file", () => {
    const alternatives = getAllAlternatives();
    expect(alternatives.map((a) => a.slug).sort()).toEqual(["notion"]);
  });

  it("parses Notion's frontmatter and body sections correctly", () => {
    const notion = getAlternative("notion");
    expect(notion).toBeDefined();
    expect(notion?.product).toBe("Notion");
    expect(notion?.category).toBe("knowledge-management");
    expect(notion?.openSource).toEqual(["AppFlowy", "Outline", "AFFiNE", "Anytype"]);
    expect(notion?.bestFit).toContain("Personal knowledge management");
  });

  it("returns undefined for an alternative that doesn't exist", () => {
    expect(getAlternative("does-not-exist")).toBeUndefined();
  });
});

describe("parseAlternative — malformed content fails loudly", () => {
  const validBody = [
    "## Open source",
    "- AppFlowy",
    "",
    "## Free",
    "- Craft",
    "",
    "## Commercial",
    "- Confluence",
    "",
    "## Best fit",
    "- Team documentation",
  ].join("\n");

  it("throws when product is missing", () => {
    expect(() =>
      parseAlternative({
        filename: "broken.md",
        body: validBody,
        data: { category: "productivity" },
      }),
    ).toThrow(ContentValidationError);
  });

  it("names the missing field and the file in the error message", () => {
    expect(() =>
      parseAlternative({
        filename: "broken.md",
        body: validBody,
        data: { category: "productivity" },
      }),
    ).toThrow(/content\/alternatives\/broken\.md.*"product"/);
  });

  it("throws when category is missing", () => {
    expect(() =>
      parseAlternative({
        filename: "broken.md",
        body: validBody,
        data: { product: "Broken" },
      }),
    ).toThrow(ContentValidationError);
  });

  it("throws when every section (open source, free, commercial) is empty", () => {
    expect(() =>
      parseAlternative({
        filename: "empty.md",
        body: "## Best fit\n- Something",
        data: { product: "Empty", category: "productivity" },
      }),
    ).toThrow(/must list at least one alternative/);
  });

  it("throws when the same item appears twice under the same section", () => {
    expect(() =>
      parseAlternative({
        filename: "dupe.md",
        body: "## Open source\n- AppFlowy\n- AppFlowy",
        data: { product: "Dupe", category: "productivity" },
      }),
    ).toThrow(/more than once under "Open source"/);
  });

  it("throws when the same item appears twice under Best fit", () => {
    expect(() =>
      parseAlternative({
        filename: "dupe-best-fit.md",
        body: "## Open source\n- AppFlowy\n\n## Best fit\n- Team wikis\n- Team wikis",
        data: { product: "Dupe", category: "productivity" },
      }),
    ).toThrow(/more than once under "Best fit"/);
  });

  it("treats a missing section as an empty list rather than throwing", () => {
    const alt = parseAlternative({
      filename: "minimal.md",
      body: "## Open source\n- Solo Item",
      data: { product: "Minimal", category: "productivity" },
    });
    expect(alt.free).toEqual([]);
    expect(alt.commercial).toEqual([]);
    expect(alt.bestFit).toEqual([]);
  });

  it("treats a placeholder line with no bullet items as an empty list", () => {
    const alt = parseAlternative({
      filename: "placeholder.md",
      body: "## Open source\n- Solo Item\n\n## Free\n_(to be filled in)_",
      data: { product: "Placeholder", category: "productivity" },
    });
    expect(alt.free).toEqual([]);
  });
});

describe("slugifyAlternativeName", () => {
  it("lowercases and hyphenates a display name into a candidate repo slug", () => {
    expect(slugifyAlternativeName("AppFlowy")).toBe("appflowy");
    expect(slugifyAlternativeName("LM Studio")).toBe("lm-studio");
  });
});
