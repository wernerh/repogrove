import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MomentumChip from "@/components/MomentumChip";
import type { HeatResult } from "@/lib/heat";

function heat(overrides: Partial<HeatResult> = {}): HeatResult {
  return {
    label: "active",
    starGrowthPercentPerDay: 0.03,
    days: 2,
    signals: [
      { key: "star-growth", label: "Star growth", detail: "+0.030%/day", available: true },
      { key: "open-issues", label: "Open issues", detail: "+5 since 2026-09-27", available: true },
      { key: "contributor-growth", label: "Contributor growth", detail: "not enough data yet", available: false },
    ],
    ...overrides,
  };
}

describe("MomentumChip", () => {
  it("renders the rising state with its icon and text label", () => {
    render(<MomentumChip heat={heat({ label: "rising" })} />);
    expect(screen.getByText("Rising")).toBeInTheDocument();
    expect(screen.getByText("🔥")).toBeInTheDocument();
  });

  it("renders the active state with its icon and text label", () => {
    render(<MomentumChip heat={heat({ label: "active" })} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("🟢")).toBeInTheDocument();
  });

  it("renders the slowing state with its icon and text label", () => {
    render(<MomentumChip heat={heat({ label: "slowing" })} />);
    expect(screen.getByText("Slowing")).toBeInTheDocument();
    expect(screen.getByText("🟡")).toBeInTheDocument();
  });

  it("renders the dormant state with its icon and text label", () => {
    render(<MomentumChip heat={heat({ label: "dormant" })} />);
    expect(screen.getByText("Dormant")).toBeInTheDocument();
    expect(screen.getByText("⚪")).toBeInTheDocument();
  });

  it("marks the icon decorative so only the text label is announced", () => {
    render(<MomentumChip heat={heat({ label: "rising" })} />);
    const icon = screen.getByText("🔥");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes every signal, available or not, via the title tooltip", () => {
    render(<MomentumChip heat={heat()} />);
    const chip = screen.getByText("Active").closest("span[title]");
    expect(chip).toHaveAttribute(
      "title",
      "Star growth: +0.030%/day · Open issues: +5 since 2026-09-27 · Contributor growth: not enough data yet",
    );
  });
});
