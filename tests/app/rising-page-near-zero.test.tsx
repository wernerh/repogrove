import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Isolated (own vi.mock, hoisted, only applies in this file) so it can
// exercise a percent-growth value tiny enough to round to "0.0" at the
// page's 1-decimal display precision while still being genuinely nonzero
// (and, for the second case, genuinely negative) — a case the real
// committed data/repogrove.db doesn't currently produce for any tracked
// repo, but that `formatPercent` (src/app/rising/page.tsx) must still
// render as "±0.0%", not a sign-carrying "+0.0%"/"-0.0%" that would read
// like a negative-zero display glitch rather than "no meaningful change
// yet". `percentGrowth` is a float (unlike /trending's integer
// `deltaStars`), so this rounding edge case is specific to /rising.
vi.mock("@/lib/content", () => ({
  getAllRepos: () => [
    {
      slug: "barely-up",
      github: "someone/barely-up",
      name: "Barely Up",
      category: ["ai"],
      license: "MIT",
      status: "active",
      featured: false,
      groves: [],
      alternatives: { open_source: [], commercial: [] },
      body: "Grew by a hair.",
    },
    {
      slug: "barely-down",
      github: "someone/barely-down",
      name: "Barely Down",
      category: ["ai"],
      license: "MIT",
      status: "active",
      featured: false,
      groves: [],
      alternatives: { open_source: [], commercial: [] },
      body: "Shrank by a hair.",
    },
  ],
}));
vi.mock("@/lib/snapshots", () => ({
  getGrowthSummaries: () =>
    new Map([
      // baseline 100,000, +20 -> +0.02%, rounds to "0.0"
      ["someone/barely-up", { currentStars: 100_020, deltaStars: 20, days: 3, trackingSince: "2026-09-26" }],
      // baseline 100,000, -20 -> -0.02%, rounds to "0.0"
      ["someone/barely-down", { currentStars: 99_980, deltaStars: -20, days: 3, trackingSince: "2026-09-26" }],
    ]),
}));

const { default: RisingPage } = await import("@/app/rising/page");

describe("Rising page (/rising) — near-zero percent growth", () => {
  it("renders a genuinely tiny positive percentage as \"±0.0%\", not \"+0.0%\"", () => {
    render(<RisingPage />);
    const row = screen.getByRole("link", { name: "Barely Up" }).closest("li");
    expect(row).not.toBeNull();
    expect(within(row!).getByText(/^±0\.0% star growth/)).toBeInTheDocument();
    expect(within(row!).queryByText(/^\+0\.0% star growth/)).not.toBeInTheDocument();
  });

  it("renders a genuinely tiny negative percentage as \"±0.0%\", not \"-0.0%\"", () => {
    render(<RisingPage />);
    const row = screen.getByRole("link", { name: "Barely Down" }).closest("li");
    expect(row).not.toBeNull();
    expect(within(row!).getByText(/^±0\.0% star growth/)).toBeInTheDocument();
    expect(within(row!).queryByText(/^-0\.0% star growth/)).not.toBeInTheDocument();
  });
});
