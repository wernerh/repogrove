import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StarGrowthChart from "@/components/StarGrowthChart";
import type { SnapshotRow } from "@/lib/snapshots";

function row(overrides: Partial<SnapshotRow> = {}): SnapshotRow {
  return {
    github: "ollama/ollama",
    capturedOn: "2026-09-27",
    stars: 100,
    forks: 10,
    openIssues: 5,
    watchers: 100,
    source: "github-api",
    fetchedAt: "2026-09-27T12:00:00.000Z",
    ...overrides,
  };
}

describe("StarGrowthChart", () => {
  it("degrades gracefully with no history — no chart, no error", () => {
    render(<StarGrowthChart history={[]} />);
    expect(screen.getByText(/tracking begins with the next ingestion run/i)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows the current count without a delta for a single snapshot", () => {
    render(<StarGrowthChart history={[row({ stars: 181813, capturedOn: "2026-09-27" })]} />);
    expect(screen.getByText(/181,813 stars/)).toBeInTheDocument();
    expect(screen.getByText(/tracking started/i)).toBeInTheDocument();
    expect(screen.getByText("2026-09-27").tagName).toBe("TIME");
    // Not enough data for any delta figure.
    expect(screen.queryByText(/\+.*stars \/ \d+ day/)).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders the sparkline and a growth figure for two or more snapshots", () => {
    render(
      <StarGrowthChart
        history={[row({ capturedOn: "2026-09-25", stars: 90 }), row({ capturedOn: "2026-09-27", stars: 100 })]}
      />,
    );
    expect(screen.getByText(/\+10 stars \/ 2 days/)).toBeInTheDocument();
    expect(screen.getByText(/tracking since/i)).toBeInTheDocument();
    const chart = screen.getByRole("img");
    expect(chart.tagName.toLowerCase()).toBe("svg");
    expect(chart).toHaveAccessibleName(/2026-09-25.*90 stars.*2026-09-27.*100 stars/);
  });

  it("renders a negative delta without a leading plus sign", () => {
    render(
      <StarGrowthChart
        history={[row({ capturedOn: "2026-09-25", stars: 100 }), row({ capturedOn: "2026-09-27", stars: 95 })]}
      />,
    );
    expect(screen.getByText(/-5 stars \/ 2 days/)).toBeInTheDocument();
  });

  it("centers the sparkline (not pinned to the bottom edge) on a flat history", () => {
    render(
      <StarGrowthChart
        history={[row({ capturedOn: "2026-09-25", stars: 100 }), row({ capturedOn: "2026-09-27", stars: 100 })]}
      />,
    );
    expect(screen.getByText(/±0 stars \/ 2 days/)).toBeInTheDocument();
    const chart = screen.getByRole("img");
    expect(chart).toBeInTheDocument();
    // Regression check: a flat history must not collapse every point onto
    // the chart's bottom edge (a `min - max || 1` fallback with no explicit
    // midpoint would put y at CHART_HEIGHT - CHART_PADDING = 60, not the
    // visual middle, 32, of the 64px-tall viewBox).
    const polyline = chart.querySelector("polyline");
    const points = polyline?.getAttribute("points") ?? "";
    for (const point of points.split(" ")) {
      const [, y] = point.split(",");
      expect(Number(y)).toBeCloseTo(32, 1);
    }
  });
});
