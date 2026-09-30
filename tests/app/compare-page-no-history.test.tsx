import { render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Isolated from tests/app/compare-page.test.tsx (which exercises the page
// against the real committed data/repogrove.db, per this codebase's usual
// convention — see tests/app/rising-page-empty.test.tsx and
// tests/app/repo-page-releases-empty.test.tsx for the same pattern) so this
// file alone can mock @/lib/snapshots down to "neither repo has any
// ingested history yet" — a real state a newly-added content/repos/*.md
// file is in until the next scheduled ingestion run, but not one the
// current real db can be relied on to keep producing (Appwrite happens to
// be in this state today only because it was added after the last
// ingestion run; that's temporary). vi.mock is hoisted, so it only ever
// applies within this file.
vi.mock("@/lib/snapshots", async (importOriginal) => {
  // computeHeat (src/lib/heat.ts) imports getGrowthSummary/getGrowthBaseline
  // from this same module directly (not via getGrowthSummaries/
  // getSnapshotHistories), so a full replacement — rather than a partial
  // one built on importOriginal — would break it with a "no export" error
  // even though this test never calls those two functions itself.
  const actual = await importOriginal<typeof import("@/lib/snapshots")>();
  return {
    ...actual,
    getGrowthSummaries: () => new Map(),
    getSnapshotHistories: () => new Map(),
  };
});

const { default: ComparePage } = await import("@/app/compare/[a]/[b]/page");

describe("Compare page (/compare/[a]/[b]) — no ingested history for either repo", () => {
  it("degrades Stars to '—' and Momentum to 'Not enough data yet' for both repos, without crashing", async () => {
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "appwrite", b: "supabase" }) }),
    );

    const table = container.querySelector("table")!;
    const starsRow = within(table).getByText("Stars").closest("tr")!;
    const momentumRow = within(table).getByText("Momentum").closest("tr")!;

    // Both value cells (one per repo) show the "no data" fallback, not a
    // thrown error or a fabricated number/label.
    expect(within(starsRow).getAllByText("—")).toHaveLength(2);
    expect(within(momentumRow).getAllByText("Not enough data yet")).toHaveLength(2);
    expect(within(momentumRow).queryAllByRole("button")).toHaveLength(0);
  });
});
