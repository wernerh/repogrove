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
      "clickhouse",
      "coolify",
      "dokploy",
      "duckdb",
      "gitui",
      "helix",
      "langchain",
      "lazygit",
      "llamaindex",
      "localai",
      "neovim",
      "ollama",
      "pocketbase",
      "postgresql",
      "sqlite",
      "supabase",
      "tig",
      "vim",
      "vllm",
      "zed",
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

  it("parses DuckDB's frontmatter correctly", () => {
    const duckdb = getRepo("duckdb");
    expect(duckdb).toBeDefined();
    expect(duckdb?.github).toBe("duckdb/duckdb");
    expect(duckdb?.name).toBe("DuckDB");
    expect(duckdb?.license).toBe("MIT");
    expect(duckdb?.status).toBe("active");
    expect(duckdb?.groves).toEqual(["databases"]);
    // PostgreSQL added as a mutual alternative this run, completing the
    // Databases grove's fully mutual quartet alongside ClickHouse and SQLite.
    expect(duckdb?.alternatives.open_source).toEqual(["clickhouse", "sqlite", "postgresql"]);
    expect(duckdb?.alternatives.commercial).toEqual([]);
  });

  it("parses ClickHouse's frontmatter correctly", () => {
    const clickhouse = getRepo("clickhouse");
    expect(clickhouse).toBeDefined();
    expect(clickhouse?.github).toBe("ClickHouse/ClickHouse");
    expect(clickhouse?.name).toBe("ClickHouse");
    expect(clickhouse?.license).toBe("Apache-2.0");
    expect(clickhouse?.status).toBe("active");
    expect(clickhouse?.groves).toEqual(["databases"]);
    // SQLite and PostgreSQL added as mutual alternatives this run, completing
    // the Databases grove's fully mutual quartet alongside DuckDB.
    expect(clickhouse?.alternatives.open_source).toEqual(["duckdb", "sqlite", "postgresql"]);
    expect(clickhouse?.alternatives.commercial).toEqual([]);
  });

  it("parses SQLite's frontmatter correctly", () => {
    const sqlite = getRepo("sqlite");
    expect(sqlite).toBeDefined();
    expect(sqlite?.github).toBe("sqlite/sqlite");
    expect(sqlite?.name).toBe("SQLite");
    expect(sqlite?.license).toBe("Public Domain");
    expect(sqlite?.status).toBe("active");
    expect(sqlite?.groves).toEqual(["databases"]);
    // ClickHouse added as a mutual alternative this run, completing the
    // Databases grove's fully mutual quartet alongside DuckDB and PostgreSQL.
    expect(sqlite?.alternatives.open_source).toEqual(["duckdb", "postgresql", "clickhouse"]);
    expect(sqlite?.alternatives.commercial).toEqual([]);
  });

  it("parses PostgreSQL's frontmatter correctly", () => {
    const postgresql = getRepo("postgresql");
    expect(postgresql).toBeDefined();
    expect(postgresql?.github).toBe("postgres/postgres");
    expect(postgresql?.name).toBe("PostgreSQL");
    expect(postgresql?.license).toBe("PostgreSQL License");
    expect(postgresql?.status).toBe("active");
    expect(postgresql?.groves).toEqual(["databases"]);
    // DuckDB and ClickHouse added as mutual alternatives this run, completing
    // the Databases grove's fully mutual quartet alongside SQLite.
    expect(postgresql?.alternatives.open_source).toEqual(["sqlite", "duckdb", "clickhouse"]);
    expect(postgresql?.alternatives.commercial).toEqual([]);
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
    expect(slugs).toEqual(["ai", "databases", "developer-tools", "self-hosted"]);
  });

  it("parses the AI grove's frontmatter correctly", () => {
    const ai = getGrove("ai");
    expect(ai?.name).toBe("AI");
    expect(ai?.relatedGroves).toEqual(["developer-tools", "self-hosted", "databases"]);
  });
});

