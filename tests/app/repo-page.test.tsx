import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RepoPage, { generateStaticParams } from "@/app/repo/[slug]/page";

describe("Repo page (/repo/[slug])", () => {
  it("statically generates params for every repo in /content", async () => {
    const params = generateStaticParams();
    expect(params.map((p) => p.slug).sort()).toEqual([
      "coolify",
      "langchain",
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
    // Status renders as the StatusChip component (icon + text label as
    // separate nodes, icon marked aria-hidden) — see
    // tests/components/status-chip.test.tsx for its own unit coverage.
    // Scoped to the page's own metadata <dl>: ollama's Alternatives table
    // (see tests/components/alternatives-table.test.tsx) also renders a
    // StatusChip for its resolved "vllm" row, which is itself Active too —
    // an unscoped query would find two matches.
    const metadata = container.querySelector("dl");
    expect(metadata).not.toBeNull();
    expect(within(metadata!).getByText("Active")).toBeInTheDocument();
    expect(within(metadata!).getByText("🟢")).toBeInTheDocument();
    expect(screen.getByText(/📜 MIT/)).toBeInTheDocument();
    expect(screen.getByText(/Ollama packages open-weight LLMs/)).toBeInTheDocument();
    // The body's own "## Related Grove" section links back to the Grove.
    expect(screen.getByRole("link", { name: "AI" })).toHaveAttribute("href", "/grove/ai");
  });

  it("renders the star-growth chart from the committed snapshot database (issue #18)", async () => {
    // data/repogrove.db currently holds exactly one day of history per repo
    // (2026-09-27) — see PROJECT_STATE.md — so this exercises the
    // single-snapshot graceful-degradation state, not the full chart. Once
    // the daily ingestion job accumulates a second day, this should start
    // seeing a real delta instead; either way the page must not crash.
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
});
