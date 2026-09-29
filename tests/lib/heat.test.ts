import { describe, expect, it } from "vitest";
import { computeHeat, labelForGrowthRate, RISING_THRESHOLD_PCT_PER_DAY, ACTIVE_THRESHOLD_PCT_PER_DAY } from "@/lib/heat";
import type { SnapshotRow } from "@/lib/snapshots";

function row(overrides: Partial<SnapshotRow> = {}): SnapshotRow {
  return {
    github: "ollama/ollama",
    capturedOn: "2026-09-27",
    stars: 1000,
    forks: 100,
    openIssues: 50,
    watchers: 1000,
    source: "github-api",
    fetchedAt: "2026-09-27T12:00:00.000Z",
    contributors: null,
    ...overrides,
  };
}

describe("labelForGrowthRate", () => {
  it("labels a rate at or above the rising threshold as rising", () => {
    expect(labelForGrowthRate(RISING_THRESHOLD_PCT_PER_DAY)).toBe("rising");
    expect(labelForGrowthRate(RISING_THRESHOLD_PCT_PER_DAY + 1)).toBe("rising");
  });

  it("labels a rate at or above the active threshold, below rising, as active", () => {
    expect(labelForGrowthRate(ACTIVE_THRESHOLD_PCT_PER_DAY)).toBe("active");
    expect(labelForGrowthRate(RISING_THRESHOLD_PCT_PER_DAY - 0.001)).toBe("active");
  });

  it("labels a positive rate below the active threshold as slowing", () => {
    expect(labelForGrowthRate(0.001)).toBe("slowing");
    expect(labelForGrowthRate(ACTIVE_THRESHOLD_PCT_PER_DAY - 0.001)).toBe("slowing");
  });

  it("labels a zero or negative rate as dormant", () => {
    expect(labelForGrowthRate(0)).toBe("dormant");
    expect(labelForGrowthRate(-1)).toBe("dormant");
  });
});

