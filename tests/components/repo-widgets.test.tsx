import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RepoStatTiles from "@/components/RepoStatTiles";
import RepoLedger from "@/components/RepoLedger";
import GroveNeighbors from "@/components/GroveNeighbors";
import ComparisonMatrix, { type MatrixColumn } from "@/components/ComparisonMatrix";

const col = (over: Partial<MatrixColumn>): MatrixColumn => ({
  slug: "ollama",
  name: "Ollama",
  isCurrent: true,
  stars: 182046,
  contributors: 1200,
  forks: 16000,
  status: "active",
  license: "MIT",
  ...over,
});

describe("RepoStatTiles", () => {
  it("formats values and shows an em dash, never a fake 0, for unknown ones", () => {
    render(
      <RepoStatTiles
        tiles={[
          { label: "Stargazers", value: 182046, hint: "+233 / 5d" },
          { label: "Contributors", value: null },
        ]}
      />,
    );
    expect(screen.getByText("182,046")).toBeInTheDocument();
    expect(screen.getByText("+233 / 5d")).toBeInTheDocument();
    const dd = screen.getByText("Contributors").nextElementSibling!;
    expect(dd).toHaveTextContent("—");
    expect(dd).not.toHaveTextContent("0");
  });
});

describe("RepoLedger", () => {
  it("renders label/value rows as a definition list", () => {
    render(<RepoLedger rows={[{ label: "License", value: "MIT" }]} />);
    expect(screen.getByRole("heading", { name: "Repository ledger" })).toBeInTheDocument();
    expect(screen.getByText("License")).toBeInTheDocument();
    expect(screen.getByText("MIT")).toBeInTheDocument();
  });
});

describe("GroveNeighbors", () => {
  it("renders nothing when there are no neighbors", () => {
    const { container } = render(<GroveNeighbors neighbors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links each neighbor and omits stars it doesn't have", () => {
    render(
      <GroveNeighbors
        neighbors={[
          { slug: "vllm", name: "vLLM", category: "ai", stars: 93060 },
          { slug: "tig", name: "Tig", stars: null },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "vLLM" })).toHaveAttribute("href", "/repo/vllm");
    expect(screen.getByText("93,060")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tig" })).toHaveAttribute("href", "/repo/tig");
  });
});

describe("ComparisonMatrix", () => {
  it("renders nothing with fewer than two columns", () => {
    const { container } = render(<ComparisonMatrix columns={[col({})]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("compares real facts across columns, linking alternatives but not the current repo", () => {
    render(
      <ComparisonMatrix
        columns={[
          col({}),
          col({ slug: "vllm", name: "vLLM", isCurrent: false, stars: 93060, contributors: null, license: "Apache-2.0" }),
        ]}
      />,
    );
    const table = screen.getByRole("table");
    expect(within(table).getByRole("link", { name: "vLLM" })).toHaveAttribute("href", "/repo/vllm");
    expect(within(table).queryByRole("link", { name: "Ollama" })).not.toBeInTheDocument();
    const contributorsRow = within(table).getByRole("row", { name: /Contributors/ });
    expect(contributorsRow).toHaveTextContent("1,200");
    expect(contributorsRow).toHaveTextContent("—");
    expect(within(table).getByRole("row", { name: /License/ })).toHaveTextContent("Apache-2.0");
  });

  it("scopes cell horizontal padding down below the sm breakpoint (regression: real CI screenshot run found this table silently overflowing /repo/ollama's 390px mobile viewport by 2px with the unconditional px-3/pr-4 padding this test guards against — see issue #116)", () => {
    render(
      <ComparisonMatrix
        columns={[col({}), col({ slug: "vllm", name: "vLLM", isCurrent: false, license: "Apache-2.0" })]}
      />,
    );
    const table = screen.getByRole("table");
    for (const cell of within(table).getAllByRole("columnheader")) {
      expect(cell.className).not.toMatch(/(?<!sm:)px-3\b/);
      expect(cell.className).not.toMatch(/(?<!sm:)pr-4\b/);
    }
    // The "Parameter" header/row-label column uses pr-*; the data columns use px-*.
    expect(within(table).getByRole("columnheader", { name: "Parameter" }).className).toMatch(/\bpr-2 sm:pr-4\b/);
    const vllmHeader = within(table).getByRole("columnheader", { name: "vLLM" });
    expect(vllmHeader.className).toMatch(/\bpx-2 sm:px-3\b/);
  });
});
