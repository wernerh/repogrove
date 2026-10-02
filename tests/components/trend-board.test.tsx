import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrendBoard } from "@/components/TrendBoard";
import type { TrendItem } from "@/lib/trend-view";

function make(rank: number, category: string, totalStars: number): TrendItem {
  return {
    rank,
    slug: `repo-${rank}`,
    name: `Repo ${rank}`,
    github: `o/repo-${rank}`,
    category,
    blurb: `Blurb ${rank}`,
    reason: `+${100 - rank} stars in the last 5 days`,
    metric: `+${100 - rank}`,
    metricNote: "stars gained",
    value: 100 - rank,
    totalStars,
    days: 5,
  };
}

// The sidebar also links to the sibling page, so assertions look at repo links only.
const repoHrefs = () =>
  screen
    .getAllByRole("link")
    .map((l) => l.getAttribute("href"))
    .filter((href) => href?.startsWith("/repo/"));

const items = [
  make(1, "ai", 150_000),
  make(2, "ai", 50_000),
  make(3, "db", 10_000),
  make(4, "db", 5_000),
  make(5, "ai", 2_000),
];

describe("TrendBoard", () => {
  it("shows the empty message and no list when there are no items", () => {
    render(<TrendBoard mode="hot" items={[]} emptyMessage="Nothing yet." />);
    expect(screen.getByText("Nothing yet.")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("renders every repo once, in rank order, with the top three as cards", () => {
    render(<TrendBoard mode="hot" items={items} emptyMessage="—" />);
    const links = repoHrefs();
    expect(links).toEqual(items.map((i) => `/repo/${i.slug}`));
  });

  it("filters by category without renumbering ranks", () => {
    render(<TrendBoard mode="hot" items={items} emptyMessage="—" />);
    fireEvent.click(screen.getByRole("button", { name: "db" }));
    const links = repoHrefs();
    expect(links).toEqual(["/repo/repo-3", "/repo/repo-4"]);
    expect(screen.getByLabelText("Rank 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Rank 4")).toBeInTheDocument();
  });

  it("offers a size filter on Rising only", () => {
    const { rerender } = render(<TrendBoard mode="hot" items={items} emptyMessage="—" />);
    expect(screen.queryByRole("button", { name: "Under 20k" })).not.toBeInTheDocument();
    rerender(<TrendBoard mode="rising" items={items} emptyMessage="—" />);
    fireEvent.click(screen.getByRole("button", { name: "Under 20k" }));
    expect(repoHrefs()).toEqual([
      "/repo/repo-3",
      "/repo/repo-4",
      "/repo/repo-5",
    ]);
  });

  it("explains an empty filter combination instead of rendering nothing", () => {
    render(<TrendBoard mode="rising" items={items} emptyMessage="—" />);
    fireEvent.click(screen.getByRole("button", { name: "db" }));
    fireEvent.click(screen.getByRole("button", { name: "100k+" }));
    expect(screen.getByText(/nothing matches that combination/i)).toBeInTheDocument();
  });
});
