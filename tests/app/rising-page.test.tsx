import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RisingPage from "@/app/rising/page";
import { getAllRepos } from "@/lib/content";
import { getGrowthSummary, getSnapshotHistory } from "@/lib/snapshots";

describe("Rising page (/rising)", () => {
  it("ranks every tracked repo by relative (percent) star growth, from the committed snapshot database (issue #20)", () => {
    // data/repogrove.db currently holds 3 calendar days of history for all 5
    // example repos (the Phase 2 gate docs/WORKPLAN.md requires before this
    // page is meaningful) — computed here from the same real committed data
    // the page itself reads, the same pattern tests/app/trending-page.test.tsx
    // uses, rather than hard-coding numbers that change with every daily
    // ingestion commit.
    const expectedOrder = getAllRepos()
      .map((repo) => ({ repo, summary: getGrowthSummary(getSnapshotHistory(repo.github)) }))
      .filter((entry): entry is { repo: (typeof entry)["repo"]; summary: NonNullable<typeof entry.summary> } =>
        entry.summary !== null && entry.summary.days > 0,
      )
      .map((entry) => ({
        repo: entry.repo,
        percentGrowth:
          (entry.summary.deltaStars / (entry.summary.currentStars - entry.summary.deltaStars)) * 100,
      }))
      .sort((a, b) => b.percentGrowth - a.percentGrowth)
      .map((entry) => entry.repo);

    expect(expectedOrder.length).toBeGreaterThan(0); // sanity: the gate really is met

    render(<RisingPage />);

    const repoLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("/repo/"));
    expect(repoLinks.map((link) => link.textContent)).toEqual(expectedOrder.map((repo) => repo.name));
    expect(repoLinks.map((link) => link.getAttribute("href"))).toEqual(
      expectedOrder.map((repo) => `/repo/${repo.slug}`),
    );
  });

  it("shows a computed, non-fabricated percent-growth reason line", () => {
    render(<RisingPage />);
    const repos = getAllRepos();
    const top = repos
      .map((repo) => ({ repo, summary: getGrowthSummary(getSnapshotHistory(repo.github)) }))
      .filter((e) => e.summary && e.summary.days > 0)
      .map((e) => ({
        repo: e.repo,
        summary: e.summary!,
        percentGrowth: (e.summary!.deltaStars / (e.summary!.currentStars - e.summary!.deltaStars)) * 100,
      }))
      .sort((a, b) => b.percentGrowth - a.percentGrowth)[0];

    // Mirrors formatPercent's three-way branching (src/app/rising/page.tsx)
    // exactly — a delta of exactly 0% renders "±0.0%", not "0.0%".
    const percent = top.percentGrowth;
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(percent);
    const expectedPrefix = percent > 0 ? `+${formatted}%` : percent < 0 ? `${formatted}%` : "±0.0%";

    // Scoped to the top repo's own row: at 1-decimal precision two repos
    // can round to the same displayed percentage (e.g. both "+0.1%") while
    // still being correctly ordered by their real, unrounded values — an
    // unscoped text query would then match more than one row and fail on
    // that ambiguity alone, not a real bug. Finding the row via the repo's
    // own link (already proven correctly ordered by the test above) keeps
    // this assertion about one specific, known row.
    const link = screen.getByRole("link", { name: top.repo.name });
    const row = link.closest("li");
    expect(row).not.toBeNull();
    expect(
      within(row!).getByText(
        (content, element) =>
          element?.tagName === "SPAN" && content.startsWith(`${expectedPrefix} star growth in the last`),
      ),
    ).toBeInTheDocument();
  });

  it("shows the primary category for each ranked repo", () => {
    render(<RisingPage />);
    // "ai" is the primary category for 3 of the 5 example repos.
    expect(screen.getAllByText("ai").length).toBeGreaterThan(0);
  });

  it("has a heading naming the page", () => {
    render(<RisingPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/rising/i);
  });
});
