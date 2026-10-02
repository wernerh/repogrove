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

  it(
    "forces a fixed, wrapping layout below the sm breakpoint on EVERY cell — thead " +
      "columnheaders, tbody rowheaders, and tbody data cells alike (regression: a real " +
      "CI screenshot run found this table silently overflowing /repo/ollama's 390px " +
      "mobile viewport, and — after a first, padding-only fix attempt that only reduced " +
      "but did not eliminate the overflow for real worst-case content like zed.md's " +
      '"GPL-3.0 / AGPL-3.0" license string — a real Chromium reproduction showed only ' +
      "table-fixed + break-words actually closes it at every content length. See " +
      "issue #116.",
    () => {
      render(
        <ComparisonMatrix
          columns={[col({}), col({ slug: "vllm", name: "vLLM", isCurrent: false, license: "Apache-2.0" })]}
        />,
      );
      const table = screen.getByRole("table");
      // Order-independent: Tailwind's own class-merge tooling (or a future edit) can
      // reorder a className string without changing its meaning — checking token
      // membership rather than a fixed substring avoids a brittle, order-coupled test.
      const classes = (el: HTMLElement) => el.className.split(/\s+/).filter(Boolean);
      const hasClass = (el: HTMLElement, cls: string) => classes(el).includes(cls);
      const hasNoUnscopedPadding = (el: HTMLElement) =>
        !hasClass(el, "px-3") && !hasClass(el, "pr-4");

      // table-fixed (unconditional) + sm:table-auto (restores the original
      // content-sized columns at sm+, unchanged) — the actual mechanism that
      // eliminates the overflow; px-3/pr-4 alone (the first fix attempt) could not.
      expect(hasClass(table, "table-fixed")).toBe(true);
      expect(hasClass(table, "sm:table-auto")).toBe(true);
      expect(hasClass(table, "w-full")).toBe(true);

      // columnheader: the thead's "Parameter" label + one per repo column.
      // rowheader: tbody's per-row "Parameter" labels (Stars/Contributors/.../License).
      // cell: every data td in tbody (repo x row).
      const columnHeaders = within(table).getAllByRole("columnheader");
      const rowHeaders = within(table).getAllByRole("rowheader");
      const dataCells = within(table).getAllByRole("cell");
      expect(columnHeaders.length).toBeGreaterThan(0);
      expect(rowHeaders.length).toBeGreaterThan(0);
      expect(dataCells.length).toBeGreaterThan(0);

      for (const cell of [...columnHeaders, ...rowHeaders, ...dataCells]) {
        expect(hasNoUnscopedPadding(cell)).toBe(true);
        // Every cell must be able to wrap arbitrarily (a license slug, a large
        // comma-formatted number) to fit table-fixed's assigned column width —
        // without this, table-fixed alone would still force the column too narrow
        // and clip rather than wrap.
        expect(hasClass(cell, "break-words")).toBe(true);
      }

      // The "Parameter" column (header label cell + every row's label th) gets a
      // fixed share of the mobile width and the original pr-4 restored at sm+.
      const parameterHeader = within(table).getByRole("columnheader", { name: "Parameter" });
      for (const parameterCell of [parameterHeader, ...rowHeaders]) {
        expect(hasClass(parameterCell, "pr-2")).toBe(true);
        expect(hasClass(parameterCell, "sm:pr-4")).toBe(true);
        expect(hasClass(parameterCell, "w-[30%]")).toBe(true);
        expect(hasClass(parameterCell, "sm:w-auto")).toBe(true);
      }

      // Every repo (data) column uses the scoped px-2/sm:px-3 pair, with no
      // explicit width override — table-fixed splits the remaining space among
      // them equally.
      const vllmHeader = within(table).getByRole("columnheader", { name: "vLLM" });
      for (const dataHeaderOrCell of [vllmHeader, ...dataCells]) {
        expect(hasClass(dataHeaderOrCell, "px-2")).toBe(true);
        expect(hasClass(dataHeaderOrCell, "sm:px-3")).toBe(true);
      }
    },
  );
});
