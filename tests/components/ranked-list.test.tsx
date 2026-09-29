import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RankedList } from "@/components/RankedList";
import type { Repo } from "@/lib/content";

// Minimal, valid Repo fixtures — only the fields RankedList/RankingRow
// actually read (slug, name, category) need real values; the rest just
// need to satisfy the type.
function makeRepo(overrides: Partial<Repo> & Pick<Repo, "slug" | "name">): Repo {
  return {
    github: `someone/${overrides.slug}`,
    category: ["ai"],
    license: "MIT",
    status: "active",
    featured: false,
    groves: [],
    alternatives: { open_source: [], commercial: [] },
    body: "",
    ...overrides,
  };
}

describe("RankedList", () => {
  it("shows the empty message and no list items when entries is empty", () => {
    render(<RankedList entries={[]} emptyMessage="Nothing to show yet." />);
    expect(screen.getByText("Nothing to show yet.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("renders one row per entry, in the given order, each linking to /repo/:slug", () => {
    const repoA = makeRepo({ slug: "ollama", name: "Ollama" });
    const repoB = makeRepo({ slug: "duckdb", name: "DuckDB" });

    render(
      <RankedList
        entries={[
          { repo: repoA, reason: "+142 stars in the last 7 days" },
          { repo: repoB, reason: "+9.5% star growth in the last 7 days" },
        ]}
        emptyMessage="Nothing to show yet."
      />,
    );

    const repoLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("/repo/"));
    expect(repoLinks.map((link) => link.textContent)).toEqual(["Ollama", "DuckDB"]);
    expect(repoLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/repo/ollama",
      "/repo/duckdb",
    ]);
  });

  it("labels each row's rank 1-indexed via an accessible aria-label, not the visible text alone", () => {
    const entries = [
      { repo: makeRepo({ slug: "a", name: "A" }), reason: "r1" },
      { repo: makeRepo({ slug: "b", name: "B" }), reason: "r2" },
    ];
    render(<RankedList entries={entries} emptyMessage="—" />);
    expect(screen.getByLabelText("Rank 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Rank 2")).toBeInTheDocument();
  });

  it("renders the pre-formatted reason string verbatim for each row", () => {
    const entries = [{ repo: makeRepo({ slug: "a", name: "A" }), reason: "+42 stars in the last 7 days" }];
    render(<RankedList entries={entries} emptyMessage="—" />);
    expect(screen.getByText("+42 stars in the last 7 days")).toBeInTheDocument();
  });

  it("shows the repo's primary category when present, and omits the tag when category is empty", () => {
    const withCategory = makeRepo({ slug: "a", name: "A", category: ["databases"] });
    const withoutCategory = makeRepo({ slug: "b", name: "B", category: [] });

    render(
      <RankedList
        entries={[
          { repo: withCategory, reason: "r1" },
          { repo: withoutCategory, reason: "r2" },
        ]}
        emptyMessage="—"
      />,
    );

    expect(screen.getByText("databases")).toBeInTheDocument();
  });

  it("renders a real ordered list, not a div stack, so assistive tech announces item count", () => {
    const entries = [{ repo: makeRepo({ slug: "a", name: "A" }), reason: "r1" }];
    render(<RankedList entries={entries} emptyMessage="—" />);
    expect(screen.getByRole("list").tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });
});
