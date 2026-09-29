import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TrendingPage, { metadata } from "@/app/trending/page";
import { getAllRepos } from "@/lib/content";
import { getGrowthSummary, getSnapshotHistory } from "@/lib/snapshots";

describe("Trending page (/trending)", () => {
  it("ranks every tracked repo by absolute star growth, from the committed snapshot database (issue #19)", () => {
    // data/repogrove.db currently holds 3 calendar days of history for all 5
    // example repos (the Phase 2 gate docs/WORKPLAN.md requires before this
    // page is meaningful) — computed here from the same real committed data
    // the page itself reads, the same pattern tests/app/home.test.tsx uses
    // for its category-tag assertions, rather than hard-coding numbers that
    // change with every daily ingestion commit.
    const expectedOrder = getAllRepos()
      .map((repo) => ({ repo, summary: getGrowthSummary(getSnapshotHistory(repo.github)) }))
      .filter((entry): entry is { repo: (typeof entry)["repo"]; summary: NonNullable<typeof entry.summary> } =>
        entry.summary !== null && entry.summary.days > 0,
      )
      .sort((a, b) => b.summary.deltaStars - a.summary.deltaStars)
      .map((entry) => entry.repo);

    expect(expectedOrder.length).toBeGreaterThan(0); // sanity: the gate really is met

    render(<TrendingPage />);

    const repoLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("/repo/"));
    expect(repoLinks.map((link) => link.textContent)).toEqual(expectedOrder.map((repo) => repo.name));
    expect(repoLinks.map((link) => link.getAttribute("href"))).toEqual(
      expectedOrder.map((repo) => `/repo/${repo.slug}`),
    );
  });

  it("shows a computed, non-fabricated reason line with the real star delta and day span", () => {
    render(<TrendingPage />);
    const repos = getAllRepos();
    const top = repos
      .map((repo) => ({ repo, summary: getGrowthSummary(getSnapshotHistory(repo.github)) }))
      .filter((e) => e.summary && e.summary.days > 0)
      .sort((a, b) => b.summary!.deltaStars - a.summary!.deltaStars)[0];

    // Mirrors formatDelta's three-way branching (src/app/trending/page.tsx)
    // exactly, rather than a two-way +/- guess — a delta of exactly 0 renders
    // "±0", not "0", and a wrong guess here would only ever be caught if a
    // repo's growth happened to land on exactly 0 the day this test runs.
    const delta = top.summary!.deltaStars;
    const expectedPrefix =
      delta > 0 ? `+${new Intl.NumberFormat("en-US").format(delta)}` : delta < 0 ? `${delta}` : "±0";
    expect(
      screen.getByText(
        (content, element) =>
          element?.tagName === "SPAN" && content.startsWith(`${expectedPrefix} stars in the last`),
      ),
    ).toBeInTheDocument();
  });

  it("shows the primary category for each ranked repo", () => {
    render(<TrendingPage />);
    // "ai" is the primary category for 3 of the 5 example repos.
    expect(screen.getAllByText("ai").length).toBeGreaterThan(0);
  });

  it("has a heading naming the page", () => {
    render(<TrendingPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/hot right now/i);
  });

  it("has a real <title>/<meta description>, not the root layout's generic default (issue #64)", () => {
    expect(metadata.title).toBeTruthy();
    expect(metadata.title).not.toBe("RepoGrove");
    expect(typeof metadata.description).toBe("string");
    expect((metadata.description as string).length).toBeGreaterThan(0);
  });
});