describe("computeHeat", () => {
  it("returns null for a repo with no snapshot history at all", () => {
    expect(computeHeat([])).toBeNull();
  });

  it("returns null for a repo with only one snapshot (not enough history for a rate yet)", () => {
    expect(computeHeat([row({ capturedOn: "2026-09-27" })])).toBeNull();
  });

  it("returns null for a zero/negative-baseline repo (would divide to Infinity/NaN)", () => {
    // baseline = currentStars - deltaStars = 0 here (0 -> 10 over the window)
    const history = [
      row({ capturedOn: "2026-09-27", stars: 0 }),
      row({ capturedOn: "2026-09-28", stars: 10 }),
    ];
    expect(computeHeat(history)).toBeNull();
  });

  it("computes a real Dormant result for flat/negative growth rather than omitting it", () => {
    const history = [
      row({ capturedOn: "2026-09-27", stars: 1000, openIssues: 50 }),
      row({ capturedOn: "2026-09-29", stars: 990, openIssues: 55 }),
    ];
    const heat = computeHeat(history);
    expect(heat).not.toBeNull();
    expect(heat!.label).toBe("dormant");
    expect(heat!.starGrowthPercentPerDay).toBeLessThan(0);
  });

  it("labels a high relative daily growth rate as rising", () => {
    // +5% over 2 days -> 2.5%/day, well above the rising threshold
    const history = [
      row({ capturedOn: "2026-09-27", stars: 1000 }),
      row({ capturedOn: "2026-09-29", stars: 1050 }),
    ];
    const heat = computeHeat(history);
    expect(heat!.label).toBe("rising");
    expect(heat!.days).toBe(2);
  });

  it("labels vllm-project/vllm's real ~0.064%/day rate as rising (this ADR's real-data example)", () => {
    const history = [
      row({ capturedOn: "2026-09-27", stars: 92797 }),
      row({ capturedOn: "2026-09-29", stars: 92916 }),
    ];
    const heat = computeHeat(history);
    expect(heat!.label).toBe("rising");
  });

  it("labels ollama/ollama's real ~0.024%/day rate as active (this ADR's real-data example)", () => {
    const history = [
      row({ capturedOn: "2026-09-27", stars: 181813 }),
      row({ capturedOn: "2026-09-29", stars: 181902 }),
    ];
    const heat = computeHeat(history);
    expect(heat!.label).toBe("active");
  });

  it("reports the open-issues signal as available with a real delta", () => {
    const history = [
      row({ capturedOn: "2026-09-27", stars: 1000, openIssues: 40 }),
      row({ capturedOn: "2026-09-29", stars: 1010, openIssues: 55 }),
    ];
    const heat = computeHeat(history)!;
    const openIssues = heat.signals.find((s) => s.key === "open-issues")!;
    expect(openIssues.available).toBe(true);
    expect(openIssues.detail).toContain("+15");
  });

  it("reports the contributor-growth signal as unavailable when either reading is null", () => {
    const history = [
      row({ capturedOn: "2026-09-27", stars: 1000, contributors: null }),
      row({ capturedOn: "2026-09-29", stars: 1010, contributors: 500 }),
    ];
    const heat = computeHeat(history)!;
    const contributors = heat.signals.find((s) => s.key === "contributor-growth")!;
    expect(contributors.available).toBe(false);
    expect(contributors.detail).toBe("not enough data yet");
  });

  it("reports the contributor-growth signal as available with a real delta once both readings exist", () => {
    const history = [
      row({ capturedOn: "2026-09-27", stars: 1000, contributors: 480 }),
      row({ capturedOn: "2026-09-29", stars: 1010, contributors: 500 }),
    ];
    const heat = computeHeat(history)!;
    const contributors = heat.signals.find((s) => s.key === "contributor-growth")!;
    expect(contributors.available).toBe(true);
    expect(contributors.detail).toContain("+20");
  });

  it("keeps the open-issues/contributor signals on the same 30-day-windowed baseline as the star-growth rate", () => {
    // Regression test: an earlier version of computeHeat used history[0]
    // (the absolute-earliest snapshot ever) for the open-issues/contributor
    // deltas while the star-growth rate used getGrowthSummary's 30-day-
    // windowed baseline — the two silently agree when history spans <30
    // days (every other test in this file), but diverge once it doesn't.
    // This repo has 40 days of history; the correct baseline is day 10
    // (30 days before day 40), not day 0.
    const history: SnapshotRow[] = [];
    const start = Date.UTC(2026, 0, 1); // 2026-01-01, real calendar-day arithmetic below (avoids manual month math)
    for (let day = 0; day <= 40; day++) {
      const capturedOn = new Date(start + day * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      history.push(
        row({
          capturedOn,
          stars: 1000 + day, // steady, unrelated to the point being tested
          openIssues: day, // openIssues == day number, so the delta directly reveals which baseline was used
          contributors: 100 + day,
        }),
      );
    }
    const heat = computeHeat(history)!;
    const openIssues = heat.signals.find((s) => s.key === "open-issues")!;
    // Correct (windowed) baseline is day 10 -> delta = 40 - 10 = 30.
    // The bug this regresses against would compute delta = 40 - 0 = 40.
    expect(openIssues.detail).toContain("+30");
    const contributors = heat.signals.find((s) => s.key === "contributor-growth")!;
    expect(contributors.detail).toContain("+30");
  });

  it("sorts unsorted history defensively before computing (same convention as getGrowthSummary)", () => {
    const sorted = computeHeat([
      row({ capturedOn: "2026-09-27", stars: 1000 }),
      row({ capturedOn: "2026-09-29", stars: 1050 }),
    ]);
    const unsorted = computeHeat([
      row({ capturedOn: "2026-09-29", stars: 1050 }),
      row({ capturedOn: "2026-09-27", stars: 1000 }),
    ]);
    expect(unsorted).toEqual(sorted);
  });
});
