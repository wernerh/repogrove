import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatusChip from "@/components/StatusChip";

describe("StatusChip", () => {
  it("renders the active state with its icon and text label", () => {
    render(<StatusChip status="active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("🟢")).toBeInTheDocument();
  });

  it("renders the maintained state with its icon and text label", () => {
    render(<StatusChip status="maintained" />);
    expect(screen.getByText("Maintained")).toBeInTheDocument();
    expect(screen.getByText("🟡")).toBeInTheDocument();
  });

  it("renders the inactive state with its icon and text label", () => {
    render(<StatusChip status="inactive" />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByText("⚪")).toBeInTheDocument();
  });

  it("marks the icon decorative so only the text label is announced", () => {
    render(<StatusChip status="active" />);
    const icon = screen.getByText("🟢");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