describe("getReposInGrove (derived from repo frontmatter, per ADR-003)", () => {
  it("finds every AI-grove repo under the AI grove via its groves: frontmatter field", () => {
    const reposInAi = getReposInGrove("ai");
    expect(reposInAi.map((r) => r.slug).sort()).toEqual([
      "langchain",
      "llamaindex",
      "localai",
      "ollama",
      "vllm",
    ]);
  });

  it("finds every self-hosted-grove repo under the self-hosted grove", () => {
    const reposInSelfHosted = getReposInGrove("self-hosted");
    expect(reposInSelfHosted.map((r) => r.slug).sort()).toEqual([
      "appwrite",
      "coolify",
      "dokploy",
      "pocketbase",
      "supabase",
    ]);
  });

  it("finds every developer-tools-grove repo under the developer-tools grove", () => {
    const reposInDevTools = getReposInGrove("developer-tools");
    expect(reposInDevTools.map((r) => r.slug).sort()).toEqual([
      "gitui",
      "helix",
      "lazygit",
      "neovim",
      "tig",
      "vim",
      "zed",
    ]);
  });

  it("finds every databases-grove repo under the databases grove", () => {
    const reposInDatabases = getReposInGrove("databases");
    expect(reposInDatabases.map((r) => r.slug).sort()).toEqual([
      "clickhouse",
      "duckdb",
      "postgresql",
      "sqlite",
    ]);
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
    expect(alternatives.map((a) => a.slug).sort()).toEqual([
      "aws-amplify",
      "firebase",
      "gitkraken",
      "heroku",
      "lm-studio",
      "netlify",
      "notion",
      "sourcetree",
      "vercel",
    ]);
  });

  it("parses AWS Amplify's frontmatter and body sections correctly", () => {
    const awsAmplify = getAlternative("aws-amplify");
    expect(awsAmplify).toBeDefined();
    expect(awsAmplify?.product).toBe("AWS Amplify");
    expect(awsAmplify?.category).toBe("backend-as-a-service");
    expect(awsAmplify?.openSource).toEqual(["Appwrite", "Supabase", "PocketBase"]);
    expect(awsAmplify?.commercial).toEqual(["Firebase"]);
    // Full-array assertion (not just `toContain`) so a bullet that wraps
    // across source lines — which `extractListItems` silently truncates at
    // the first line lacking its own "- " marker — would fail here instead
    // of shipping a truncated sentence to the live page (same lesson as
    // gitkraken.md/sourcetree.md's and vercel.md's tests above).
    expect(awsAmplify?.bestFit).toEqual([
      "Avoiding AWS lock-in and per-service AWS billing — Amplify is a managed front door onto Cognito (auth), AppSync/Lambda (API and functions), and S3 (storage), so its data model and operational quirks are AWS's, not a single portable backend, while Appwrite, Supabase, and PocketBase can all run on any server you choose",
      "Predictable costs instead of open-ended usage billing — Amplify's 12-month free tier (1,000 build minutes, 15 GB data served, 5 GB storage, 500,000 requests) has no pause once exceeded, it just starts billing pay-as-you-go per build minute, GB served, and request, whereas a self-hosted Appwrite, Supabase, or PocketBase instance only costs whatever server it runs on",
      "A single, already-integrated backend instead of assembling AWS primitives yourself — Appwrite and Supabase bundle auth, database, storage, and functions behind one API out of the box, closer to Amplify's pitch than to wiring up Cognito, AppSync, and S3 individually, without requiring an AWS account to get started",
      "A single-binary, minimal-ops deployment for a small app — PocketBase needs no AWS account, IAM setup, or per-service configuration at all",
    ]);
  });

  it("parses Notion's frontmatter and body sections correctly", () => {
    const notion = getAlternative("notion");
    expect(notion).toBeDefined();
    expect(notion?.product).toBe("Notion");
    expect(notion?.category).toBe("knowledge-management");
    expect(notion?.openSource).toEqual(["AppFlowy", "Outline", "AFFiNE", "Anytype"]);
    expect(notion?.bestFit).toContain("Personal knowledge management");
  });

  it("parses GitKraken's frontmatter and body sections correctly", () => {
    const gitkraken = getAlternative("gitkraken");
    expect(gitkraken).toBeDefined();
    expect(gitkraken?.product).toBe("GitKraken");
    expect(gitkraken?.category).toBe("git-gui-client");
    expect(gitkraken?.openSource).toEqual(["GitUI", "LazyGit", "Tig"]);
    expect(gitkraken?.free).toEqual(["Sourcetree"]);
    // Full-array assertion (not just `toContain`) so a bullet that wraps
    // across source lines — which `extractListItems` silently truncates at
    // the first line lacking its own "- " marker, since it only tests each
    // line's own trimmed text — would fail here instead of shipping a
    // truncated sentence to the live page.
    expect(gitkraken?.bestFit).toEqual([
      "A terminal-first, keyboard-driven workflow with no GUI/Electron overhead (GitUI, LazyGit, Tig)",
      "Free private-repo access without a paid plan — GitKraken's free Community tier covers public repositories only, so a private repo needs a Pro-or-higher plan, while Sourcetree is free for private repos too, with no seat limit",
      "Mercurial support alongside Git, not just Git (Sourcetree)",
    ]);
  });

  it("parses Sourcetree's frontmatter and body sections correctly", () => {
    const sourcetree = getAlternative("sourcetree");
    expect(sourcetree).toBeDefined();
    expect(sourcetree?.product).toBe("Sourcetree");
    expect(sourcetree?.category).toBe("git-gui-client");
    expect(sourcetree?.openSource).toEqual(["GitUI", "LazyGit", "Tig"]);
    expect(sourcetree?.commercial).toEqual(["GitKraken"]);
    // Same full-array check as GitKraken's test above, for the same reason.
    expect(sourcetree?.bestFit).toEqual([
      "A terminal-first, keyboard-driven workflow with no GUI overhead (GitUI, LazyGit, Tig)",
      "Advanced visual tooling on a paid plan — interactive rebase with drag-and-drop, built-in AI assistance, and PR/code-review management across hosting providers (GitKraken)",
      "Linux support — Sourcetree only ships Mac and Windows builds, while GitKraken also builds for Linux",
    ]);
  });

  it("parses Vercel's frontmatter and body sections correctly", () => {
    const vercel = getAlternative("vercel");
    expect(vercel).toBeDefined();
    expect(vercel?.product).toBe("Vercel");
    expect(vercel?.category).toBe("paas");
    expect(vercel?.openSource).toEqual(["Coolify", "Dokploy"]);
    expect(vercel?.commercial).toEqual(["Heroku", "Netlify"]);
    // Full-array assertion (not just `toContain`) so a bullet that wraps
    // across source lines — which `extractListItems` silently truncates at
    // the first line lacking its own "- " marker — would fail here instead
    // of shipping a truncated sentence to the live page (same lesson as
    // gitkraken.md/sourcetree.md's tests above).
    expect(vercel?.bestFit).toEqual([
      "Running a commercial or for-profit app for free — Vercel's free Hobby plan is contractually restricted to personal, non-commercial use under its own Terms of Service, while Coolify and Dokploy cost only whatever server you already run them on, commercial or not",
      "Hosting more than a frontend and its serverless functions — Vercel is built around front-end frameworks and its own Functions runtime, while Coolify and Dokploy also provision and manage backend services and databases (MySQL, PostgreSQL, MongoDB, MariaDB, Redis via Dokploy) on the same platform",
      "Avoiding a usage ceiling that pauses your deployments — Vercel's own docs say Hobby plans are paused once they exceed the included free-tier usage, while a self-hosted Coolify or Dokploy instance keeps running on whatever capacity its own server has",
    ]);
  });

  it("parses Heroku's frontmatter and body sections correctly", () => {
    const heroku = getAlternative("heroku");
    expect(heroku).toBeDefined();
    expect(heroku?.product).toBe("Heroku");
    expect(heroku?.category).toBe("paas");
    expect(heroku?.openSource).toEqual(["Coolify", "Dokploy"]);
    expect(heroku?.commercial).toEqual(["Vercel", "Netlify"]);
    expect(heroku?.bestFit).toEqual([
      "Avoiding a monthly bill just to keep an app running — Heroku removed its free dyno, Postgres, and Key-Value Store plans in November 2022, so even a minimal app now costs at least a few dollars a month (usage-based Eco dynos, $5/month Mini Postgres, $3/month Mini Key-Value Store); Coolify and Dokploy cost only whatever server you already run them on",
      "Keeping Heroku's own \"push to Git, get a build and a running service\" workflow without paying Heroku for it — both still build on the buildpack-driven deploy model Heroku popularized (Dokploy deploys via Heroku-style buildpacks directly; Coolify offers the same Git-push experience)",
      "Self-managed backing services instead of Heroku's paid add-ons — Dokploy provisions and backs up MySQL, PostgreSQL, MongoDB, MariaDB, and Redis itself, on the same servers as your app",
    ]);
  });

  it("parses Netlify's frontmatter and body sections correctly", () => {
    const netlify = getAlternative("netlify");
    expect(netlify).toBeDefined();
    expect(netlify?.product).toBe("Netlify");
    expect(netlify?.category).toBe("paas");
    expect(netlify?.openSource).toEqual(["Coolify", "Dokploy"]);
    expect(netlify?.commercial).toEqual(["Vercel", "Heroku"]);
    expect(netlify?.bestFit).toEqual([
      "Running backend services and databases alongside your app, not just a frontend and its functions — Netlify's free plan is scoped to 125,000 function invocations and 1 million edge function invocations a month, while Coolify and Dokploy run arbitrary backend services and provision databases (MySQL, PostgreSQL, MongoDB, MariaDB, Redis via Dokploy) on hardware you control, with no invocation ceiling",
      "Avoiding a monthly allowance that suspends your site — Netlify's own announcement of its free plan says a site suspends for the rest of the calendar month once its usage allowance (100 GB bandwidth, 300 build minutes) is exceeded, while a self-hosted Coolify or Dokploy instance keeps running on whatever capacity its own server has",
      "Building without a per-minute build-time budget — Netlify's free plan includes 300 build minutes a month, while Coolify and Dokploy build on your own server with no per-minute metering",
    ]);
  });

  it("parses LM Studio's frontmatter and body sections correctly", () => {
    const lmStudio = getAlternative("lm-studio");
    expect(lmStudio).toBeDefined();
    expect(lmStudio?.product).toBe("LM Studio");
    expect(lmStudio?.category).toBe("local-llm-chat");
    expect(lmStudio?.openSource).toEqual(["Ollama", "LocalAI", "vLLM"]);
    // Full-array assertion (not just `toContain`) so a bullet that wraps
    // across source lines — which `extractListItems` silently truncates at
    // the first line lacking its own "- " marker — would fail here instead
    // of shipping a truncated sentence to the live page (same lesson as
    // gitkraken.md/sourcetree.md's and vercel.md's tests above).
    expect(lmStudio?.bestFit).toEqual([
      "Full source-code auditability and self-hosting with nothing proprietary to trust — LM Studio is free to use, including commercially, but closed source with no public code access, while Ollama, LocalAI, and vLLM are open source end to end",
      "A CLI/API-first workflow instead of LM Studio's bundled point-and-click GUI — Ollama's simple local API has a growing ecosystem of third-party interfaces that now speak it directly, without requiring LM Studio's own desktop app",
      "Model coverage beyond text chat behind one OpenAI-compatible server — LocalAI adds speech-to-text, image, and video generation on top of chat, rather than LM Studio's chat-and-completions-focused interface",
      "Production-scale serving for many concurrent users instead of a single local chat session — vLLM's continuous batching and tensor parallelism are built for serving at scale, not LM Studio's single-user desktop use case",
    ]);
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
      "clickhouse-vs-duckdb",
      "clickhouse-vs-postgresql",
      "clickhouse-vs-sqlite",
      "coolify-vs-dokploy",
      "duckdb-vs-postgresql",
      "duckdb-vs-sqlite",
      "gitui-vs-lazygit",
      "gitui-vs-tig",
      "helix-vs-neovim",
      "helix-vs-vim",
      "helix-vs-zed",
      "langchain-vs-llamaindex",
      "lazygit-vs-tig",
      "localai-vs-ollama",
      "localai-vs-vllm",
      "neovim-vs-vim",
      "neovim-vs-zed",
      "ollama-vs-vllm",
      "pocketbase-vs-supabase",
      "postgresql-vs-sqlite",
      "vim-vs-zed",
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
    // coolify-vs-dokploy is the real single-comparison fixture now (ollama
    // and vllm each gained a second comparison this run — see the
    // fully-mutual-trio test below for those).
    expect(getComparisonsForRepo("coolify").map((c) => c.slug)).toEqual(["coolify-vs-dokploy"]);
    expect(getComparisonsForRepo("dokploy").map((c) => c.slug)).toEqual(["coolify-vs-dokploy"]);
  });

  it("returns an empty array for a repo with no comparisons", () => {
    // Every real repo now has at least one comparison content file (langchain
    // and llamaindex, the last pair without one, gained langchain-vs-llamaindex
    // this run), so there's no remaining real-repo fixture for "no comparisons
    // at all" — getComparisonsForRepo is a pure filter over repoSlugs with no
    // repo-existence check, so a slug naming no real repo exercises the same
    // empty branch just as validly.
    expect(getComparisonsForRepo("not-a-real-repo-slug")).toEqual([]);
  });

  it("finds the comparison for the AI grove's langchain/llamaindex pair", () => {
    // langchain and llamaindex list only each other under
    // alternatives.open_source — a single mutual pair, not a trio, so each
    // side gets exactly one comparison (same shape as coolify/dokploy above).
    expect(getComparisonsForRepo("langchain").map((c) => c.slug)).toEqual([
      "langchain-vs-llamaindex",
    ]);
    expect(getComparisonsForRepo("llamaindex").map((c) => c.slug)).toEqual([
      "langchain-vs-llamaindex",
    ]);
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

  it("finds both comparisons for each repo in a fully mutual three-way trio", () => {
    // gitui, lazygit, and tig each list the other two under
    // alternatives.open_source, and all three cross-pairs now have their own
    // comparison file (gitui-vs-lazygit, gitui-vs-tig, lazygit-vs-tig) — the
    // same fully-mutual-trio shape as supabase/appwrite/pocketbase, just for
    // the Developer Tools grove's git-TUI cluster.
    expect(getComparisonsForRepo("gitui").map((c) => c.slug).sort()).toEqual([
      "gitui-vs-lazygit",
      "gitui-vs-tig",
    ]);
    expect(getComparisonsForRepo("lazygit").map((c) => c.slug).sort()).toEqual([
      "gitui-vs-lazygit",
      "lazygit-vs-tig",
    ]);
    expect(getComparisonsForRepo("tig").map((c) => c.slug).sort()).toEqual([
      "gitui-vs-tig",
      "lazygit-vs-tig",
    ]);
  });

  it("finds both comparisons for each repo in the AI grove's fully mutual inference trio", () => {
    // ollama, localai, and vllm each list the other two under
    // alternatives.open_source, and all three cross-pairs now have their own
    // comparison file (ollama-vs-vllm pre-dated this run; localai-vs-ollama
    // and localai-vs-vllm complete the trio) — same fully-mutual-trio shape
    // as the git-TUI and self-hosted-backend trios above.
    expect(getComparisonsForRepo("ollama").map((c) => c.slug).sort()).toEqual([
      "localai-vs-ollama",
      "ollama-vs-vllm",
    ]);
    expect(getComparisonsForRepo("localai").map((c) => c.slug).sort()).toEqual([
      "localai-vs-ollama",
      "localai-vs-vllm",
    ]);
    expect(getComparisonsForRepo("vllm").map((c) => c.slug).sort()).toEqual([
      "localai-vs-vllm",
      "ollama-vs-vllm",
    ]);
  });

  it("finds all three comparisons for each repo in the Databases grove's fully mutual quartet", () => {
    // duckdb, clickhouse, sqlite, and postgresql each list the other three
    // under alternatives.open_source, and all six cross-pairs now have their
    // own comparison file (clickhouse-vs-duckdb, duckdb-vs-sqlite, and
    // postgresql-vs-sqlite pre-dated this run; clickhouse-vs-postgresql,
    // clickhouse-vs-sqlite, and duckdb-vs-postgresql complete the quartet) —
    // the same fully-mutual shape as the trios above, just for four repos
    // (3 comparisons per repo instead of 2).
    expect(getComparisonsForRepo("duckdb").map((c) => c.slug).sort()).toEqual([
      "clickhouse-vs-duckdb",
      "duckdb-vs-postgresql",
      "duckdb-vs-sqlite",
    ]);
    expect(getComparisonsForRepo("clickhouse").map((c) => c.slug).sort()).toEqual([
      "clickhouse-vs-duckdb",
      "clickhouse-vs-postgresql",
      "clickhouse-vs-sqlite",
    ]);
    expect(getComparisonsForRepo("sqlite").map((c) => c.slug).sort()).toEqual([
      "clickhouse-vs-sqlite",
      "duckdb-vs-sqlite",
      "postgresql-vs-sqlite",
    ]);
    expect(getComparisonsForRepo("postgresql").map((c) => c.slug).sort()).toEqual([
      "clickhouse-vs-postgresql",
      "duckdb-vs-postgresql",
      "postgresql-vs-sqlite",
    ]);
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
