import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GrovePage, { generateStaticParams } from "@/app/grove/[slug]/page";
import { getReposInGrove } from "@/lib/content";

async function renderGrove(slug: string) {
  render(await GrovePage({ params: Promise.resolve({ slug }) }));
}

describe("Grove page (/grove/[slug])", () => {
  it("statically generates params for every Grove in /content", async () => {
    const params = generateStaticParams();
    expect(params.map((p) => p.slug).sort()).toEqual([
      "ai",
      "databases",
      "developer-tools",
      "self-hosted",
    ]);
  });

  it("renders /grove/ai's header from content/groves/ai.md, not a hardcoded string", async () => {
    await renderGrove("ai");

    expect(screen.getByRole("heading", { level: 1, name: "AI" })).toBeInTheDocument();
    expect(
      screen.getByText(/Open-source tools for running, building, and integrating AI models\./),
    ).toBeInTheDocument();
  });

  it("lists the Grove's member repos from their own `groves:` frontmatter, linking to each repo page", async () => {
    await renderGrove("ai");

    // Ollama is `groves: [ai]` in content/repos/ollama.md. It can legitimately
    // appear twice (list row + Trendspotting), so check every link to it.
    const ollamaLinks = screen.getAllByRole("link", { name: "ollama / ollama" });
    for (const link of ollamaLinks) expect(link).toHaveAttribute("href", "/repo/ollama");
    expect(ollamaLinks.some((link) => link.closest("h3"))).toBe(true);
    const expected = getReposInGrove("ai").length;
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(Math.min(expected, 6));
  });

  it("renders /grove/databases from content/groves/databases.md, with all four repos", async () => {
    await renderGrove("databases");

    expect(screen.getByRole("heading", { level: 1, name: "Databases" })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Open-source databases worth knowing about, from embedded analytics engines to distributed OLAP clusters\./,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "duckdb / duckdb" })).toHaveAttribute("href", "/repo/duckdb");
    expect(screen.getByRole("link", { name: "ClickHouse / ClickHouse" })).toHaveAttribute(
      "href",
      "/repo/clickhouse",
    );
    expect(screen.getByRole("link", { name: "sqlite / sqlite" })).toHaveAttribute("href", "/repo/sqlite");
    expect(screen.getByRole("link", { name: "postgres / postgres" })).toHaveAttribute(
      "href",
      "/repo/postgresql",
    );
  });

  it("shows a breadcrumb back to the homepage's Groves section", async () => {
    await renderGrove("developer-tools");
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumbs).getByRole("link", { name: "Groves" })).toHaveAttribute("href", "/#groves");
    expect(within(crumbs).getByText("Developer Tools")).toHaveAttribute("aria-current", "page");
  });

  it("shows the stat strip with real aggregates for /grove/developer-tools", async () => {
    await renderGrove("developer-tools");

    const total = screen.getByText("Total repositories").closest("div")!;
    expect(within(total).getByText(String(getReposInGrove("developer-tools").length))).toBeInTheDocument();
    expect(screen.getByText("Collective stars")).toBeInTheDocument();
    expect(screen.getByText("Median star gain")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /\d+ active/ })).toBeInTheDocument();
  });

  it("links Related Groves from the Grove's own `related_groves` frontmatter, with real repo counts", async () => {
    await renderGrove("developer-tools");

    const sidebar = screen.getByRole("complementary", { name: "Grove highlights" });
    const related = within(sidebar).getByRole("heading", { name: "Related Groves" }).closest("section")!;
    expect(within(related).getByRole("link", { name: "AI" })).toHaveAttribute("href", "/grove/ai");
    expect(within(related).getByRole("link", { name: "Self-Hosted" })).toHaveAttribute(
      "href",
      "/grove/self-hosted",
    );
    expect(within(related).getByText(`${getReposInGrove("ai").length} repos`)).toBeInTheDocument();
  });

  it("includes the newsletter signup in the sidebar", async () => {
    await renderGrove("ai");
    const sidebar = screen.getByRole("complementary", { name: "Grove highlights" });
    expect(within(sidebar).getByRole("heading", { name: "Grove Digest" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("form", { name: "Newsletter signup" })).toBeInTheDocument();
  });

  it("calls notFound() for a Grove slug that doesn't exist in /content", async () => {
    await expect(
      GrovePage({ params: Promise.resolve({ slug: "does-not-exist" }) }),
    ).rejects.toThrow();
  });
});
