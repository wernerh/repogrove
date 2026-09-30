import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RepoPage, { generateStaticParams } from "@/app/repo/[slug]/page";

describe("Repo page (/repo/[slug])", () => {
  it("statically generates params for every repo in /content", async () => {
    const params = generateStaticParams();
    expect(params.map((p) => p.slug).sort()).toEqual([
      "coolify",
      "langchain",
      "lazygit",
      "neovim",
      "ollama",
      "supabase",
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

  it("renders the Alternatives table (spec §3-4), resolving vllm and leaving lm-studio/localai unresolved", async () => {
    // ollama.md's frontmatter: alternatives.open_source = [lm-studio, localai, vllm].
    // Only vllm has its own content/repos/vllm.md today — see
    // tests/components/alternatives-table.test.tsx for the component's own
    // unit coverage of resolved vs. unresolved rows.
    const element = await RepoPage({ params: Promise.resolve({ slug: "ollama" }) });
    render(element);

    expect(screen.getByRole("heading", { level: 2, name: "Alternatives" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "vLLM" })).toHaveAttribute("href", "/repo/vllm");
    expect(screen.getByText("lm-studio")).toBeInTheDocument();
    expect(screen.getByText("localai")).toBeInTheDocument();
    expect(screen.getAllByText("Not yet profiled")).toHaveLength(2);
    // The hand-authored "## Alternatives" placeholder prose from
    // content/repos/ollama.md is replaced, not duplicated alongside the
    // table — see src/lib/content.ts's splitOutSection.
    expect(screen.queryByText(/placeholder links/)).not.toBeInTheDocument();
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
    const element = await RepoPage({ params: Promise.resolve({ slug: "supabase" }) });
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
