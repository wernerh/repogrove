import { fireEvent, render, screen } from "@testing-library/react";
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

  // Replaces the old "exposes every signal via the title tooltip" test —
  // see MomentumChip.tsx's doc comment / UX-2026-005: a native `title`
  // tooltip is never reachable by keyboard or touch and isn't reliably
  // announced by screen readers, so the signals are now a real disclosure
  // (WAI-ARIA "disclosure (show/hide)" pattern) instead.
  it("renders a real button, collapsed by default, that reaches the panel via aria-controls", () => {
    render(<MomentumChip heat={heat()} />);
    const button = screen.getByRole("button", { name: /active/i });
    expect(button).toHaveAttribute("aria-expanded", "false");

    const panel = screen.getByTestId("momentum-signal-panel");
    expect(panel).not.toBeVisible();
    expect(button.getAttribute("aria-controls")).toBe(panel.getAttribute("id"));
  });

  it("reveals every signal — available or not — when the button is activated", () => {
    render(<MomentumChip heat={heat()} />);
    const button = screen.getByRole("button", { name: /active/i });

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByTestId("momentum-signal-panel");
    expect(panel).toBeVisible();
    expect(screen.getByText("Star growth:")).toBeInTheDocument();
    expect(screen.getByText("+0.030%/day")).toBeInTheDocument();
    expect(screen.getByText("Open issues:")).toBeInTheDocument();
    expect(screen.getByText("+5 since 2026-09-27")).toBeInTheDocument();
    expect(screen.getByText("Contributor growth:")).toBeInTheDocument();
    expect(screen.getByText("not enough data yet")).toBeInTheDocument();
  });

  it("collapses again on a second activation", () => {
    render(<MomentumChip heat={heat()} />);
    const button = screen.getByRole("button", { name: /active/i });

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("momentum-signal-panel")).not.toBeVisible();
  });

  it("gives every user, not just a sighted mouse user, a reason to activate the button", () => {
    render(<MomentumChip heat={heat()} />);
    // The accessible name includes the sr-only affordance text, not just the
    // visible "Active" label — a screen reader user hears why the button is
    // useful before deciding whether to press it.
    expect(screen.getByRole("button", { name: /active.*show momentum signals/i })).toBeInTheDocument();
  });

  // TECH-DEBT.md's 2026-09-30 "design" row: a `focus:ring-offset-2` button
  // with no `ring-offset-color` falls back to Tailwind's default (white),
  // visible as a light halo against dark-mode surfaces. Regression guard
  // for the DESIGN-SYSTEM.md "Focus rings" convention (fixed design run 16).
  it("pairs its focus ring offset with the themed bg-default token, not the browser default", () => {
    render(<MomentumChip heat={heat()} />);
    const button = screen.getByRole("button", { name: /active/i });
    expect(button.className).toContain("focus:ring-offset-2");
    expect(button.className).toContain("focus:ring-offset-bg-default");
  });
});
