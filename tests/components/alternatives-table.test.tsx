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

  it("renders commercial alternatives as plain, unlinked names", () => {
    render(<AlternativesTable openSource={[]} commercial={["Firebase", "AWS Amplify"]} />);

    expect(screen.getByText("Commercial alternatives")).toBeInTheDocument();
    expect(screen.getByText("Firebase")).toBeInTheDocument();
    expect(screen.getByText("AWS Amplify")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Firebase" })).not.toBeInTheDocument();
  });

  it("omits the commercial-alternatives heading entirely when there are none", () => {
    const openSource: ResolvedAlternative[] = [{ slug: "vllm", repo: makeRepo(), stars: 1 }];
    render(<AlternativesTable openSource={openSource} commercial={[]} />);
    expect(screen.queryByText("Commercial alternatives")).not.toBeInTheDocument();
  });
});
