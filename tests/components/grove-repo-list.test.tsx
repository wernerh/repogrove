import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GroveRepoList from "@/components/GroveRepoList";
import { makeRow } from "../lib/grove-fixtures";

const rows = [
  makeRow({
    slug: "neovim",
    owner: "neovim",
    repoName: "neovim",
    github: "neovim/neovim",
    stars: 100_000,
    deltaStars: 40,
    days: 2,
    categories: ["devtools", "editor", "terminal"],
    description: "A hyperextensible modal editor.",
  }),
  makeRow({
    slug: "zed",
    owner: "zed-industries",
    repoName: "zed",
    github: "zed-industries/zed",
    stars: 90_000,
    deltaStars: 400,
    days: 2,
    categories: ["devtools", "editor"],
    description: "A GPU-accelerated editor.",
  }),
  makeRow({
    slug: "lazygit",
    owner: "jesseduffield",
    repoName: "lazygit",
    github: "jesseduffield/lazygit",
    stars: 80_000,
    deltaStars: 20,
    days: 2,
    categories: ["devtools", "git", "terminal"],
    description: "A simple terminal UI for git.",
    alternatives: ["Tig", "GitKraken"],
  }),
  makeRow({
    slug: "tig",
    owner: "jonas",
    repoName: "tig",
    github: "jonas/tig",
    stars: 13_000,
    deltaStars: 2,
    days: 2,
    categories: ["devtools", "git", "terminal"],
    description: "A text-mode git interface.",
  }),
];

/** Repo names in the order they currently appear in the list. */
function listedNames(): string[] {
  return screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent ?? "");
}

describe("GroveRepoList", () => {
  it("renders every repo, most-starred first, each linking to its repo page", () => {
    render(<GroveRepoList rows={rows} groveName="Developer Tools" />);
    expect(listedNames()).toEqual([
      "neovim / neovim",
      "zed-industries / zed",
      "jesseduffield / lazygit",
      "jonas / tig",
    ]);
    expect(screen.getByRole("link", { name: "neovim / neovim" })).toHaveAttribute("href", "/repo/neovim");
  });

  it("shows stars, status, license, alternatives and the growth delta from real row data", () => {
    render(<GroveRepoList rows={rows} groveName="Developer Tools" />);
    const card = screen.getByRole("link", { name: "jesseduffield / lazygit" }).closest("li")!;
    expect(within(card).getByLabelText("80,000 stars")).toBeInTheDocument();
    expect(within(card).getByText("Active")).toBeInTheDocument();
    expect(within(card).getByText("MIT")).toBeInTheDocument();
    expect(within(card).getByText("Tig")).toBeInTheDocument();
    expect(within(card).getByText("GitKraken")).toBeInTheDocument();
    expect(within(card).getByText("+20 / 2d")).toBeInTheDocument();
  });

  it("keeps each row a single link (stretched-link pattern, no nested interactives)", () => {
    render(<GroveRepoList rows={rows} groveName="Developer Tools" />);
    const items = screen.getAllByRole("listitem").filter((li) => li.querySelector("h3"));
    expect(items).toHaveLength(4);
    for (const item of items) expect(within(item).getAllByRole("link")).toHaveLength(1);
  });

  it("omits stars and the trend for an untracked repo instead of showing zeros", () => {
    const untracked = makeRow({
      slug: "new",
      repoName: "new",
      github: "acme/new",
      stars: null,
      deltaStars: null,
      days: 0,
      trend: [],
    });
    render(<GroveRepoList rows={[untracked]} groveName="Developer Tools" />);
    expect(screen.queryByLabelText(/stars$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/ \d+d/)).not.toBeInTheDocument();
  });

  it("offers category tabs derived from the rows and filters by them", () => {
    render(<GroveRepoList rows={rows} groveName="Developer Tools" />);
    const group = screen.getByRole("group", { name: "Filter by category" });
    expect(within(group).getByRole("button", { name: /^All/ })).toHaveAttribute("aria-pressed", "true");
    // `devtools` is on every repo, so it must not be a tab.
    expect(within(group).queryByRole("button", { name: /Devtools/ })).not.toBeInTheDocument();

    fireEvent.click(within(group).getByRole("button", { name: /^Git/ }));
    expect(listedNames()).toEqual(["jesseduffield / lazygit", "jonas / tig"]);
    expect(within(group).getByRole("button", { name: /^Git/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("filters by the typed query and announces the new count", () => {
    render(<GroveRepoList rows={rows} groveName="Developer Tools" />);
    fireEvent.change(screen.getByRole("searchbox", { name: /Filter repositories in Developer Tools/ }), {
      target: { value: "gpu" },
    });
    expect(listedNames()).toEqual(["zed-industries / zed"]);
    expect(screen.getByText("Showing 1–1 of 1 repository")).toBeInTheDocument();
  });

  it("shows an empty state with a working Clear filters button when nothing matches", () => {
    render(<GroveRepoList rows={rows} groveName="Developer Tools" />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz-no-match" } });
    expect(screen.getByText(/No repositories match/)).toBeInTheDocument();
    expect(screen.getByText("Showing 0–0 of 0 repositories")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(listedNames()).toHaveLength(4);
  });

  it("sorts by star growth and by name", () => {
    render(<GroveRepoList rows={rows} groveName="Developer Tools" />);
    const sort = screen.getByLabelText("Sort by");

    fireEvent.change(sort, { target: { value: "growth" } });
    expect(listedNames()[0]).toBe("zed-industries / zed");

    fireEvent.change(sort, { target: { value: "name" } });
    expect(listedNames()).toEqual([
      "jesseduffield / lazygit",
      "jonas / tig",
      "neovim / neovim",
      "zed-industries / zed",
    ]);
  });

  describe("pagination", () => {
    const many = Array.from({ length: 14 }, (_, i) =>
      makeRow({
        slug: `repo-${String(i).padStart(2, "0")}`,
        repoName: `repo-${String(i).padStart(2, "0")}`,
        stars: 1000 - i,
      }),
    );

    it("shows 6 per page by default with a range summary and a current-page marker", () => {
      render(<GroveRepoList rows={many} groveName="Big" />);
      expect(listedNames()).toHaveLength(6);
      expect(screen.getByText("Showing 1–6 of 14 repositories")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    });

    it("moves between pages and disables Next on the last page", () => {
      render(<GroveRepoList rows={many} groveName="Big" />);
      fireEvent.click(screen.getByRole("button", { name: "Next page" }));
      expect(screen.getByText("Showing 7–12 of 14 repositories")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Page 3" }));
      expect(screen.getByText("Showing 13–14 of 14 repositories")).toBeInTheDocument();
      expect(listedNames()).toHaveLength(2);
      expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    });

    it("changes page size and returns to page 1", () => {
      render(<GroveRepoList rows={many} groveName="Big" />);
      fireEvent.click(screen.getByRole("button", { name: "Page 2" }));
      fireEvent.click(screen.getByRole("button", { name: "12" }));
      expect(screen.getByText("Showing 1–12 of 14 repositories")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "12" })).toHaveAttribute("aria-pressed", "true");
    });

    it("returns to page 1 when a filter narrows the results", () => {
      render(<GroveRepoList rows={many} groveName="Big" />);
      fireEvent.click(screen.getByRole("button", { name: "Page 3" }));
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "repo-0" } });
      expect(screen.getByText(/Showing 1–/)).toBeInTheDocument();
    });

    it("hides the pager when everything fits on one page", () => {
      render(<GroveRepoList rows={rows} groveName="Developer Tools" />);
      expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
    });
  });
});
