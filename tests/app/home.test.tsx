import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Homepage", () => {
  it("renders both example Groves and both example repos, from real content", () => {
    render(<Home />);

    // Groves — from content/groves/*.md
    expect(screen.getByRole("link", { name: "AI" })).toHaveAttribute("href", "/grove/ai");
    expect(screen.getByRole("link", { name: "Self-Hosted" })).toHaveAttribute(
      "href",
      "/grove/self-hosted",
    );

    // Repos — from content/repos/*.md
    expect(screen.getByRole("link", { name: "Ollama" })).toHaveAttribute("href", "/repo/ollama");
    expect(screen.getByRole("link", { name: "Supabase" })).toHaveAttribute(
      "href",
      "/repo/supabase",
    );

    // Not hardcoded strings — the tagline comes from the component, but the
    // content list must not be baked in; asserting against the real fixture
    // values above is what proves that.
    expect(screen.getByText(/curated map of the open-source ecosystem/i)).toBeInTheDocument();
  });
});
