import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RepoCard from "@/components/RepoCard";
import type { Repo } from "@/lib/content";

const baseRepo: Repo = {
  slug: "ollama",
  github: "ollama/ollama",
  name: "Ollama",
  category: ["ai", "llm"],
  license: "MIT",
  status: "active",
  featured: true,
  groves: ["ai"],
  alternatives: { open_source: ["lm-studio"], commercial: [] },
  body: "Run large language models locally.\n\n## What it does\nMore detail that shouldn't appear on the card.",
};

describe("RepoCard", () => {
  it("renders the repo name as a single link to its repo page", () => {
    render(<RepoCard repo={baseRepo} stars={181843} />);
    const link = screen.getByRole("link", { name: "Ollama" });
    expect(link).toHaveAttribute("href", "/repo/ollama");
    // Single focus stop — no nested interactive elements inside the card.
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("shows the first paragraph of the body as the description, not later sections", () => {
    render(<RepoCard repo={baseRepo} stars={181843} />);
    expect(screen.getByText("Run large language models locally.")).toBeInTheDocument();
    expect(screen.queryByText(/shouldn't appear on the card/)).not.toBeInTheDocument();
  });

  it("shows the formatted star count when history exists", () => {
    render(<RepoCard repo={baseRepo} stars={181843} />);
    expect(screen.getByText("⭐ 181,843")).toBeInTheDocument();
  });

  it("omits the star count rather than showing a fabricated 0 when there's no history yet", () => {
    render(<RepoCard repo={baseRepo} stars={null} />);
    expect(screen.queryByText(/⭐/)).not.toBeInTheDocument();
  });

  it("shows the primary category as a tag", () => {
    render(<RepoCard repo={baseRepo} stars={null} />);
    expect(screen.getByText("ai")).toBeInTheDocument();
  });
});
