import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RepoPage, { generateStaticParams } from "@/app/repo/[slug]/page";

describe("Repo page (/repo/[slug])", () => {
  it("statically generates params for every repo in /content", async () => {
    const params = generateStaticParams();
    expect(params.map((p) => p.slug).sort()).toEqual([
      "appwrite",
      "coolify",
      "dokploy",
      "helix",
      "langchain",
      "lazygit",
      "llamaindex",
      "localai",
      "neovim",
      "ollama",
      "pocketbase",
      "supabase",
      "vim",
      "vllm",
    ]);
  });

  it("renders /repo/ollama from content/repos/ollama.md, not a hardcoded string", async () => {
    const { container } = render(
      await RepoPage({ params: Promise.resolve({ slug: "ollama" }) }),
    );

    expect(screen.getByRole("heading", { level: 1, name: "Ollama" })).toBeInTheDocument();
    // Status renders as the StatusChip component (swatch + text label as
    // separate nodes, swatch marked aria-hidden) — see
    // tests/components/status-chip.test.tsx for its own unit coverage.
    // Scoped to the page's own metadata <dl>, and further scoped to the
    // "Status:" row specifically: ollama's Alternatives table (see
    // tests/components/alternatives-table.test.tsx) also renders a
    // StatusChip for its resolved "vllm" row, and this page's own
    // MomentumChip (issue #21/ADR-004) happens to also read "Active" for
    // ollama today (real data/repogrove.db growth rate) — an unscoped query
    // would find multiple "Active" matches for both reasons. StatusChip and
    // MomentumChip no longer share an icon (issue #52 — StatusChip uses a
    // square swatch, MomentumChip keeps the spec-locked circular dot), so
    // this scoping is about the shared "Active" text label, not an icon.
    const metadata = container.querySelector("dl");
    expect(metadata).not.toBeNull();
    const statusRow = within(metadata!).getByText("Status:").closest("div")!;
    expect(within(statusRow).getByText("Active")).toBeInTheDocument();
    expect(within(statusRow).getByTestId("status-chip-swatch")).toBeInTheDocument();
    expect(screen.getByText(/📜 MIT/)).toBeInTheDocument();
    expect(screen.getByText(/Ollama packages open-weight LLMs/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to the Grove.
    expect(screen.getByRole("link", { name: "AI" })).toHaveAttribute("href", "/grove/ai");
  });

  it("renders /repo/neovim from content/repos/neovim.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "neovim" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Neovim" })).toBeInTheDocument();
    expect(screen.getByText(/📜 Apache-2\.0/)).toBeInTheDocument();
    expect(screen.getByText(/Neovim keeps Vim's modal editing model/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links to the new Developer
    // Tools grove — proves the new content/repos/*.md file actually renders
    // through the real page, not just through generateStaticParams.
    expect(screen.getByRole("link", { name: "Developer Tools" })).toHaveAttribute(
      "href",
      "/grove/developer-tools",
    );
  });

  it("renders /repo/pocketbase from content/repos/pocketbase.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "pocketbase" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "PocketBase" })).toBeInTheDocument();
    expect(screen.getByText(/📜 MIT/)).toBeInTheDocument();
    expect(screen.getByText(/PocketBase ships as one small Go binary/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links to Self-Hosted — proves
    // the new content/repos/*.md file actually renders through the real
    // page, not just through generateStaticParams.
    expect(screen.getByRole("link", { name: "Self-Hosted" })).toHaveAttribute(
      "href",
      "/grove/self-hosted",
    );
    // Its `alternatives.open_source` frontmatter (supabase, appwrite) now
    // resolves against real content/repos/*.md files (this PR's own point —
    // supabase.md already listed both slugs before either existed) rather
    // than rendering "Not yet profiled".
    expect(screen.getByRole("link", { name: "Supabase" })).toHaveAttribute(
      "href",
      "/repo/supabase",
    );
    expect(screen.getByRole("link", { name: "Appwrite" })).toHaveAttribute(
      "href",
      "/repo/appwrite",
    );
    expect(screen.queryByText("Not yet profiled")).not.toBeInTheDocument();
  });

  it("renders the Momentum/Heat chip from real snapshot history (issue #21/ADR-004)", async () => {
    // data/repogrove.db now holds 3 calendar days of history for ollama
    // (2026-09-27 through 2026-09-29) — enough for computeHeat to produce
    // a real label rather than omitting the chip. See docs/adr/ADR-004's
    // worked example: ollama's real growth rate (~0.024%/day) lands in the
    // "Active" bucket, same label ollama's editorial `status` happens to
    // read today — a coincidence for this one repo, not the same signal
    // (see this file's earlier scoped-query comment).
    const { container } = render(
      await RepoPage({ params: Promise.resolve({ slug: "ollama" }) }),
    );
    const metadata = container.querySelector("dl");
    const momentumRow = within(metadata!).getByText("Momentum:").closest("div")!;
    expect(within(momentumRow).getByText("Active")).toBeInTheDocument();
    expect(within(momentumRow).getByText("🟢")).toBeInTheDocument();
  });

  it("renders the star-growth chart from the committed snapshot database (issue #18)", async () => {
    // data/repogrove.db now holds several days of real history per repo
    // (see docs/adr/ADR-004 for the exact count as of this PR) — this
    // exercises the real-delta rendering path, not the single-snapshot
    // graceful-degradation state; either way the page must not crash.
    const element = await RepoPage({ params: Promise.resolve({ slug: "ollama" }) });
    render(element);

    expect(screen.getByText(/stars/)).toBeInTheDocument();
  });

  it("calls notFound() for a repo slug that doesn't exist in /content", async () => {
    await expect(
      RepoPage({ params: Promise.resolve({ slug: "does-not-exist" }) }),
    ).rejects.toThrow();
  });

  it("renders the Alternatives table (spec §3-4), resolving both LocalAI and vLLM, and listing LM Studio as commercial", async () => {
    // ollama.md's frontmatter: alternatives.open_source = [localai, vllm],
    // alternatives.commercial = [LM Studio] — LM Studio is closed-source/
    // proprietary freeware, not an open-source project (2026-09-30 content-
    // accuracy fix), so it renders as a plain commercial chip, not an
    // unresolved open-source row. Both open-source entries now have their own
    // content/repos/*.md files (localai.md added this run) — see
    // "renders the Alternatives table leaving llamaindex unresolved" below for
    // real unresolved-row coverage, and tests/components/alternatives-table.test.tsx
    // for the component's own unit coverage of resolved vs. unresolved rows.
    const element = await RepoPage({ params: Promise.resolve({ slug: "ollama" }) });
    render(element);

    expect(screen.getByRole("heading", { level: 2, name: "Alternatives" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "vLLM" })).toHaveAttribute("href", "/repo/vllm");
    expect(screen.getByRole("link", { name: "LocalAI" })).toHaveAttribute("href", "/repo/localai");
    expect(screen.queryByText("Not yet profiled")).not.toBeInTheDocument();
    expect(screen.getByText("Commercial alternatives")).toBeInTheDocument();
    expect(screen.getByText("LM Studio")).toBeInTheDocument();
    // The hand-authored "## Alternatives" placeholder prose from
    // content/repos/ollama.md is replaced, not duplicated alongside the
    // table — see src/lib/content.ts's splitOutSection.
    expect(screen.queryByText(/placeholder links/)).not.toBeInTheDocument();
  });

  it("resolves langchain's own alternatives.open_source (llamaindex) now that it has a profile", async () => {
    // langchain.md has listed alternatives.open_source: [llamaindex] since
    // bootstrap — content/repos/llamaindex.md never existed until this run,
    // so it previously rendered as an unresolved "Not yet profiled" row (see
    // "renders the Alternatives table leaving tig/gitui unresolved" below for
    // the current real-content unresolved case).
    const element = await RepoPage({ params: Promise.resolve({ slug: "langchain" }) });
    render(element);

    expect(screen.getByRole("heading", { level: 2, name: "Alternatives" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "LlamaIndex" })).toHaveAttribute(
      "href",
      "/repo/llamaindex",
    );
    expect(screen.queryByText("Not yet profiled")).not.toBeInTheDocument();
  });

  it("renders /repo/llamaindex from content/repos/llamaindex.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "llamaindex" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "LlamaIndex" })).toBeInTheDocument();
    expect(screen.getByText(/📜 MIT/)).toBeInTheDocument();
    expect(screen.getByText(/Open-source data framework for connecting large language models/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to the AI grove —
    // proves this new content/repos/*.md file renders through the real page,
    // not just through generateStaticParams.
    expect(screen.getByRole("link", { name: "AI" })).toHaveAttribute("href", "/grove/ai");
    // Its own alternatives.open_source (langchain) already exists, so it
    // resolves to a real link rather than "Not yet profiled".
    expect(screen.getByRole("link", { name: "LangChain" })).toHaveAttribute(
      "href",
      "/repo/langchain",
    );
  });

  it("renders /repo/vim from content/repos/vim.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "vim" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Vim" })).toBeInTheDocument();
    expect(screen.getByText(/📜 Vim License/)).toBeInTheDocument();
    expect(screen.getByText(/A modal, keyboard-driven text editor descended from vi/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to Developer
    // Tools — proves this new content/repos/*.md file renders through the
    // real page, not just through generateStaticParams.
    expect(screen.getByRole("link", { name: "Developer Tools" })).toHaveAttribute(
      "href",
      "/grove/developer-tools",
    );
    // Its own alternatives.open_source (neovim, helix) now both resolve to
    // real links; zed stays unresolved (no content/repos/zed.md yet).
    expect(screen.getByRole("link", { name: "Neovim" })).toHaveAttribute("href", "/repo/neovim");
    expect(screen.getByRole("link", { name: "Helix" })).toHaveAttribute("href", "/repo/helix");
    expect(screen.getByText("zed")).toBeInTheDocument();
  });

  it("resolves Neovim's own alternatives.open_source (vim, helix) now that both have profiles", async () => {
    // neovim.md has listed alternatives.open_source: [vim, helix, zed] since
    // it was added (dev run 33) — content/repos/vim.md and content/repos/
    // helix.md didn't exist until later runs, so both previously rendered as
    // unresolved "Not yet profiled" rows; zed remains the real unresolved case.
    const element = await RepoPage({ params: Promise.resolve({ slug: "neovim" }) });
    render(element);

    expect(screen.getByRole("link", { name: "Vim" })).toHaveAttribute("href", "/repo/vim");
    expect(screen.getByRole("link", { name: "Helix" })).toHaveAttribute("href", "/repo/helix");
    expect(screen.getByText("zed")).toBeInTheDocument();
    expect(screen.getAllByText("Not yet profiled").length).toBeGreaterThanOrEqual(1);
  });

  it("renders /repo/helix from content/repos/helix.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "helix" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Helix" })).toBeInTheDocument();
    expect(screen.getByText(/📜 MPL-2.0/)).toBeInTheDocument();
    expect(
      screen.getByText(/A modal terminal text editor built in Rust/),
    ).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to Developer
    // Tools — proves this new content/repos/*.md file renders through the
    // real page, not just through generateStaticParams.
    expect(screen.getByRole("link", { name: "Developer Tools" })).toHaveAttribute(
      "href",
      "/grove/developer-tools",
    );
    // Its own alternatives.open_source (vim, neovim) already exist, so both
    // resolve to real links rather than "Not yet profiled"; zed stays
    // unresolved (no content/repos/zed.md yet).
    expect(screen.getByRole("link", { name: "Vim" })).toHaveAttribute("href", "/repo/vim");
    expect(screen.getByRole("link", { name: "Neovim" })).toHaveAttribute("href", "/repo/neovim");
    expect(screen.getByText("zed")).toBeInTheDocument();
  });

  it("renders the Alternatives table leaving tig/gitui unresolved (no content/repos/{tig,gitui}.md yet)", async () => {
    // lazygit.md's frontmatter: alternatives.open_source = [tig, gitui],
    // commercial = [GitKraken, Sourcetree] — the current real-content case
    // for an unresolved open-source row, now that LocalAI and LlamaIndex
    // both have their own profiles.
    const element = await RepoPage({ params: Promise.resolve({ slug: "lazygit" }) });
    render(element);

    expect(screen.getByRole("heading", { level: 2, name: "Alternatives" })).toBeInTheDocument();
    expect(screen.getByText("tig")).toBeInTheDocument();
    expect(screen.getByText("gitui")).toBeInTheDocument();
    expect(screen.getAllByText("Not yet profiled").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole("link", { name: /^tig$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^gitui$/i })).not.toBeInTheDocument();
    expect(screen.getByText("Commercial alternatives")).toBeInTheDocument();
    expect(screen.getByText("GitKraken")).toBeInTheDocument();
    expect(screen.getByText("Sourcetree")).toBeInTheDocument();
  });

  it("renders /repo/localai from content/repos/localai.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "localai" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "LocalAI" })).toBeInTheDocument();
    expect(screen.getByText(/📜 MIT/)).toBeInTheDocument();
    expect(screen.getByText(/LocalAI runs open-weight models/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to the AI grove —
    // proves this new content/repos/*.md file renders through the real page,
    // not just through generateStaticParams.
    expect(screen.getByRole("link", { name: "AI" })).toHaveAttribute("href", "/grove/ai");
    // Its own alternatives.open_source (ollama, vllm) both already exist, so
    // both resolve to real links rather than "Not yet profiled".
    expect(screen.getByRole("link", { name: "Ollama" })).toHaveAttribute("href", "/repo/ollama");
    expect(screen.getByRole("link", { name: "vLLM" })).toHaveAttribute("href", "/repo/vllm");
  });

  it("renders /repo/dokploy from content/repos/dokploy.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "dokploy" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Dokploy" })).toBeInTheDocument();
    expect(screen.getByText(/📜 Apache-2\.0/)).toBeInTheDocument();
    expect(screen.getByText(/Dokploy wraps Docker and Docker Swarm/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to Self-Hosted —
    // proves this new content/repos/*.md file renders through the real page,
    // not just through generateStaticParams.
    expect(screen.getByRole("link", { name: "Self-Hosted" })).toHaveAttribute(
      "href",
      "/grove/self-hosted",
    );
    // Its own alternatives.open_source (coolify) already existed before this
    // repo did, so it resolves to a real link rather than "Not yet profiled".
    expect(screen.getByRole("link", { name: "Coolify" })).toHaveAttribute("href", "/repo/coolify");
  });

  it("resolves Coolify's own alternatives.open_source (dokploy) now that it has a profile", async () => {
    // coolify.md has listed alternatives.open_source: [dokploy] since it was
    // added (dev run 33) — content/repos/dokploy.md never existed until this
    // run, so it previously rendered as an unresolved "Not yet profiled" row,
    // the same kind of dangling-reference gap LocalAI/PocketBase/Appwrite
    // closed in earlier runs.
    const element = await RepoPage({ params: Promise.resolve({ slug: "coolify" }) });
    render(element);

    expect(screen.getByRole("link", { name: "Dokploy" })).toHaveAttribute("href", "/repo/dokploy");
    expect(screen.queryByText("Not yet profiled")).not.toBeInTheDocument();
  });

  it("renders a 'Compared with' cross-link for a repo named in a /compare/:a/:b content file (issue #62)", async () => {
    // content/comparisons/ollama-vs-vllm.md names both ollama and vllm.
    const element = await RepoPage({ params: Promise.resolve({ slug: "ollama" }) });
    render(element);

    expect(screen.getByRole("heading", { level: 2, name: "Compared with" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "vs vLLM" })).toHaveAttribute(
      "href",
      "/compare/ollama/vllm",
    );
  });

  it("omits the 'Compared with' section for a repo with no comparison content file", async () => {
    // supabase now has two comparisons of its own (appwrite-vs-supabase,
    // pocketbase-vs-supabase) — coolify has none, so it's the real fixture
    // for this "no comparisons at all" case.
    const element = await RepoPage({ params: Promise.resolve({ slug: "coolify" }) });
    render(element);

    expect(screen.queryByRole("heading", { level: 2, name: "Compared with" })).not.toBeInTheDocument();
  });

  it("renders the 'Latest' releases section against the real committed database without crashing (issue #72)", async () => {
    // Deliberately a structural smoke test, not a specific-content assertion: the real
    // data/repogrove.db is refreshed by the daily ingestion job (scripts/ingestion/
    // fetch-snapshots.ts), so its exact release count/titles/dates change over time —
    // asserting specific content here would be exactly the real-db coupling that broke
    // tests/app/repo-page.test.tsx's previous empty-state test the moment ingestion
    // actually ran (see TECH-DEBT.md's 2026-09-30 row). The empty and populated render
    // branches themselves are covered, isolated and mocked, by
    // tests/app/repo-page-releases-empty.test.tsx and tests/app/repo-page-releases.test.tsx —
    // this test's only job is confirming the real, unmocked path (real SQL query against
    // the real schema, real getRecentReleases call, real date formatting) doesn't throw
    // for a repo with real releases on record.
    const element = await RepoPage({ params: Promise.resolve({ slug: "ollama" }) });
    render(element);

    const heading = screen.getByRole("heading", { level: 2, name: "Latest" });
    const section = heading.closest("section");
    expect(section).not.toBeNull();
    // Either a real release list or the empty state is fine — both are valid,
    // non-fabricated renders; the assertion just requires the section rendered
    // *something* sensible, not that the db is in a particular state. Scoped to this
    // section specifically (via `within`) so links elsewhere on the page (GitHub link,
    // Alternatives table, "Compared with") can't make this assertion pass regardless of
    // what "Latest" itself rendered.
    const withinSection = within(section!);
    const emptyState = withinSection.queryByText("No recent releases.");
    const releaseLinks = withinSection.queryAllByRole("link");
    expect(emptyState !== null || releaseLinks.length > 0).toBe(true);
  });
});
