import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Isolated from tests/app/alternative-page.test.tsx (which exercises the
// page against the real committed content/alternatives/*.md, per this
// codebase's usual convention — see tests/app/trending-page-empty.test.tsx
// for the same isolation pattern) so this file alone can mock a synthetic
// Alternative whose "Open source" list actually resolves to a real repo.
// content/alternatives/notion.md's real Open source items (AppFlowy,
// Outline, AFFiNE, Anytype) don't resolve to any content/repos/*.md page
// today, so the real-content test can only cover the *unresolved* render
// branch — this file covers the resolved one (a real Link + star count,
// plus a sibling unresolved item's "Not yet profiled" label), verifying
// AlternativePage's own JSX, not just the resolveOpenSourceAlternatives
// helper in isolation.
vi.mock("@/lib/content", async () => {
  const actual = await vi.importActual<typeof import("@/lib/content")>("@/lib/content");
  return {
    ...actual,
    getAllAlternatives: () => [
      {
        slug: "synthetic",
        product: "Synthetic Product",
        category: "testing",
        openSource: ["Ollama", "Definitely Not A Repo"],
        free: [],
        commercial: ["Synthetic Commercial Co"],
        bestFit: [],
      },
    ],
    getAlternative: (slug: string) =>
      slug === "synthetic"
        ? {
            slug: "synthetic",
            product: "Synthetic Product",
            category: "testing",
            openSource: ["Ollama", "Definitely Not A Repo"],
            free: [],
            commercial: ["Synthetic Commercial Co"],
            bestFit: [],
          }
        : undefined,
  };
});
vi.mock("@/lib/snapshots", () => ({
  getGrowthSummaries: () =>
    new Map([["ollama/ollama", { currentStars: 24200, deltaStars: 100, days: 3, trackingSince: "2026-09-27" }]]),
}));

const { default: AlternativePage } = await import("@/app/alternative/[slug]/page");

describe("Alternative page (/alternative/[slug]) — resolved Open source item", () => {
  it("renders a resolved item as a real repo link with its star count, and an unresolved sibling as plain text", async () => {
    render(await AlternativePage({ params: Promise.resolve({ slug: "synthetic" }) }));

    const link = screen.getByRole("link", { name: "Ollama" });
    expect(link).toHaveAttribute("href", "/repo/ollama");
    expect(screen.getByText("24,200")).toBeInTheDocument();

    expect(screen.getByText("Definitely Not A Repo")).toBeInTheDocument();
    expect(screen.getByText("Not yet profiled")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Definitely Not A Repo" }),
    ).not.toBeInTheDocument();
  });
});
