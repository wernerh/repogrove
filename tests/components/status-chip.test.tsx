import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatusChip from "@/components/StatusChip";

describe("StatusChip", () => {
  it("renders the active state with its swatch and text label", () => {
    render(<StatusChip status="active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByTestId("status-chip-swatch")).toBeInTheDocument();
  });

  it("renders the maintained state with its swatch and text label", () => {
    render(<StatusChip status="maintained" />);
    expect(screen.getByText("Maintained")).toBeInTheDocument();
    expect(screen.getByTestId("status-chip-swatch")).toBeInTheDocument();
  });

  it("renders the inactive state with its swatch and text label", () => {
    render(<StatusChip status="inactive" />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByTestId("status-chip-swatch")).toBeInTheDocument();
  });

  it("marks the swatch decorative so only the text label is announced", () => {
    render(<StatusChip status="active" />);
    const swatch = screen.getByTestId("status-chip-swatch");
    expect(swatch).toHaveAttribute("aria-hidden", "true");
  });

  it("renders a hard-edged square swatch, not the circular dot MomentumChip uses — issue #52", () => {
    render(<StatusChip status="active" />);
    const swatch = screen.getByTestId("status-chip-swatch");
    // rounded-none, not rounded-sm: a first pass used rounded-sm (4px) on
    // this swatch's 10px box, which a real render showed reads as a circle
    // at that size (4px is 40% of the box, nearly rounded-full's 50%) — see
    // StatusChip.tsx's doc comment. Guard against that regressing back in.
    expect(swatch.className).toContain("rounded-none");
    expect(swatch.className).not.toContain("rounded-sm");
    expect(swatch.className).not.toContain("rounded-full");
    // No emoji text content anywhere in the chip — the collision this test
    // guards against was two chips both rendering "🟢 Active" verbatim.
    expect(screen.queryByText("🟢")).not.toBeInTheDocument();
  });
});
