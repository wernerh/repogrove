import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Isolated from tests/app/trending-page.test.tsx (which exercises the page
// against the real committed data/repogrove.db, per this codebase's usual
// convention) so this file alone can mock the data sources down to "no repo
// has enough history yet" — a real state before the Phase 2 gate is met,
// but one the current committed db can no longer produce now that the gate
// has passed. vi.mock is hoisted, so it only ever applies within this file.
vi.mock("@/lib/content", () => ({
  getAllRepos: () => [
    {
      slug: "brand-new",
      github: "someone/brand-new",
      name: "Brand New",
      category: ["ai"],
      license: "MIT",
      status: "active",
      featured: false,
      groves: [],
      alternatives: { open_source: [], commercial: [] },
      body: "Just added.",
    },
  ],
}));
vi.mock("@/lib/snapshots", () => ({
  // Only one snapshot exists yet for the one repo above — days === 0, the
  // same "not enough history for a delta yet" state getGrowthSummary
  // documents, which rankByAbsoluteGrowth excludes from the ranking.
  getGrowthSummaries: () =>
    new Map([["someone/brand-new", { currentStars: 5, deltaStars: 0, days: 0, trackingSince: "2026-09-29" }]]),
}));

const { default: TrendingPage } = await import("@/app/trending/page");

describe("Trending page (/trending) — empty state", () => {
  it("shows a graceful message instead of an empty list when no repo has enough history yet", () => {
    render(<TrendingPage />);
    expect(screen.getByText(/check back once tracking has run a while longer/i)).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
