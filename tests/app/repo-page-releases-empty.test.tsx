import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Isolated from tests/app/repo-page.test.tsx (which exercises the page against the
// real committed data/repogrove.db) — same isolation pattern as
// tests/app/repo-page-releases.test.tsx (the populated-state sibling of this file) and
// tests/app/trending-page-empty.test.tsx. Deliberately mocks @/lib/releases to an empty
// result rather than asserting on the real db's current release count: the real
// data/repogrove.db is refreshed daily by the ingestion job (scripts/ingestion/
// fetch-snapshots.ts) and every tracked repo now has real releases on record (as of
// the 2026-09-30 ingestion run that first populated repository_releases post-#72), so
// a test asserting "no releases" against the real db would start failing the moment
// ingestion actually ran — which is exactly what happened to this test's original,
// real-db-coupled version in tests/app/repo-page.test.tsx (see TECH-DEBT.md).
vi.mock("@/lib/releases", () => ({
  getRecentReleases: () => [],
}));

const { default: RepoPage } = await import("@/app/repo/[slug]/page");

describe("Repo page (/repo/[slug]) — empty 'Latest' releases section (issue #72)", () => {
  it("shows an explicit empty state when a repo has no releases on record", async () => {
    const element = await RepoPage({ params: Promise.resolve({ slug: "ollama" }) });
    render(element);

    expect(screen.getByRole("heading", { level: 2, name: "Latest" })).toBeInTheDocument();
    expect(screen.getByText("No recent releases.")).toBeInTheDocument();
  });
});
