import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ComparePage, { generateMetadata, generateStaticParams } from "@/app/compare/[a]/[b]/page";
import { getAllComparisons } from "@/lib/content";

describe("Compare page (/compare/[a]/[b])", () => {
  it("statically generates params for both URL orders of every comparison", async () => {
    const params = generateStaticParams();
    expect(params).toContainEqual({ a: "ollama", b: "vllm" });
    expect(params).toContainEqual({ a: "vllm", b: "ollama" });
    // Twice the real comparison count (both URL orders per comparison) —
    // derived from the real fixtures rather than hardcoded, so this doesn't
    // need updating every time a new content/comparisons/*.md file ships.
    expect(params).toHaveLength(getAllComparisons().length * 2);
  });

  it("renders /compare/appwrite/supabase from content/comparisons/appwrite-vs-supabase.md", async () => {
    // Deliberately structural/content-only, not a specific Stars/Momentum
    // assertion: Appwrite has no ingested snapshot history yet in the real
    // committed data/repogrove.db (it was added to content/repos/ after the
    // last ingestion run), but that's a temporary, mutable state the next
    // scheduled ingestion run will change — asserting against it here would
    // be exactly the real-db coupling TECH-DEBT.md's 2026-09-30 row warns
    // about. The graceful-degradation behavior itself (no crash either way)
    // is covered in isolation by compare-page-no-history.test.tsx, which
    // mocks @/lib/snapshots instead of relying on the real db's current,
    // temporary emptiness.
    render(await ComparePage({ params: Promise.resolve({ a: "appwrite", b: "supabase" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Appwrite vs Supabase" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Appwrite" })).toHaveAttribute(
      "href",
      "/repo/appwrite",
    );
    expect(screen.getByRole("link", { name: "Supabase" })).toHaveAttribute(
      "href",
      "/repo/supabase",
    );

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(screen.getByText(/Supabase is built on real Postgres/)).toBeInTheDocument();
  });

  it("renders /compare/ollama/vllm from content/comparisons/ollama-vs-vllm.md, not hardcoded data", async () => {
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "ollama", b: "vllm" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Ollama vs vLLM" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ollama" })).toHaveAttribute("href", "/repo/ollama");
    expect(screen.getByRole("link", { name: "vLLM" })).toHaveAttribute("href", "/repo/vllm");

    // At-a-glance table: both repos' license, status, and category — reused
    // from getRepo, not re-authored in the comparison content file.
    const table = container.querySelector("table")!;
    expect(within(table).getByText(/MIT/)).toBeInTheDocument();
    expect(within(table).getByText(/Apache-2.0/)).toBeInTheDocument();
    expect(within(table).getAllByText("Active").length).toBeGreaterThan(0);

    // Pros/Cons reused verbatim from each repo's own content body — not
    // re-authored in the comparison content file (which has no Pros/Cons
    // frontmatter or sections of its own at all).
    expect(screen.getByText("Fast to get started")).toBeInTheDocument();
    expect(screen.getByText(/Production-grade performance/)).toBeInTheDocument();

    // The hand-authored "How they differ" prose.
    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(screen.getByText(/reach for Ollama to run a model locally/)).toBeInTheDocument();
  });

  it("renders /compare/lazygit/tig from content/comparisons/lazygit-vs-tig.md, part of the fully-mutual git-TUI trio", async () => {
    // gitui, lazygit, and tig each list the other two under
    // alternatives.open_source — this is one of the three new comparison
    // files (gitui-vs-lazygit, gitui-vs-tig, lazygit-vs-tig) that closes the
    // trio out, same shape as the appwrite/pocketbase/supabase trio.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "lazygit", b: "tig" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "LazyGit vs Tig" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "LazyGit" })).toHaveAttribute("href", "/repo/lazygit");
    expect(screen.getByRole("link", { name: "Tig" })).toHaveAttribute("href", "/repo/tig");

    const table = container.querySelector("table")!;
    expect(within(table).getByText(/MIT/)).toBeInTheDocument();
    expect(within(table).getByText(/GPL-2.0/)).toBeInTheDocument();

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(screen.getByText(/Tig predates LazyGit by years/)).toBeInTheDocument();
  });

  it("renders /compare/coolify/dokploy from content/comparisons/coolify-vs-dokploy.md", async () => {
    // coolify.md and dokploy.md have listed each other under
    // alternatives.open_source since dokploy.md was added (run 38) — this is
    // the comparison page that finally closes that pair out.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "coolify", b: "dokploy" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Coolify vs Dokploy" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Coolify" })).toHaveAttribute("href", "/repo/coolify");
    expect(screen.getByRole("link", { name: "Dokploy" })).toHaveAttribute("href", "/repo/dokploy");

    const table = container.querySelector("table")!;
    expect(within(table).getAllByText(/Apache-2.0/).length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(screen.getByText(/Dokploy builds multi-server deployment on Docker Swarm/)).toBeInTheDocument();
  });

  it("renders /compare/coolify/portainer from content/comparisons/coolify-vs-portainer.md", async () => {
    // coolify.md and portainer.md have listed each other under
    // alternatives.open_source since portainer.md was added (2026-10-02) —
    // this is the comparison page that closes that pair out.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "coolify", b: "portainer" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Coolify vs Portainer" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Coolify" })).toHaveAttribute("href", "/repo/coolify");
    expect(screen.getByRole("link", { name: "Portainer" })).toHaveAttribute(
      "href",
      "/repo/portainer",
    );

    const table = container.querySelector("table")!;
    expect(within(table).getByText(/Apache-2.0/)).toBeInTheDocument();
    expect(within(table).getByText(/Zlib/)).toBeInTheDocument();

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(screen.getByText(/Coolify is a Heroku\/Vercel-style PaaS/)).toBeInTheDocument();
  });

  it("renders /compare/dokploy/portainer from content/comparisons/dokploy-vs-portainer.md", async () => {
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "dokploy", b: "portainer" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Dokploy vs Portainer" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dokploy" })).toHaveAttribute("href", "/repo/dokploy");
    expect(screen.getByRole("link", { name: "Portainer" })).toHaveAttribute(
      "href",
      "/repo/portainer",
    );

    const table = container.querySelector("table")!;
    expect(within(table).getByText(/Apache-2.0/)).toBeInTheDocument();
    expect(within(table).getByText(/Zlib/)).toBeInTheDocument();

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(
      screen.getByText(/Dokploy wraps Docker and Docker Swarm behind a Git-push deploy workflow/),
    ).toBeInTheDocument();
  });

  it("renders /compare/ollama/localai from content/comparisons/localai-vs-ollama.md, part of the fully-mutual AI inference trio", async () => {
    // ollama, localai, and vllm each list the other two under
    // alternatives.open_source — localai-vs-ollama and localai-vs-vllm are
    // the two new comparison files that complete the trio alongside the
    // pre-existing ollama-vs-vllm. URL order is ollama/localai (neither
    // matches the content file's own canonical [localai, ollama] order) to
    // also exercise the non-canonical-URL-order lookup, same as the
    // vllm/ollama reverse-order test below.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "ollama", b: "localai" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "LocalAI vs Ollama" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ollama" })).toHaveAttribute("href", "/repo/ollama");
    expect(screen.getByRole("link", { name: "LocalAI" })).toHaveAttribute("href", "/repo/localai");

    const table = container.querySelector("table")!;
    expect(within(table).getAllByText(/MIT/).length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(
      screen.getByText(/Ollama is built around one job done simply/),
    ).toBeInTheDocument();
  });

  it("renders /compare/langchain/llamaindex from content/comparisons/langchain-vs-llamaindex.md", async () => {
    // langchain.md and llamaindex.md have listed each other under
    // alternatives.open_source since llamaindex.md was added (run 39) — this
    // is the comparison page that finally closes that pair out, the last
    // mutual pair in content/ without one.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "langchain", b: "llamaindex" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "LangChain vs LlamaIndex" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "LangChain" })).toHaveAttribute(
      "href",
      "/repo/langchain",
    );
    expect(screen.getByRole("link", { name: "LlamaIndex" })).toHaveAttribute(
      "href",
      "/repo/llamaindex",
    );

    const table = container.querySelector("table")!;
    expect(within(table).getAllByText(/MIT/).length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(
      screen.getByText(/LangChain is built around general-purpose orchestration/),
    ).toBeInTheDocument();
  });

  it("renders /compare/clickhouse/duckdb from content/comparisons/clickhouse-vs-duckdb.md", async () => {
    // clickhouse.md and duckdb.md list each other under
    // alternatives.open_source since both were added this run — this
    // comparison page closes that pair out in the same PR, rather than
    // leaving a dangling-mutual-pair gap for a future run to find.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "clickhouse", b: "duckdb" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "ClickHouse vs DuckDB" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ClickHouse" })).toHaveAttribute(
      "href",
      "/repo/clickhouse",
    );
    expect(screen.getByRole("link", { name: "DuckDB" })).toHaveAttribute(
      "href",
      "/repo/duckdb",
    );

    const table = container.querySelector("table")!;
    expect(within(table).getAllByText(/Apache-2.0/).length).toBeGreaterThan(0);
    expect(within(table).getAllByText(/MIT/).length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(
      screen.getByText(/ClickHouse is a distributed, client-server database/),
    ).toBeInTheDocument();
  });

  it("renders /compare/duckdb/sqlite from content/comparisons/duckdb-vs-sqlite.md", async () => {
    // duckdb.md and sqlite.md list each other under alternatives.open_source
    // since sqlite.md was added this run — this comparison page closes that
    // pair out in the same PR, rather than leaving a dangling-mutual-pair
    // gap for a future run to find.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "duckdb", b: "sqlite" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "DuckDB vs SQLite" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "DuckDB" })).toHaveAttribute(
      "href",
      "/repo/duckdb",
    );
    expect(screen.getByRole("link", { name: "SQLite" })).toHaveAttribute(
      "href",
      "/repo/sqlite",
    );

    const table = container.querySelector("table")!;
    expect(within(table).getAllByText(/MIT/).length).toBeGreaterThan(0);
    expect(within(table).getAllByText(/Public Domain/).length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(
      screen.getByText(/SQLite is built for OLTP/),
    ).toBeInTheDocument();
  });

  it("renders /compare/postgresql/sqlite from content/comparisons/postgresql-vs-sqlite.md", async () => {
    // postgresql.md and sqlite.md list each other under alternatives.open_source
    // since postgresql.md was added this run — this comparison page closes
    // that pair out in the same PR, rather than leaving a dangling-mutual-pair
    // gap for a future run to find.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "postgresql", b: "sqlite" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "PostgreSQL vs SQLite" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "PostgreSQL" })).toHaveAttribute(
      "href",
      "/repo/postgresql",
    );
    expect(screen.getByRole("link", { name: "SQLite" })).toHaveAttribute(
      "href",
      "/repo/sqlite",
    );

    const table = container.querySelector("table")!;
    expect(within(table).getAllByText(/PostgreSQL License/).length).toBeGreaterThan(0);
    expect(within(table).getAllByText(/Public Domain/).length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(
      screen.getByText(/PostgreSQL is a client-server database/),
    ).toBeInTheDocument();
  });

  it("renders /compare/duckdb/postgresql from content/comparisons/duckdb-vs-postgresql.md", async () => {
    // duckdb.md and postgresql.md now list each other under
    // alternatives.open_source, completing the Databases grove's fully
    // mutual quartet (duckdb/clickhouse/sqlite/postgresql) — this comparison
    // page closes that pair out in the same PR as the other two remaining
    // cross-pairs, rather than leaving dangling-mutual-pair gaps behind.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "duckdb", b: "postgresql" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "DuckDB vs PostgreSQL" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "DuckDB" })).toHaveAttribute(
      "href",
      "/repo/duckdb",
    );
    expect(screen.getByRole("link", { name: "PostgreSQL" })).toHaveAttribute(
      "href",
      "/repo/postgresql",
    );

    const table = container.querySelector("table")!;
    expect(within(table).getAllByText(/MIT/).length).toBeGreaterThan(0);
    expect(within(table).getAllByText(/PostgreSQL License/).length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(
      screen.getByText(/PostgreSQL is a general-purpose, client-server database/),
    ).toBeInTheDocument();

    // Regression check (content.ts's extractListItems only captures lines
    // literally starting with "- ", silently dropping a wrapped continuation
    // line — the exact bug CHANGELOG.md documents being caught and fixed for
    // content/alternatives/*.md previously, and found again in content/repos/
    // duckdb.md's/postgresql.md's own Pros/Cons during this PR's review,
    // since both repos' Pros/Cons bullets were wrapped across two lines).
    // Asserting the full, untruncated bullet text here locks the fix in: a
    // future wrapped bullet fails this assertion instead of silently
    // truncating on the live page.
    expect(
      screen.getByText(
        "Genuinely zero-dependency: builds and runs with just a C++17 compiler, no external services",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Needs a server process to install, configure, tune, and keep running — real operational overhead compared to an embedded database with no service to manage",
      ),
    ).toBeInTheDocument();
  });

  it("renders /compare/clickhouse/postgresql from content/comparisons/clickhouse-vs-postgresql.md", async () => {
    // clickhouse.md and postgresql.md now list each other under
    // alternatives.open_source, completing the Databases grove's fully
    // mutual quartet — see the duckdb-vs-postgresql test above.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "clickhouse", b: "postgresql" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "ClickHouse vs PostgreSQL" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ClickHouse" })).toHaveAttribute(
      "href",
      "/repo/clickhouse",
    );
    expect(screen.getByRole("link", { name: "PostgreSQL" })).toHaveAttribute(
      "href",
      "/repo/postgresql",
    );

    const table = container.querySelector("table")!;
    expect(within(table).getAllByText(/Apache-2.0/).length).toBeGreaterThan(0);
    expect(within(table).getAllByText(/PostgreSQL License/).length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(
      screen.getByText(/PostgreSQL is row-oriented and built for OLTP/),
    ).toBeInTheDocument();
  });

  it("renders /compare/clickhouse/sqlite from content/comparisons/clickhouse-vs-sqlite.md", async () => {
    // clickhouse.md and sqlite.md now list each other under
    // alternatives.open_source, completing the Databases grove's fully
    // mutual quartet — see the duckdb-vs-postgresql test above.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "clickhouse", b: "sqlite" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "ClickHouse vs SQLite" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ClickHouse" })).toHaveAttribute(
      "href",
      "/repo/clickhouse",
    );
    expect(screen.getByRole("link", { name: "SQLite" })).toHaveAttribute(
      "href",
      "/repo/sqlite",
    );

    const table = container.querySelector("table")!;
    expect(within(table).getAllByText(/Apache-2.0/).length).toBeGreaterThan(0);
    expect(within(table).getAllByText(/Public Domain/).length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(
      screen.getByText(/SQLite is an embedded, serverless, row-oriented database/),
    ).toBeInTheDocument();

    // Regression check — see the duckdb-vs-postgresql test above for why:
    // locks in ClickHouse's and SQLite's own previously-wrapped Pros/Cons
    // bullets rendering in full, untruncated, on the compare page.
    expect(
      screen.getByText(
        "Proven at very large scale — in production at companies including Uber, eBay, and Comcast for analytics and reporting workloads",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Row-oriented storage tuned for transactional (OLTP) access patterns, not for large-scale analytical aggregations — see DuckDB below for that workload instead",
      ),
    ).toBeInTheDocument();
  });

  it("resolves the reverse URL order (/compare/vllm/ollama) to the same content, rendered in canonical order", async () => {
    const { container: forward } = render(
      await ComparePage({ params: Promise.resolve({ a: "ollama", b: "vllm" }) }),
    );
    const { container: reverse } = render(
      await ComparePage({ params: Promise.resolve({ a: "vllm", b: "ollama" }) }),
    );
    // Same heading either way — the page always renders in the content
    // file's own canonical repos order, not whichever order the URL used.
    expect(forward.querySelector("h1")?.textContent).toBe(reverse.querySelector("h1")?.textContent);
  });

  it("calls notFound() for a repo pair with no comparison content file", async () => {
    await expect(
      ComparePage({ params: Promise.resolve({ a: "ollama", b: "supabase" }) }),
    ).rejects.toThrow();
  });

  it("calls notFound() for a slug that doesn't exist at all", async () => {
    await expect(
      ComparePage({ params: Promise.resolve({ a: "ollama", b: "does-not-exist" }) }),
    ).rejects.toThrow();
  });

  it("both URL orders point their canonical link at the same, content-file-order URL (issue #64 review finding)", async () => {
    const forward = await generateMetadata({ params: Promise.resolve({ a: "ollama", b: "vllm" }) });
    const reverse = await generateMetadata({ params: Promise.resolve({ a: "vllm", b: "ollama" }) });
    expect(forward.alternates?.canonical).toBe("/compare/ollama/vllm");
    expect(reverse.alternates?.canonical).toBe("/compare/ollama/vllm");
  });

  it("expands one repo's momentum signal panel independently of the other's, without misaligning the row (UX-2026-005 review finding)", async () => {
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "ollama", b: "vllm" }) }),
    );
    const table = container.querySelector("table")!;
    const momentumRow = within(table).getByText("Momentum").closest("tr")!;
    const buttons = within(momentumRow).getAllByRole("button");
    // Both ollama and vllm have enough real snapshot history for
    // computeHeat to return a result (not "Not enough data yet"), so this
    // row renders a real MomentumChip — and its interactive button — for
    // both repos, same as the real committed data/repogrove.db.
    expect(buttons).toHaveLength(2);
    const [firstButton, secondButton] = buttons;

    // useId() is scoped per component instance in the render tree, not a
    // global counter — two chips in the same row never collide.
    const firstPanelId = firstButton.getAttribute("aria-controls");
    const secondPanelId = secondButton.getAttribute("aria-controls");
    expect(firstPanelId).toBeTruthy();
    expect(secondPanelId).toBeTruthy();
    expect(firstPanelId).not.toBe(secondPanelId);

    fireEvent.click(firstButton);

    expect(firstButton).toHaveAttribute("aria-expanded", "true");
    expect(secondButton).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(firstPanelId!)).toBeVisible();
    expect(document.getElementById(secondPanelId!)).not.toBeVisible();

    // Review finding: MomentumChip's signal panel is independent,
    // uncoordinated `useState` per instance, so expanding only one side can
    // grow that cell taller than its sibling — `align-top` on every cell in
    // the row (not the browser's default vertical-centering) is what keeps
    // the label and both values reading as aligned while that's happening.
    const cells = momentumRow.querySelectorAll("th, td");
    expect(cells.length).toBeGreaterThan(0);
    cells.forEach((cell) => expect(cell.className).toContain("align-top"));
  });

  it("wraps the Category value instead of letting it widen the table past the mobile viewport (UX-2026-006)", async () => {
    // vLLM's category list (ai, llm, inference) is three items long — real
    // content on main today, not a synthetic worst case. At the project's
    // own 390px mobile screenshot viewport (playwright.config.ts), an
    // un-constrained three-item Category value widens this table (no
    // table-layout: fixed, so a cell avoids wrapping if it can) past the
    // viewport, and the overflow-x-auto wrapper's horizontal scroll has no
    // visual affordance — real text gets clipped at the viewport edge with
    // no hint there's more (confirmed against the real, correctly-fonted
    // compare-ollama-vllm__mobile-light.png screenshot, where vLLM's own
    // three-item category list — ai, llm, inference — is cut off mid-word).
    // Fixed by constraining the value's width below `sm` so it wraps onto a
    // second line instead (content stays visible and in the a11y tree at
    // every viewport) — not by hiding the row, which an earlier draft of
    // this fix did and an independent review correctly flagged: `hidden` is
    // `display:none`, removed from the accessibility tree too, so it would
    // have also hidden the fact from a screen reader on the same mobile
    // viewport where the bug was found, not just from sighted users.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "ollama", b: "vllm" }) }),
    );
    const table = container.querySelector("table")!;
    const categoryRow = within(table).getByText("Category").closest("tr")!;

    // The row itself is never hidden at any breakpoint — only its value
    // cells get a wrap-forcing max-width below `sm`.
    expect(categoryRow.className).not.toContain("hidden");

    const ollamaValue = within(categoryRow).getByText("ai, llm");
    const vllmValue = within(categoryRow).getByText("ai, llm, inference");
    for (const value of [ollamaValue, vllmValue]) {
      expect(value.className).toContain("max-w-32");
      expect(value.className).toContain("sm:max-w-none");
      expect(value.className).toContain("break-words");
    }

    // The four other FactRows are untouched by this fix.
    for (const label of ["Stars", "License", "Status", "Momentum"]) {
      const row = within(table).getByText(label).closest("tr")!;
      expect(row.className).not.toContain("hidden");
    }
  });

  it("never forces the table wider than the mobile content area via an unconditional min-width (UX-2026-006 re-fix)", async () => {
    // The Category value's own max-w-32 (asserted above) turned out NOT to
    // be the actual cause of the real clipping bug: the table's own
    // `min-w-[24rem]` (384px) applied at every viewport, including the
    // project's 342px-wide mobile content area (390px screenshot viewport
    // minus RootLayout's `main` max-w-3xl px-6), unconditionally forcing
    // this overflow-x-auto wrapper into a silent horizontal scroll on every
    // single comparison page view on mobile — regardless of Category's
    // content length, and regardless of that span's own wrap constraint.
    // Confirmed directly: real-screenshot re-review after UX-2026-006's
    // first fix merged found the CI `commit-screenshots` job produced zero
    // diff against the pre-fix screenshots (pixel-identical), and a
    // geometry reproduction of this exact table (real Tailwind-compiled
    // CSS, rendered in a real browser at the project's own 390px/768px/
    // 1440px viewports) confirmed the floor — not Category's unwrapped
    // text — was what pushed the table past the available width. Scoping
    // the floor to `sm:` and up (so it never applies below 640px) is what
    // this test guards: a regression back to an unqualified `min-w-[24rem]`
    // would silently reintroduce the exact same always-on mobile overflow.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "ollama", b: "vllm" }) }),
    );
    const table = container.querySelector("table")!;
    const classes = table.className.split(/\s+/);

    expect(classes).toContain("sm:min-w-[24rem]");
    expect(classes).not.toContain("min-w-[24rem]");
    // Belt-and-braces: no unqualified (applies-at-every-viewport) min-w-*
    // utility at all on this table, whatever value a future edit might pick.
    expect(classes.some((c) => /^min-w-/.test(c))).toBe(false);
  });
});
