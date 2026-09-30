import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Isolated from tests/app/repo-page.test.tsx (which exercises the page against the
// real committed data/repogrove.db, per this codebase's usual convention — see
// tests/app/trending-page-empty.test.tsx for the same isolation pattern) so this file
// alone can mock @/lib/releases down to a populated state. The real db has no
// repository_releases rows yet (no ingestion run has fetched them), so the real-content
// test can only cover the empty-state render branch; this file covers the populated
// one — a real link + formatted date, and a name-less release falling back to its tag.
vi.mock("@/lib/releases", () => ({
  getRecentReleases: () => [
    {
      github: "ollama/ollama",
      tagName: "v1.8.0",
      name: "v1.8.0",
      htmlUrl: "https://github.com/ollama/ollama/releases/tag/v1.8.0",
      publishedAt: "2026-09-20T00:00:00.000Z",
    },
    {
      github: "ollama/ollama",
      tagName: "v1.7.0",
      name: null,
      htmlUrl: "https://github.com/ollama/ollama/releases/tag/v1.7.0",
      publishedAt: "2026-09-01T00:00:00.000Z",
    },
  ],
}));

const { default: RepoPage } = await import("@/app/repo/[slug]/page");

describe("Repo page (/repo/[slug]) — populated 'Latest' releases section (issue #72)", () => {
  it("renders each release as a link to GitHub with a formatted publish date", async () => {
    const element = await RepoPage({ params: Promise.resolve({ slug: "ollama" }) });
    render(element);

    expect(screen.getByRole("heading", { level: 2, name: "Latest" })).toBeInTheDocument();

    const namedLink = screen.getByRole("link", { name: "v1.8.0" });
    expect(namedLink).toHaveAttribute("href", "https://github.com/ollama/ollama/releases/tag/v1.8.0");
    expect(screen.getByText("Sep 20, 2026")).toBeInTheDocument();

    // Falls back to the tag name when GitHub's release has no name — same "no
    // fabricated data" convention the rest of this page already follows.
    const unnamedLink = screen.getByRole("link", { name: "v1.7.0" });
    expect(unnamedLink).toHaveAttribute("href", "https://github.com/ollama/ollama/releases/tag/v1.7.0");
    expect(screen.getByText("Sep 1, 2026")).toBeInTheDocument();

    expect(screen.queryByText("No recent releases.")).not.toBeInTheDocument();
  });
});
