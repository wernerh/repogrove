import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AlternativesTable, { type ResolvedAlternative } from "@/components/AlternativesTable";
import type { Repo } from "@/lib/content";

function makeRepo(overrides: Partial<Repo> = {}): Repo {
  return {
    slug: "vllm",
    github: "vllm-project/vllm",
    name: "vLLM",
    category: ["ai", "inference"],
    license: "Apache-2.0",
    status: "active",
    featured: false,
    groves: ["ai"],
    alternatives: { open_source: [], commercial: [] },
    body: "",
    ...overrides,
  };
}

describe("AlternativesTable", () => {
  it("shows the empty state when there are no alternatives at all", () => {
    render(<AlternativesTable openSource={[]} commercial={[]} />);
    expect(screen.getByText("No alternatives documented yet.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders a resolved alternative as a link with its status and stars", () => {
    const openSource: ResolvedAlternative[] = [
      { slug: "vllm", repo: makeRepo(), stars: 24200 },
    ];
    render(<AlternativesTable openSource={openSource} commercial={[]} />);

    const link = screen.getByRole("link", { name: "vLLM" });
    expect(link).toHaveAttribute("href", "/repo/vllm");
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("⭐ 24,200")).toBeInTheDocument();
    expect(screen.getByText("ai")).toBeInTheDocument();
  });

  it("renders an unresolved alternative by its raw slug, unlinked and labeled", () => {
    const openSource: ResolvedAlternative[] = [{ slug: "lm-studio", repo: null, stars: null }];
    render(<AlternativesTable openSource={openSource} commercial={[]} />);

    expect(screen.getByText("lm-studio")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /lm-studio/i })).not.toBeInTheDocument();
    expect(screen.getByText("Not yet profiled")).toBeInTheDocument();
  });

  it("sorts resolved-with-stars first (descending), then resolved-without-history, then unresolved", () => {
    const openSource: ResolvedAlternative[] = [
      { slug: "unresolved", repo: null, stars: null },
      { slug: "low-stars", repo: makeRepo({ slug: "low-stars", name: "Low Stars" }), stars: 100 },
      {
        slug: "no-history",
        repo: makeRepo({ slug: "no-history", name: "No History" }),
        stars: null,
      },
      {
        slug: "high-stars",
        repo: makeRepo({ slug: "high-stars", name: "High Stars" }),
        stars: 9000,
      },
    ];
    render(<AlternativesTable openSource={openSource} commercial={[]} />);

    const rows = screen.getAllByRole("row").slice(1); // drop the header row
    const firstCellText = rows.map((row) => row.querySelector("th, td")?.textContent);
    expect(firstCellText).toEqual(["High Stars", "Low Stars", "No History", "unresolved"]);
  });

  it("renders an unresolved commercial alternative as a plain, unlinked name", () => {
    // TECH-DEBT.md 2026-10-01 row: AlternativesTable renders a commercial
    // chip as plain text whenever its resolver finds no matching
    // content/alternatives/*.md page — the same "omit, don't fabricate a
    // link" convention the open-source rows already follow. Both entries
    // here are synthetic alternativeSlug: null regardless of real content
    // (every real commercial reference content/repos/*.md names today —
    // Firebase, AWS Amplify, GitKraken, Sourcetree, Vercel, Heroku, Netlify,
    // LM Studio — now has its own content/alternatives/*.md page; see
    // tests/app/repo-page.test.tsx's real-page tests for those resolved
    // cases) — this test exercises the component's own null-resolution
    // render branch in isolation, not real content.
    render(
      <AlternativesTable
        openSource={[]}
        commercial={[
          { name: "Totally Unprofiled Tool", alternativeSlug: null },
          { name: "Some Other Tool", alternativeSlug: null },
        ]}
      />,
    );

    expect(screen.getByText("Commercial alternatives")).toBeInTheDocument();
    expect(screen.getByText("Totally Unprofiled Tool")).toBeInTheDocument();
    expect(screen.getByText("Some Other Tool")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Totally Unprofiled Tool" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Some Other Tool" })).not.toBeInTheDocument();
  });

  it("renders a resolved commercial alternative as a link to its /alternative/:slug page", () => {
    // TECH-DEBT.md 2026-10-01 row: AlternativesTable's commercial chips never
    // linked forward to a matching content/alternatives/*.md page even once
    // one existed (e.g. content/alternatives/firebase.md, dev run 48) — the
    // reverse direction (that page's own Open source list resolving back to
    // a repo) already worked. Fixed by resolving each commercial name the
    // same way the Open source column already resolves repo slugs.
    render(
      <AlternativesTable
        openSource={[]}
        commercial={[{ name: "Firebase", alternativeSlug: "firebase" }]}
      />,
    );

    const link = screen.getByRole("link", { name: "Firebase" });
    expect(link).toHaveAttribute("href", "/alternative/firebase");
  });

  it("omits the commercial-alternatives heading entirely when there are none", () => {
    const openSource: ResolvedAlternative[] = [{ slug: "vllm", repo: makeRepo(), stars: 1 }];
    render(<AlternativesTable openSource={openSource} commercial={[]} />);
    expect(screen.queryByText("Commercial alternatives")).not.toBeInTheDocument();
  });
});
