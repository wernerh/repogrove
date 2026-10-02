import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RepoPage, { generateStaticParams } from "@/app/repo/[slug]/page";

describe("Repo page (/repo/[slug])", () => {
  it("statically generates params for every repo in /content", async () => {
    const params = generateStaticParams();
    expect(params.map((p) => p.slug).sort()).toEqual([
      "appwrite",
      "clickhouse",
      "coolify",
      "dokploy",
      "duckdb",
      "gitui",
      "helix",
      "immich",
      "langchain",
      "lazygit",
      "llamaindex",
      "localai",
      "neovim",
      "ollama",
      "pocketbase",
      "portainer",
      "postgresql",
      "sqlite",
      "supabase",
      "tig",
      "vim",
      "vllm",
      "zed",
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
    expect(screen.getAllByText(/MIT/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(screen.getByText(/Ollama packages open-weight LLMs/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to the Grove.
    expect(screen.getAllByRole("link", { name: "AI" })[0]).toHaveAttribute("href", "/grove/ai");
  });

  it("renders /repo/neovim from content/repos/neovim.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "neovim" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Neovim" })).toBeInTheDocument();
    expect(screen.getAllByText(/Apache-2\.0/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(screen.getByText(/Neovim keeps Vim's modal editing model/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links to the new Developer
    // Tools grove — proves the new content/repos/*.md file actually renders
    // through the real page, not just through generateStaticParams.
    expect(screen.getAllByRole("link", { name: "Developer Tools" })[0]).toHaveAttribute(
      "href",
      "/grove/developer-tools",
    );
  });

  it("renders /repo/pocketbase from content/repos/pocketbase.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "pocketbase" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "PocketBase" })).toBeInTheDocument();
    expect(screen.getAllByText(/MIT/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(screen.getByText(/PocketBase ships as one small Go binary/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links to Self-Hosted — proves
    // the new content/repos/*.md file actually renders through the real
    // page, not just through generateStaticParams.
    expect(screen.getAllByRole("link", { name: "Self-Hosted" })[0]).toHaveAttribute(
      "href",
      "/grove/self-hosted",
    );
    // Its `alternatives.open_source` frontmatter (supabase, appwrite) now
    // resolves against real content/repos/*.md files (this PR's own point —
    // supabase.md already listed both slugs before either existed) rather
    // than rendering "Not yet profiled".
    expect(screen.getAllByRole("link", { name: "Supabase" })[0]).toHaveAttribute(
      "href",
      "/repo/supabase",
    );
    expect(screen.getAllByRole("link", { name: "Appwrite" })[0]).toHaveAttribute(
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
    // accuracy fix), so it renders as a commercial chip, not an unresolved
    // open-source row (its chip now links to /alternative/lm-studio — see
    // the dedicated real-link test below). Both open-source entries now have
    // their own content/repos/*.md files (localai.md added this run) — see
    // "renders the Alternatives table leaving llamaindex unresolved" below for
    // real unresolved-row coverage, and tests/components/alternatives-table.test.tsx
    // for the component's own unit coverage of resolved vs. unresolved rows.
    const element = await RepoPage({ params: Promise.resolve({ slug: "ollama" }) });
    render(element);

    expect(screen.getByRole("heading", { level: 2, name: "Alternatives" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "vLLM" })[0]).toHaveAttribute("href", "/repo/vllm");
    expect(screen.getAllByRole("link", { name: "LocalAI" })[0]).toHaveAttribute("href", "/repo/localai");
    expect(screen.queryByText("Not yet profiled")).not.toBeInTheDocument();
    expect(screen.getByText("Commercial alternatives")).toBeInTheDocument();
    expect(screen.getAllByText("LM Studio")[0]).toBeInTheDocument();
    // The hand-authored "## Alternatives" placeholder prose from
    // content/repos/ollama.md is replaced, not duplicated alongside the
    // table — see src/lib/content.ts's splitOutSection.
    expect(screen.queryByText(/placeholder links/)).not.toBeInTheDocument();
  });

  it("resolves langchain's own alternatives.open_source (llamaindex) now that it has a profile", async () => {
    // langchain.md has listed alternatives.open_source: [llamaindex] since
    // bootstrap — content/repos/llamaindex.md never existed until a later
    // run, so it previously rendered as an unresolved "Not yet profiled"
    // row. As of this run every repo's alternatives.open_source resolves to
    // a real profile (see "resolves lazygit's own alternatives.open_source"
    // below, the last such gap to close).
    const element = await RepoPage({ params: Promise.resolve({ slug: "langchain" }) });
    render(element);

    expect(screen.getByRole("heading", { level: 2, name: "Alternatives" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "LlamaIndex" })[0]).toHaveAttribute(
      "href",
      "/repo/llamaindex",
    );
    expect(screen.queryByText("Not yet profiled")).not.toBeInTheDocument();
  });

  it("renders /repo/llamaindex from content/repos/llamaindex.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "llamaindex" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "LlamaIndex" })).toBeInTheDocument();
    expect(screen.getAllByText(/MIT/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(screen.getByText(/Open-source data framework for connecting large language models/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to the AI grove —
    // proves this new content/repos/*.md file renders through the real page,
    // not just through generateStaticParams.
    expect(screen.getAllByRole("link", { name: "AI" })[0]).toHaveAttribute("href", "/grove/ai");
    // Its own alternatives.open_source (langchain) already exists, so it
    // resolves to a real link rather than "Not yet profiled".
    expect(screen.getAllByRole("link", { name: "LangChain" })[0]).toHaveAttribute(
      "href",
      "/repo/langchain",
    );
  });

  it("renders /repo/vim from content/repos/vim.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "vim" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Vim" })).toBeInTheDocument();
    expect(screen.getAllByText(/Vim License/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(screen.getByText(/A modal, keyboard-driven text editor descended from vi/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to Developer
    // Tools — proves this new content/repos/*.md file renders through the
    // real page, not just through generateStaticParams.
    expect(screen.getAllByRole("link", { name: "Developer Tools" })[0]).toHaveAttribute(
      "href",
      "/grove/developer-tools",
    );
    // Its own alternatives.open_source (neovim, helix, zed) now all resolve
    // to real links — zed.md closed the last dangling reference this run.
    expect(screen.getAllByRole("link", { name: "Neovim" })[0]).toHaveAttribute("href", "/repo/neovim");
    expect(screen.getAllByRole("link", { name: "Helix" })[0]).toHaveAttribute("href", "/repo/helix");
    expect(screen.getAllByRole("link", { name: "Zed" })[0]).toHaveAttribute("href", "/repo/zed");
  });

  it("resolves Neovim's own alternatives.open_source (vim, helix, zed) now that all three have profiles", async () => {
    // neovim.md has listed alternatives.open_source: [vim, helix, zed] since
    // it was added (dev run 33) — content/repos/vim.md, content/repos/
    // helix.md, and content/repos/zed.md didn't all exist until later runs,
    // so each rendered as an unresolved "Not yet profiled" row in turn; zed
    // was the last of the three, closed this run.
    const element = await RepoPage({ params: Promise.resolve({ slug: "neovim" }) });
    render(element);

    expect(screen.getAllByRole("link", { name: "Vim" })[0]).toHaveAttribute("href", "/repo/vim");
    expect(screen.getAllByRole("link", { name: "Helix" })[0]).toHaveAttribute("href", "/repo/helix");
    expect(screen.getAllByRole("link", { name: "Zed" })[0]).toHaveAttribute("href", "/repo/zed");
    // No unresolved rows left — zed.md was the last dangling reference.
    expect(screen.queryByText("Not yet profiled")).not.toBeInTheDocument();
  });

  it("renders /repo/helix from content/repos/helix.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "helix" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Helix" })).toBeInTheDocument();
    expect(screen.getAllByText(/MPL-2.0/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(
      screen.getByText(/A modal terminal text editor built in Rust/),
    ).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to Developer
    // Tools — proves this new content/repos/*.md file renders through the
    // real page, not just through generateStaticParams.
    expect(screen.getAllByRole("link", { name: "Developer Tools" })[0]).toHaveAttribute(
      "href",
      "/grove/developer-tools",
    );
    // Its own alternatives.open_source (vim, neovim, zed) now all resolve to
    // real links — zed.md closed the last dangling reference this run.
    expect(screen.getAllByRole("link", { name: "Vim" })[0]).toHaveAttribute("href", "/repo/vim");
    expect(screen.getAllByRole("link", { name: "Neovim" })[0]).toHaveAttribute("href", "/repo/neovim");
    expect(screen.getAllByRole("link", { name: "Zed" })[0]).toHaveAttribute("href", "/repo/zed");
  });

  it("renders /repo/zed from content/repos/zed.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "zed" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Zed" })).toBeInTheDocument();
    expect(screen.getAllByText(/GPL-3.0 \/ AGPL-3.0/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(
      screen.getByText(/A GPU-accelerated code editor built from scratch in Rust/),
    ).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to Developer
    // Tools — proves this new content/repos/*.md file renders through the
    // real page, not just through generateStaticParams.
    expect(screen.getAllByRole("link", { name: "Developer Tools" })[0]).toHaveAttribute(
      "href",
      "/grove/developer-tools",
    );
    // Its own alternatives.open_source (vim, neovim, helix) all already
    // exist, so all three resolve to real links.
    expect(screen.getAllByRole("link", { name: "Vim" })[0]).toHaveAttribute("href", "/repo/vim");
    expect(screen.getAllByRole("link", { name: "Neovim" })[0]).toHaveAttribute("href", "/repo/neovim");
    expect(screen.getAllByRole("link", { name: "Helix" })[0]).toHaveAttribute("href", "/repo/helix");
  });

  it("resolves lazygit's own alternatives.open_source (tig, gitui) now that both have profiles", async () => {
    // lazygit.md has listed alternatives.open_source: [tig, gitui] since
    // bootstrap — content/repos/tig.md and content/repos/gitui.md didn't
    // exist until this run, so both previously rendered as unresolved
    // "Not yet profiled" rows. This was the last dangling-reference class
    // left open (runs 33/34/37/38/39/40/41/42 closed the others).
    const element = await RepoPage({ params: Promise.resolve({ slug: "lazygit" }) });
    render(element);

    expect(screen.getByRole("heading", { level: 2, name: "Alternatives" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Tig" })[0]).toHaveAttribute("href", "/repo/tig");
    expect(screen.getAllByRole("link", { name: "GitUI" })[0]).toHaveAttribute("href", "/repo/gitui");
    expect(screen.queryByText("Not yet profiled")).not.toBeInTheDocument();
    expect(screen.getByText("Commercial alternatives")).toBeInTheDocument();
    expect(screen.getAllByText("GitKraken")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Sourcetree")[0]).toBeInTheDocument();
  });

  it("renders /repo/tig from content/repos/tig.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "tig" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Tig" })).toBeInTheDocument();
    expect(screen.getAllByText(/GPL-2.0/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(
      screen.getByText(/An ncurses-based text-mode interface for exploring a Git repository's history/),
    ).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to Developer
    // Tools — proves this new content/repos/*.md file renders through the
    // real page, not just through generateStaticParams.
    expect(screen.getAllByRole("link", { name: "Developer Tools" })[0]).toHaveAttribute(
      "href",
      "/grove/developer-tools",
    );
    // Its own alternatives.open_source (lazygit, gitui) both already exist,
    // so both resolve to real links.
    expect(screen.getAllByRole("link", { name: "LazyGit" })[0]).toHaveAttribute("href", "/repo/lazygit");
    expect(screen.getAllByRole("link", { name: "GitUI" })[0]).toHaveAttribute("href", "/repo/gitui");
  });

  it("renders /repo/gitui from content/repos/gitui.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "gitui" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "GitUI" })).toBeInTheDocument();
    expect(screen.getAllByText(/MIT/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(
      screen.getByText(/A terminal UI for git written in Rust, built for speed on very large repositories/),
    ).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to Developer
    // Tools — proves this new content/repos/*.md file renders through the
    // real page, not just through generateStaticParams.
    expect(screen.getAllByRole("link", { name: "Developer Tools" })[0]).toHaveAttribute(
      "href",
      "/grove/developer-tools",
    );
    // Its own alternatives.open_source (lazygit, tig) both already exist,
    // so both resolve to real links.
    expect(screen.getAllByRole("link", { name: "LazyGit" })[0]).toHaveAttribute("href", "/repo/lazygit");
    expect(screen.getAllByRole("link", { name: "Tig" })[0]).toHaveAttribute("href", "/repo/tig");
  });

  it("renders /repo/duckdb from content/repos/duckdb.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "duckdb" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "DuckDB" })).toBeInTheDocument();
    expect(screen.getAllByText(/MIT/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(
      screen.getByText(/An in-process SQL database built for fast analytical queries/),
    ).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to Databases —
    // proves this new content/repos/*.md file renders through the real
    // page, not just through generateStaticParams.
    expect(screen.getAllByRole("link", { name: "Databases" })[0]).toHaveAttribute(
      "href",
      "/grove/databases",
    );
    // Its own alternatives.open_source (clickhouse, sqlite, postgresql)
    // already exist, so all three resolve to real links.
    expect(screen.getAllByRole("link", { name: "ClickHouse" })[0]).toHaveAttribute(
      "href",
      "/repo/clickhouse",
    );
    expect(screen.getAllByRole("link", { name: "SQLite" })[0]).toHaveAttribute(
      "href",
      "/repo/sqlite",
    );
    expect(screen.getAllByRole("link", { name: "PostgreSQL" })[0]).toHaveAttribute(
      "href",
      "/repo/postgresql",
    );
  });

  it("renders /repo/clickhouse from content/repos/clickhouse.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "clickhouse" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "ClickHouse" })).toBeInTheDocument();
    expect(screen.getAllByText(/Apache-2.0/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(
      screen.getByText(
        /A distributed, column-oriented database built for real-time analytics at scale/,
      ),
    ).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to Databases —
    // proves this new content/repos/*.md file renders through the real
    // page, not just through generateStaticParams.
    expect(screen.getAllByRole("link", { name: "Databases" })[0]).toHaveAttribute(
      "href",
      "/grove/databases",
    );
    // Its own alternatives.open_source (duckdb, sqlite, postgresql) already
    // exist, so all three resolve to real links.
    expect(screen.getAllByRole("link", { name: "DuckDB" })[0]).toHaveAttribute(
      "href",
      "/repo/duckdb",
    );
    expect(screen.getAllByRole("link", { name: "SQLite" })[0]).toHaveAttribute(
      "href",
      "/repo/sqlite",
    );
    expect(screen.getAllByRole("link", { name: "PostgreSQL" })[0]).toHaveAttribute(
      "href",
      "/repo/postgresql",
    );
  });

  it("renders /repo/sqlite from content/repos/sqlite.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "sqlite" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "SQLite" })).toBeInTheDocument();
    expect(screen.getAllByText(/Public Domain/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(
      screen.getByText(/An embedded, serverless SQL database/),
    ).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to Databases —
    // proves this new content/repos/*.md file renders through the real
    // page, not just through generateStaticParams.
    expect(screen.getAllByRole("link", { name: "Databases" })[0]).toHaveAttribute(
      "href",
      "/grove/databases",
    );
    // Its own alternatives.open_source (duckdb, postgresql, clickhouse)
    // already exist, so all three resolve to real links.
    expect(screen.getAllByRole("link", { name: "DuckDB" })[0]).toHaveAttribute(
      "href",
      "/repo/duckdb",
    );
    expect(screen.getAllByRole("link", { name: "PostgreSQL" })[0]).toHaveAttribute(
      "href",
      "/repo/postgresql",
    );
    expect(screen.getAllByRole("link", { name: "ClickHouse" })[0]).toHaveAttribute(
      "href",
      "/repo/clickhouse",
    );
  });

  it("renders /repo/postgresql from content/repos/postgresql.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "postgresql" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "PostgreSQL" })).toBeInTheDocument();
    expect(screen.getAllByText(/PostgreSQL License/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(
      screen.getByText(/A general-purpose, client-server relational database/),
    ).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to Databases —
    // proves this new content/repos/*.md file renders through the real
    // page, not just through generateStaticParams.
    expect(screen.getAllByRole("link", { name: "Databases" })[0]).toHaveAttribute(
      "href",
      "/grove/databases",
    );
    // Its own alternatives.open_source (sqlite, duckdb, clickhouse) already
    // exist, so all three resolve to real links.
    expect(screen.getAllByRole("link", { name: "SQLite" })[0]).toHaveAttribute(
      "href",
      "/repo/sqlite",
    );
    expect(screen.getAllByRole("link", { name: "DuckDB" })[0]).toHaveAttribute(
      "href",
      "/repo/duckdb",
    );
    expect(screen.getAllByRole("link", { name: "ClickHouse" })[0]).toHaveAttribute(
      "href",
      "/repo/clickhouse",
    );
  });

  it("renders /repo/localai from content/repos/localai.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "localai" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "LocalAI" })).toBeInTheDocument();
    expect(screen.getAllByText(/MIT/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(screen.getByText(/LocalAI runs open-weight models/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to the AI grove —
    // proves this new content/repos/*.md file renders through the real page,
    // not just through generateStaticParams.
    expect(screen.getAllByRole("link", { name: "AI" })[0]).toHaveAttribute("href", "/grove/ai");
    // Its own alternatives.open_source (ollama, vllm) both already exist, so
    // both resolve to real links rather than "Not yet profiled".
    expect(screen.getAllByRole("link", { name: "Ollama" })[0]).toHaveAttribute("href", "/repo/ollama");
    expect(screen.getAllByRole("link", { name: "vLLM" })[0]).toHaveAttribute("href", "/repo/vllm");
  });

  it("renders /repo/dokploy from content/repos/dokploy.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "dokploy" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Dokploy" })).toBeInTheDocument();
    expect(screen.getAllByText(/Apache-2\.0/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(screen.getByText(/Dokploy wraps Docker and Docker Swarm/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to Self-Hosted —
    // proves this new content/repos/*.md file renders through the real page,
    // not just through generateStaticParams.
    expect(screen.getAllByRole("link", { name: "Self-Hosted" })[0]).toHaveAttribute(
      "href",
      "/grove/self-hosted",
    );
    // Its own alternatives.open_source (coolify) already existed before this
    // repo did, so it resolves to a real link rather than "Not yet profiled".
    expect(screen.getAllByRole("link", { name: "Coolify" })[0]).toHaveAttribute("href", "/repo/coolify");
  });

  it("renders /repo/portainer from content/repos/portainer.md, not a hardcoded string", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "portainer" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Portainer" })).toBeInTheDocument();
    expect(screen.getAllByText(/Zlib/, { selector: "dd" })[0]).toBeInTheDocument();
    expect(screen.getByText(/Portainer deploys as a single container/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to Self-Hosted —
    // proves this new content/repos/*.md file renders through the real page,
    // not just through generateStaticParams.
    expect(screen.getAllByRole("link", { name: "Self-Hosted" })[0]).toHaveAttribute(
      "href",
      "/grove/self-hosted",
    );
    // Its own alternatives.open_source (coolify, dokploy) already existed
    // before this repo did, so both resolve to real links rather than
    // "Not yet profiled".
    expect(screen.getAllByRole("link", { name: "Coolify" })[0]).toHaveAttribute("href", "/repo/coolify");
    expect(screen.getAllByRole("link", { name: "Dokploy" })[0]).toHaveAttribute("href", "/repo/dokploy");
  });

  it("resolves Coolify's own alternatives.open_source (portainer) now that it has a profile", async () => {
    // coolify.md was updated to list portainer under alternatives.open_source
    // in the same change that added content/repos/portainer.md — this proves
    // it doesn't render a dangling "Not yet profiled" row for it.
    render(await RepoPage({ params: Promise.resolve({ slug: "coolify" }) }));
    expect(screen.getAllByRole("link", { name: "Portainer" })[0]).toHaveAttribute(
      "href",
      "/repo/portainer",
    );
    expect(screen.queryByText("Not yet profiled")).not.toBeInTheDocument();
  });

  it("resolves Dokploy's own alternatives.open_source (portainer) now that it has a profile", async () => {
    render(await RepoPage({ params: Promise.resolve({ slug: "dokploy" }) }));
    expect(screen.getAllByRole("link", { name: "Portainer" })[0]).toHaveAttribute(
      "href",
      "/repo/portainer",
    );
    expect(screen.queryByText("Not yet profiled")).not.toBeInTheDocument();
  });

  it("resolves Coolify's own alternatives.open_source (dokploy) now that it has a profile", async () => {
    // coolify.md has listed alternatives.open_source: [dokploy] since it was
    // added (dev run 33) — content/repos/dokploy.md never existed until this
    // run, so it previously rendered as an unresolved "Not yet profiled" row,
    // the same kind of dangling-reference gap LocalAI/PocketBase/Appwrite
    // closed in earlier runs.
    const element = await RepoPage({ params: Promise.resolve({ slug: "coolify" }) });
    render(element);

    expect(screen.getAllByRole("link", { name: "Dokploy" })[0]).toHaveAttribute("href", "/repo/dokploy");
    expect(screen.queryByText("Not yet profiled")).not.toBeInTheDocument();
  });

  it("links Coolify's commercial chips to their own /alternative/:slug pages now that they exist", async () => {
    // TECH-DEBT.md's 2026-10-01 row: coolify.md's alternatives.commercial
    // ([Vercel, Heroku, Netlify]) predates this run, but none of the three
    // had a content/alternatives/*.md page until this run added vercel.md/
    // heroku.md/netlify.md — before that, AlternativesTable.tsx's commercial
    // chips never linked forward even when a matching page did exist
    // elsewhere (e.g. Firebase on /repo/appwrite). This is the real-page
    // integration test for that fix: /repo/coolify (an already-published
    // page whose frontmatter this PR doesn't touch) rendering its commercial
    // chips as real links, not just the isolated component/alternative-page
    // unit tests covering each half of the resolution separately.
    const element = await RepoPage({ params: Promise.resolve({ slug: "coolify" }) });
    render(element);

    for (const [name, slug] of [
      ["Vercel", "vercel"],
      ["Heroku", "heroku"],
      ["Netlify", "netlify"],
    ] as const) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", `/alternative/${slug}`);
    }
  });

  it("links Appwrite's commercial chips (Firebase, AWS Amplify) to their own /alternative/:slug pages now that both exist", async () => {
    // appwrite.md's alternatives.commercial ([Firebase, AWS Amplify]) predates
    // both content/alternatives/*.md pages — Firebase landed in run 48 (still
    // unresolved on this page until run 50's AlternativesTable fix), and AWS
    // Amplify landed this run, closing the second half of the same dangling
    // commercial reference. Real-page integration test for both resolving
    // together, not just the isolated component/alternative-page unit tests.
    const element = await RepoPage({ params: Promise.resolve({ slug: "appwrite" }) });
    render(element);

    for (const [name, slug] of [
      ["Firebase", "firebase"],
      ["AWS Amplify", "aws-amplify"],
    ] as const) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", `/alternative/${slug}`);
    }
  });

  it("links Ollama's commercial chip (LM Studio) to its own /alternative/:slug page now that it exists", async () => {
    // ollama.md's alternatives.commercial ([LM Studio]) predates
    // content/alternatives/lm-studio.md — the last known dangling commercial
    // reference (Firebase/GitKraken-Sourcetree/Vercel-Heroku-Netlify/AWS
    // Amplify all closed in runs 48-51). Real-page integration test for the
    // resolved link, not just the isolated component/alternative-page unit
    // tests.
    const element = await RepoPage({ params: Promise.resolve({ slug: "ollama" }) });
    render(element);

    expect(screen.getAllByRole("link", { name: "LM Studio" })[0]).toHaveAttribute(
      "href",
      "/alternative/lm-studio",
    );
  });

  it("renders a 'Compared with' cross-link for a repo named in a /compare/:a/:b content file (issue #62)", async () => {
    // content/comparisons/ollama-vs-vllm.md names both ollama and vllm.
    const element = await RepoPage({ params: Promise.resolve({ slug: "ollama" }) });
    render(element);

    expect(screen.getByRole("heading", { level: 2, name: "Compared with" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "vs vLLM" })[0]).toHaveAttribute(
      "href",
      "/compare/ollama/vllm",
    );
  });

  // The "omits the 'Compared with' section for a repo with no comparison
  // content file" case no longer has a real-repo fixture — every repo now has
  // at least one comparison content file (langchain-vs-llamaindex closed the
  // last gap) — so it moved to tests/app/repo-page-no-comparisons.test.tsx,
  // which mocks getComparisonsForRepo instead of relying on a real repo
  // happening to have none (same isolation pattern repo-page-releases-empty's
  // own doc comment and TECH-DEBT.md's 2026-09-30 row establish for this
  // exact kind of real-data coupling).

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

describe("Repo page details widgets (Precision Editorial)", () => {
  it("shows the hero GitHub button, stat tiles, ledger, comparison matrix and Grove neighbors for ollama", async () => {
    const element = await RepoPage({ params: Promise.resolve({ slug: "ollama" }) });
    render(element);

    expect(screen.getByRole("link", { name: /Visit on GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/ollama/ollama",
    );
    expect(screen.getByText("Stargazers")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Repository ledger" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "How it compares" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Grove neighbors" })).toBeInTheDocument();
    expect(screen.getByText(/Direct alternative to:/)).toBeInTheDocument();
  });
});
