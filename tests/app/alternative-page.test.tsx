import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AlternativePage, {
  generateStaticParams,
  resolveOpenSourceAlternatives,
} from "@/app/alternative/[slug]/page";

describe("Alternative page (/alternative/[slug])", () => {
  it("statically generates params for every alternatives content file", async () => {
    const params = generateStaticParams();
    expect(params.map((p) => p.slug).sort()).toEqual(["notion"]);
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

  it("resolves an Open source name against a real content/repos/*.md page when the slug matches", () => {
    // None of Notion's real content items resolve today (see the AppFlowy
    // assertion above), so this exercises the resolution helper directly
    // against a name that *does* slugify to a real repo ("Ollama" ->
    // "ollama", which exists in content/repos/) — same resolved-or-null
    // convention tests/lib/content.test.ts's slugifyAlternativeName unit
    // test covers the slugifying half of.
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
