import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GroveCard from "@/components/GroveCard";
import type { Grove } from "@/lib/content";

const baseGrove: Grove = {
  slug: "ai",
  name: "AI",
  description: "Open-source tools for running, building, and integrating AI models.",
  relatedGroves: ["self-hosted"],
  body: "Open-source tools for building AI applications.\n\n## Core projects\n- [Ollama](/repo/ollama)",
};

describe("GroveCard", () => {
  it("renders the Grove name as a single link to its Grove page", () => {
    render(<GroveCard grove={baseGrove} repoCount={3} />);
    const link = screen.getByRole("link", { name: "AI" });
    expect(link).toHaveAttribute("href", "/grove/ai");
    // Single focus stop — no nested interactive elements inside the card.
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("shows the Grove's own description frontmatter", () => {
    render(<GroveCard grove={baseGrove} repoCount={3} />);
    expect(
      screen.getByText("Open-source tools for running, building, and integrating AI models."),
    ).toBeInTheDocument();
  });

  it("shows the repo count, pluralized", () => {
    render(<GroveCard grove={baseGrove} repoCount={3} />);
    expect(screen.getByText("3 repos")).toBeInTheDocument();
  });

  it("uses the singular form for exactly one repo", () => {
    render(<GroveCard grove={baseGrove} repoCount={1} />);
    expect(screen.getByText("1 repo")).toBeInTheDocument();
  });
});
