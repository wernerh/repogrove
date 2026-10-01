import { describe, expect, it } from "vitest";
import {
  ContentValidationError,
  assertComparisonReposExist,
  assertGrovesExist,
  assertNoDuplicateComparisonPairs,
  assertNoGithubCollisions,
  extractListItems,
  getAllAlternatives,
  getAllComparisons,
  getAllGroves,
  getAllRepos,
  getAlternative,
  getComparison,
  getComparisonsForRepo,
  getGrove,
  getReposInGrove,
  getRepo,
  parseAlternative,
  parseComparison,
  parseGrove,
  parseRepo,
  slugifyAlternativeName,
  splitOutSection,
  type Comparison,
  type Repo,
} from "@/lib/content";

describe("getAllRepos (real /content fixtures)", () => {
  it("loads every repo content file", () => {
    const repos = getAllRepos();
    const slugs = repos.map((r) => r.slug).sort();
    expect(slugs).toEqual([
      "appwrite",
      "coolify",
      "langchain",
      "lazygit",
      "localai",
      "neovim",
      "ollama",
      "pocketbase",
      "supabase",
      "vllm",
    ]);
  });

  it("parses Ollama's frontmatter correctly", () => {
    const ollama = getRepo("ollama");
    expect(ollama).toBeDefined();
    expect(ollama?.github).toBe("ollama/ollama");
    expect(ollama?.name).toBe("Ollama");
    expect(ollama?.status).toBe("active");
    expect(ollama?.groves).toContain("ai");
    expect(ollama?.alternatives.open_source).toEqual(["localai", "vllm"]);
    // LM Studio is closed-source/proprietary freeware, not an open-source
    // project — it belongs under `commercial` (2026-09-30 content-accuracy fix).
    expect(ollama?.alternatives.commercial).toEqual(["LM Studio"]);
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
  it("loads every example grove", () => {
    const groves = getAllGroves();
    const slugs = groves.map((g) => g.slug).sort();
    expect(slugs).toEqual(["ai", "developer-tools", "self-hosted"]);
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
    expect(reposInAi.map((r) => r.slug).sort()).toEqual(["langchain", "localai", "ollama", "vllm"]);
  });

  it("finds every self-hosted-grove repo under the self-hosted grove", () => {
    const reposInSelfHosted = getReposInGrove("self-hosted");
    expect(reposInSelfHosted.map((r) => r.slug).sort()).toEqual([
      "appwrite",
      "coolify",
      "pocketbase",
      "supabase",
    ]);
  });

  it("finds every developer-tools-grove repo under the developer-tools grove", () => {
    const reposInDevTools = getReposInGrove("developer-tools");
    expect(reposInDevTools.map((r) => r.slug).sort()).toEqual(["lazygit", "neovim"]);
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

  it("throws when a commercial alternative looks like a raw slug instead of a display name", () => {
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
          alternatives: { open_source: [], commercial: ["aws-amplify"] },
        },
      }),
    ).toThrow(/looks like a slug, not a display name/);
  });

  it("accepts commercial alternatives written as proper display names", () => {
    const repo = parseRepo({
      ...base,
      data: {
        github: "acme/fine",
        name: "Fine",
        category: ["ai"],
        license: "MIT",
        status: "active",
        groves: ["ai"],
        alternatives: { open_source: [], commercial: ["Firebase", "AWS Amplify"] },
      },
    });
    expect(repo.alternatives.commercial).toEqual(["Firebase", "AWS Amplify"]);
  });
});

