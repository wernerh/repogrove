import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AlternativePage, {
  generateStaticParams,
  resolveOpenSourceAlternatives,
} from "@/app/alternative/[slug]/page";

describe("Alternative page (/alternative/[slug])", () => {
  it("statically generates params for every alternatives content file", async () => {
    const params = generateStaticParams();
    expect(params.map((p) => p.slug).sort()).toEqual([
      "firebase",
      "gitkraken",
      "notion",
      "sourcetree",
    ]);
  });

  it("renders /alternative/notion from content/alternatives/notion.md, not a hardcoded string", async () => {
    render(await AlternativePage({ params: Promise.resolve({ slug: "notion" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Notion alternatives" }),
    ).toBeInTheDocument();
    expect(screen.getByText("knowledge-management")).toBeInTheDocument();

    // Open source items with no matching content/repos/*.md page render as
    // plain text, never a link that would 404 (none of AppFlowy/Outline/
    // AFFiNE/Anytype have their own repo page yet).
    expect(screen.getByText("AppFlowy")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "AppFlowy" })).not.toBeInTheDocument();

    // Free / Commercial / Best fit render as plain lists.
    expect(screen.getByText("Confluence")).toBeInTheDocument();
    expect(screen.getByText("Craft (free personal plan)")).toBeInTheDocument();
    expect(screen.getByText("Team documentation")).toBeInTheDocument();
  });

  it("renders /alternative/firebase with every Open source item resolved to a real content/repos/*.md page", async () => {
    // Unlike Notion (see the AppFlowy assertion above), every one of
    // Firebase's real Open source entries — Appwrite, Supabase, PocketBase —
    // already has its own content/repos/*.md page (all three list Firebase
    // as a commercial alternative themselves), so this exercises the
    // resolved render branch against real /content, not a synthetic mock
    // (tests/app/alternative-page-resolved.test.tsx covers that in
    // isolation).
    render(await AlternativePage({ params: Promise.resolve({ slug: "firebase" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Firebase alternatives" }),
    ).toBeInTheDocument();

    for (const [name, slug] of [
      ["Appwrite", "appwrite"],
      ["Supabase", "supabase"],
      ["PocketBase", "pocketbase"],
    ] as const) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", `/repo/${slug}`);
    }

    // Commercial renders as a plain list, same as notion.md's Confluence/Coda/ClickUp.
    expect(screen.getByText("AWS Amplify")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "AWS Amplify" })).not.toBeInTheDocument();
  });

  it("renders /alternative/gitkraken with every Open source item resolved to a real content/repos/*.md page", async () => {
    // GitUI, LazyGit, Tig each already have a content/repos/*.md page (all
    // three name GitKraken as a commercial alternative themselves) — same
    // resolved-link branch firebase.md's test above exercises.
    render(await AlternativePage({ params: Promise.resolve({ slug: "gitkraken" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "GitKraken alternatives" }),
    ).toBeInTheDocument();

    for (const [name, slug] of [
      ["GitUI", "gitui"],
      ["LazyGit", "lazygit"],
      ["Tig", "tig"],
    ] as const) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", `/repo/${slug}`);
    }

    // Free renders as a plain list, same as notion.md's free-plan entries.
    expect(screen.getByText("Sourcetree")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sourcetree" })).not.toBeInTheDocument();

    // Best fit renders each bullet's full text — regression coverage for a
    // real bug caught in review: a bullet that wraps across source lines in
    // the .md file gets silently truncated by extractListItems (only lines
    // starting with "- " are captured), so asserting on the complete
    // sentence here catches a truncated render the content.test.ts unit
    // test alone wouldn't surface at this layer.
    expect(
      screen.getByText(
        "Free private-repo access without a paid plan — GitKraken's free Community tier covers public repositories only, so a private repo needs a Pro-or-higher plan, while Sourcetree is free for private repos too, with no seat limit",
      ),
    ).toBeInTheDocument();
  });

  it("renders /alternative/sourcetree with every Open source item resolved to a real content/repos/*.md page", async () => {
    render(await AlternativePage({ params: Promise.resolve({ slug: "sourcetree" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Sourcetree alternatives" }),
    ).toBeInTheDocument();

    for (const [name, slug] of [
      ["GitUI", "gitui"],
      ["LazyGit", "lazygit"],
      ["Tig", "tig"],
    ] as const) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", `/repo/${slug}`);
    }

    // Commercial renders as a plain list, same as notion.md's Confluence/Coda/ClickUp.
    expect(screen.getByText("GitKraken")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "GitKraken" })).not.toBeInTheDocument();

    // Best fit full-sentence regression check, same reasoning as gitkraken's
    // test above.
    expect(
      screen.getByText(
        "Linux support — Sourcetree only ships Mac and Windows builds, while GitKraken also builds for Linux",
      ),
    ).toBeInTheDocument();
  });

  it("resolves an Open source name against a real content/repos/*.md page when the slug matches", () => {
    // Exercises the resolution helper directly against a name that
    // slugifies to a real repo ("Ollama" -> "ollama", which exists in
    // content/repos/) — same resolved-or-null convention
    // tests/lib/content.test.ts's slugifyAlternativeName unit test covers
    // the slugifying half of.
    const [resolved, unresolved] = resolveOpenSourceAlternatives(["Ollama", "Definitely Not A Repo"]);
    expect(resolved.repo?.slug).toBe("ollama");
    expect(unresolved.repo).toBeNull();
  });

  it("calls notFound() for an alternative slug that doesn't exist in /content", async () => {
    await expect(
      AlternativePage({ params: Promise.resolve({ slug: "does-not-exist" }) }),
    ).rejects.toThrow();
  });
});
