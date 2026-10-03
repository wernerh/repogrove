import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("link", { name: "Databases" })).toHaveAttribute(
      "href",
      "/grove/databases",
    );
    // Grove card footer — repo count, from getReposInGrove, not hand-copied.
    // AI: Ollama, LangChain, LlamaIndex, vLLM, LocalAI (5). Self-Hosted:
    // Supabase, Coolify, Appwrite, PocketBase, Dokploy, Immich, Portainer,
    // Nextcloud (8). Developer Tools: Neovim, LazyGit, Vim, Helix, Zed, Tig,
    // GitUI (7). Databases: DuckDB, ClickHouse, SQLite, PostgreSQL (4).
    expect(screen.getByText("5 repos")).toBeInTheDocument();
    expect(screen.getByText("8 repos")).toBeInTheDocument();
    expect(screen.getByText("7 repos")).toBeInTheDocument();
    expect(screen.getByText("4 repos")).toBeInTheDocument();

    // Repos — from content/repos/*.md, rendered as cards. The homepage pages 10 at a
    // time (filename order), so page 1 is Appwrite…LazyGit; the rest are checked on
    // page 2 below.
    expect(screen.getByRole("link", { name: "Appwrite" })).toHaveAttribute("href", "/repo/appwrite");
    expect(screen.getByRole("link", { name: "LazyGit" })).toHaveAttribute(
      "href",
      "/repo/lazygit",
    );
    fireEvent.click(screen.getByRole("button", { name: "Page 2" }));
    expect(screen.getByRole("link", { name: "Ollama" })).toHaveAttribute("href", "/repo/ollama");
    expect(screen.getByRole("link", { name: "Supabase" })).toHaveAttribute(
      "href",
      "/repo/supabase",
    );
    expect(screen.getByRole("link", { name: "Neovim" })).toHaveAttribute("href", "/repo/neovim");
    // Repo card body — the content file's own one-line description, not a hardcoded string.
    expect(screen.getByText("Run large language models locally.")).toBeInTheDocument();
    expect(screen.getByText("Open-source Firebase alternative.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Page 1" }));
    // Repo card footer — primary category tag, from frontmatter. "ai" is the
    // primary category for 3 of the example repos (Ollama, LangChain, vLLM)
    // and "backend" for 3 more (Supabase, Appwrite, PocketBase), so both
    // assert presence via getAllByText rather than a single match.
    expect(screen.getAllByText("ai").length).toBeGreaterThan(0);
    expect(screen.getAllByText("backend").length).toBeGreaterThan(0);
    expect(screen.getAllByText("devtools").length).toBeGreaterThan(0);
    expect(screen.getAllByText("database").length).toBeGreaterThan(0);

    // Not hardcoded strings — the tagline comes from the component, but the
    // content list must not be baked in; asserting against the real fixture
    // values above is what proves that.
    expect(screen.getByText(/curated map of the open-source ecosystem/i)).toBeInTheDocument();
  });

  it("renders each repo/Grove card as exactly one link (single focus stop, no nested interactives)", () => {
    render(<Home />);
    // 4 Grove cards + the first page's 10 repo cards = 14 card links, plus the
    // hero's one search entry link (a styled link to /search, not a card); the
    // header's own "RepoGrove" wordmark link isn't part of this render (Home
    // doesn't mount RootLayout).
    const links = screen.getAllByRole("link");
    expect(links.filter((link) => link.getAttribute("href") !== "/search")).toHaveLength(14);
    expect(links.filter((link) => link.getAttribute("href") === "/search")).toHaveLength(1);
  });

  it("gives every repo card a single link and shows real alternatives on it", () => {
    render(<Home />);
    // Ollama's frontmatter lists open-source alternatives; the card surfaces them.
    expect(screen.getAllByText(/^alt: /, { selector: "span" }).length).toBeGreaterThan(0);
  });

  it("renders the RepoGrove Weekly newsletter signup section (issue #65, form UI only)", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "RepoGrove Weekly" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: /newsletter/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
  });

  describe("Repositories pagination", () => {
    const repoCardCount = () =>
      screen.getAllByRole("link").filter((link) => link.getAttribute("href")?.startsWith("/repo/"))
        .length;

    it("shows 10 repos per page by default, with a range summary over all 24", () => {
      render(<Home />);
      expect(repoCardCount()).toBe(10);
      expect(screen.getByText("Showing 1–10 of 24 repositories")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    });

    it("pages through every repo exactly once (10 + 10 + 4)", () => {
      render(<Home />);
      const seen = new Set<string>();
      const collect = () =>
        screen
          .getAllByRole("link")
          .map((link) => link.getAttribute("href") ?? "")
          .filter((href) => href.startsWith("/repo/"))
          .forEach((href) => seen.add(href));

      collect();
      fireEvent.click(screen.getByRole("button", { name: "Next page" }));
      expect(screen.getByText("Showing 11–20 of 24 repositories")).toBeInTheDocument();
      collect();
      fireEvent.click(screen.getByRole("button", { name: "Next page" }));
      expect(screen.getByText("Showing 21–24 of 24 repositories")).toBeInTheDocument();
      expect(repoCardCount()).toBe(4);
      expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
      collect();

      expect(seen.size).toBe(24);
    });

    it("lets the reader choose 5 per page and returns to page 1", () => {
      render(<Home />);
      fireEvent.click(screen.getByRole("button", { name: "Page 2" }));
      fireEvent.click(screen.getByRole("button", { name: "5" }));
      expect(repoCardCount()).toBe(5);
      expect(screen.getByText("Showing 1–5 of 24 repositories")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "5" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Page 5" })).toBeInTheDocument();
    });

    it("lets the reader choose 20 per page", () => {
      render(<Home />);
      fireEvent.click(screen.getByRole("button", { name: "20" }));
      expect(repoCardCount()).toBe(20);
      expect(screen.getByText("Showing 1–20 of 24 repositories")).toBeInTheDocument();
    });
  });
});