describe("assertSlugIsKebabCase (filename -> slug validation)", () => {
  it("rejects an uppercase letter in a repo filename", () => {
    expect(() =>
      parseRepo({
        filename: "Broken.md",
        body: "Body",
        data: {},
      }),
    ).toThrow(/must be kebab-case/);
  });

  it("rejects an underscore in a Grove filename", () => {
    expect(() => parseGrove({ filename: "self_hosted.md", body: "Body", data: {} })).toThrow(/must be kebab-case/);
  });

  it("rejects a leading hyphen in an alternative filename", () => {
    expect(() => parseAlternative({ filename: "-notion.md", body: "Body", data: {} })).toThrow(/must be kebab-case/);
  });

  it("rejects a doubled hyphen in a comparison filename", () => {
    expect(() => parseComparison({ filename: "ollama--vllm.md", body: "Body", data: {} })).toThrow(
      /must be kebab-case/,
    );
  });

  it("rejects a trailing hyphen", () => {
    expect(() => parseGrove({ filename: "ai-.md", body: "Body", data: {} })).toThrow(/must be kebab-case/);
  });

  it("rejects a space in the filename", () => {
    expect(() => parseGrove({ filename: "self hosted.md", body: "Body", data: {} })).toThrow(/must be kebab-case/);
  });

  it("accepts a normal multi-word kebab-case slug and validates other fields normally", () => {
    expect(() =>
      parseGrove({ filename: "self-hosting-2.md", body: "Body", data: { name: "Self Hosting" } }),
    ).toThrow(/missing required frontmatter field "description"/);
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

describe("getAllComparisons (real /content fixtures)", () => {
  it("loads every real comparison content file", () => {
    const comparisons = getAllComparisons();
    expect(comparisons.map((c) => c.slug).sort()).toEqual([
      "appwrite-vs-pocketbase",
      "appwrite-vs-supabase",
      "ollama-vs-vllm",
      "pocketbase-vs-supabase",
    ]);
  });

  it("parses the ollama-vs-vllm frontmatter and 'How they differ' section", () => {
    const comparison = getComparison("ollama", "vllm");
    expect(comparison).toBeDefined();
    expect(comparison?.repoSlugs).toEqual(["ollama", "vllm"]);
    expect(comparison?.howTheyDiffer).toContain("Ollama is built for running models locally");
  });
});

describe("getComparison (order-independent lookup)", () => {
  it("resolves both URL orders to the same comparison", () => {
    const forward = getComparison("ollama", "vllm");
    const reverse = getComparison("vllm", "ollama");
    expect(forward).toBeDefined();
    // Same content file either way — repoSlugs stays in the file's own
    // canonical order regardless of which order the caller asked in.
    expect(reverse).toEqual(forward);
  });

  it("returns undefined for a pair with no comparison content file", () => {
    expect(getComparison("ollama", "supabase")).toBeUndefined();
  });
});

describe("getComparisonsForRepo", () => {
  it("finds the comparison for a repo named on either side of a pair", () => {
    expect(getComparisonsForRepo("ollama").map((c) => c.slug)).toEqual(["ollama-vs-vllm"]);
    expect(getComparisonsForRepo("vllm").map((c) => c.slug)).toEqual(["ollama-vs-vllm"]);
  });

  it("returns an empty array for a repo with no comparisons", () => {
    // supabase now has two comparisons of its own (appwrite-vs-supabase,
    // pocketbase-vs-supabase) — coolify has none, so it's the real fixture
    // for this "no comparisons at all" case.
    expect(getComparisonsForRepo("coolify")).toEqual([]);
  });

  it("sorts multiple comparisons for the same repo by the other repo's name", () => {
    // supabase is compared against both appwrite and pocketbase — the page
    // (src/app/repo/[slug]/page.tsx) sorts these by the other repo's name
    // for a stable render order, not file-listing order; this locks in the
    // data getComparisonsForRepo itself returns (order-independent here —
    // the page does its own localeCompare sort on top).
    const slugs = getComparisonsForRepo("supabase")
      .map((c) => c.slug)
      .sort();
    expect(slugs).toEqual(["appwrite-vs-supabase", "pocketbase-vs-supabase"]);
  });
});

describe("parseComparison — malformed content fails loudly", () => {
  const validBody = "## How they differ\nThey differ in a couple of meaningful ways.";

  it("throws when 'repos' is missing", () => {
    expect(() =>
      parseComparison({ filename: "broken.md", body: validBody, data: {} }),
    ).toThrow(ContentValidationError);
  });

  it("throws when 'repos' has only one entry", () => {
    expect(() =>
      parseComparison({
        filename: "broken.md",
        body: validBody,
        data: { repos: ["ollama"] },
      }),
    ).toThrow(/expected exactly 2/);
  });

  it("throws when 'repos' has three entries", () => {
    expect(() =>
      parseComparison({
        filename: "broken.md",
        body: validBody,
        data: { repos: ["ollama", "vllm", "supabase"] },
      }),
    ).toThrow(/expected exactly 2/);
  });

  it("throws when a repo is compared against itself", () => {
    expect(() =>
      parseComparison({
        filename: "self.md",
        body: validBody,
        data: { repos: ["ollama", "ollama"] },
      }),
    ).toThrow(/compares "ollama" against itself/);
  });

  it("throws when 'How they differ' is missing", () => {
    expect(() =>
      parseComparison({
        filename: "no-diff.md",
        body: "## Some other heading\nirrelevant",
        data: { repos: ["ollama", "vllm"] },
      }),
    ).toThrow(/missing a non-empty "## How they differ" section/);
  });

  it("throws when 'How they differ' has a heading but no content beneath it", () => {
    expect(() =>
      parseComparison({
        filename: "empty-diff.md",
        body: "## How they differ\n\n## Some other heading\ntext",
        data: { repos: ["ollama", "vllm"] },
      }),
    ).toThrow(/missing a non-empty "## How they differ" section/);
  });

  it("parses a valid file, preserving the frontmatter's repo order", () => {
    const comparison = parseComparison({
      filename: "vllm-vs-ollama.md",
      body: validBody,
      data: { repos: ["vllm", "ollama"] },
    });
    expect(comparison.repoSlugs).toEqual(["vllm", "ollama"]);
    expect(comparison.howTheyDiffer).toBe("They differ in a couple of meaningful ways.");
  });
});

describe("assertComparisonReposExist", () => {
  const repos = getAllRepos();

  it("does not throw when every comparison names two real repo slugs", () => {
    expect(() => assertComparisonReposExist(getAllComparisons(), repos)).not.toThrow();
  });

  it("throws when a comparison names a repo slug with no content/repos/*.md file", () => {
    const fake: Comparison = {
      slug: "ollama-vs-ghost",
      repoSlugs: ["ollama", "does-not-exist"],
      howTheyDiffer: "n/a",
    };
    expect(() => assertComparisonReposExist([fake], repos)).toThrow(
      /names "does-not-exist" under "repos", but no content\/repos\/does-not-exist\.md exists/,
    );
  });
});

describe("assertGrovesExist", () => {
  const groves = getAllGroves();

  it("does not throw when every repo's groves field names a real Grove slug", () => {
    expect(() => assertGrovesExist(getAllRepos(), groves)).not.toThrow();
  });

  it("throws when a repo names a Grove slug with no content/groves/*.md file", () => {
    const fake: Repo = {
      slug: "ghost-repo",
      github: "ghost/ghost-repo",
      name: "Ghost",
      category: ["misc"],
      license: "MIT",
      status: "active",
      featured: false,
      groves: ["does-not-exist"],
      alternatives: { open_source: [], commercial: [] },
      body: "n/a",
    };
    expect(() => assertGrovesExist([fake], groves)).toThrow(
      /lists "does-not-exist" under "groves", but no content\/groves\/does-not-exist\.md exists/,
    );
  });
});

describe("assertNoDuplicateComparisonPairs", () => {
  it("does not throw for the real comparison fixtures", () => {
    expect(() => assertNoDuplicateComparisonPairs(getAllComparisons())).not.toThrow();
  });

  it("throws when two files compare the same unordered pair", () => {
    const a: Comparison = { slug: "ollama-vs-vllm", repoSlugs: ["ollama", "vllm"], howTheyDiffer: "x" };
    const b: Comparison = { slug: "vllm-vs-ollama", repoSlugs: ["vllm", "ollama"], howTheyDiffer: "y" };
    expect(() => assertNoDuplicateComparisonPairs([a, b])).toThrow(
      /both compare the same pair of repos/,
    );
  });
});

describe("extractListItems reused on a Repo body's Pros/Cons sections", () => {
  it("extracts Ollama's real Pros/Cons bullet lists from its content body", () => {
    const ollama = getRepo("ollama")!;
    const pros = extractListItems(ollama.body, "Pros");
    const cons = extractListItems(ollama.body, "Cons");
    expect(pros.length).toBeGreaterThan(0);
    expect(cons.length).toBeGreaterThan(0);
  });
});
