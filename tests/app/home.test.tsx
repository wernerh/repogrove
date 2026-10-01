import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Homepage", () => {
  it("renders every example Grove and repo, from real content", () => {
    render(<Home />);

    // Groves — from content/groves/*.md, rendered as cards (docs/design/DESIGN-SYSTEM.md's
    // Repo/Grove card pattern). The card's link carries just the name (the "stretched
    // link" a11y pattern — see GroveCard's doc comment), so this also proves the card
    // is a single focus stop, not several nested links.
    expect(screen.getByRole("link", { name: "AI" })).toHaveAttribute("href", "/grove/ai");
    expect(screen.getByRole("link", { name: "Self-Hosted" })).toHaveAttribute(
      "href",
      "/grove/self-hosted",
    );
    expect(screen.getByRole("link", { name: "Developer Tools" })).toHaveAttribute(
      "href",
      "/grove/developer-tools",
    );
    // Grove card footer — repo count, from getReposInGrove, not hand-copied.
    // AI: Ollama, LangChain, LlamaIndex, vLLM, LocalAI (5). Developer Tools:
    // Neovim, LazyGit, Vim, Helix, Zed (5). Self-Hosted: Supabase, Coolify,
    // Appwrite, PocketBase, Dokploy (5).
    expect(screen.getAllByText("5 repos").length).toBe(3);

    // Repos — from content/repos/*.md, rendered as cards.
    expect(screen.getByRole("link", { name: "Ollama" })).toHaveAttribute("href", "/repo/ollama");
    expect(screen.getByRole("link", { name: "Supabase" })).toHaveAttribute(
      "href",
      "/repo/supabase",
    );
    expect(screen.getByRole("link", { name: "Neovim" })).toHaveAttribute("href", "/repo/neovim");
    expect(screen.getByRole("link", { name: "LazyGit" })).toHaveAttribute(
      "href",
      "/repo/lazygit",
    );
    // Repo card body — the content file's own one-line description, not a hardcoded string.
    expect(screen.getByText("Run large language models locally.")).toBeInTheDocument();
    expect(screen.getByText("Open-source Firebase alternative.")).toBeInTheDocument();
    // Repo card footer — primary category tag, from frontmatter. "ai" is the
    // primary category for 3 of the example repos (Ollama, LangChain, vLLM)
    // and "backend" for 3 more (Supabase, Appwrite, PocketBase), so both
    // assert presence via getAllByText rather than a single match.
    expect(screen.getAllByText("ai").length).toBeGreaterThan(0);
    expect(screen.getAllByText("backend").length).toBeGreaterThan(0);
    expect(screen.getAllByText("devtools").length).toBeGreaterThan(0);

    // Not hardcoded strings — the tagline comes from the component, but the
    // content list must not be baked in; asserting against the real fixture
    // values above is what proves that.
    expect(screen.getByText(/curated map of the open-source ecosystem/i)).toBeInTheDocument();
  });

  it("renders each repo/Grove card as exactly one link (single focus stop, no nested interactives)", () => {
    render(<Home />);
    // 3 Grove cards + 15 repo cards = 18 card links; the header's own "RepoGrove"
    // wordmark link isn't part of this render (Home doesn't mount RootLayout).
    expect(screen.getAllByRole("link")).toHaveLength(18);
  });

  it("renders the RepoGrove Weekly newsletter signup section (issue #65, form UI only)", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "RepoGrove Weekly" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: /newsletter/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
  });
});
