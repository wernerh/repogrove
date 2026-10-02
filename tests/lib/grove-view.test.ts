import { describe, expect, it } from "vitest";
import { deriveTabs, filterRows, humanizeTag, paginate, sortRows } from "@/lib/grove-view";
import { makeRow } from "./grove-fixtures";

describe("humanizeTag", () => {
  it("capitalises ordinary tags and spaces out hyphens", () => {
    expect(humanizeTag("editor")).toBe("Editor");
    expect(humanizeTag("self-hosted")).toBe("Self hosted");
  });

  it("upper-cases known acronyms", () => {
    expect(humanizeTag("llm")).toBe("LLM");
    expect(humanizeTag("ai")).toBe("AI");
    expect(humanizeTag("paas")).toBe("PAAS");
  });
});

describe("deriveTabs", () => {
  const rows = [
    makeRow({ slug: "a", categories: ["devtools", "editor", "terminal"] }),
    makeRow({ slug: "b", categories: ["devtools", "editor", "terminal"] }),
    makeRow({ slug: "c", categories: ["devtools", "git", "terminal"] }),
    makeRow({ slug: "d", categories: ["devtools", "git", "solo"] }),
  ];

  it("starts with All, counting every row", () => {
    expect(deriveTabs(rows)[0]).toEqual({ key: "all", label: "All", count: 4 });
  });

  it("omits a tag every repo carries (it would filter nothing)", () => {
    expect(deriveTabs(rows).map((t) => t.key)).not.toContain("devtools");
  });

  it("omits a tag only one repo carries", () => {
    expect(deriveTabs(rows).map((t) => t.key)).not.toContain("solo");
  });

  it("orders discriminating tags by count, then alphabetically, with overlapping counts", () => {
    expect(deriveTabs(rows).slice(1)).toEqual([
      { key: "terminal", label: "Terminal", count: 3 },
      { key: "editor", label: "Editor", count: 2 },
      { key: "git", label: "Git", count: 2 },
    ]);
  });

  it("returns only All when nothing discriminates", () => {
    expect(deriveTabs([makeRow({ slug: "a" }), makeRow({ slug: "b" })])).toHaveLength(1);
  });
});

describe("filterRows", () => {
  const rows = [
    makeRow({ slug: "neovim", categories: ["devtools", "editor"], description: "A modal editor." }),
    makeRow({ slug: "lazygit", categories: ["devtools", "git"], alternatives: ["Tig", "GitKraken"] }),
  ];

  it("returns everything for the All tab and an empty query", () => {
    expect(filterRows(rows, { tab: "all", query: "" })).toHaveLength(2);
    expect(filterRows(rows, { tab: "all", query: "   " })).toHaveLength(2);
  });

  it("filters by category tag", () => {
    expect(filterRows(rows, { tab: "git", query: "" }).map((r) => r.slug)).toEqual(["lazygit"]);
  });

  it("matches the query case-insensitively across name, description, tags and alternatives", () => {
    expect(filterRows(rows, { tab: "all", query: "MODAL" }).map((r) => r.slug)).toEqual(["neovim"]);
    expect(filterRows(rows, { tab: "all", query: "gitkraken" }).map((r) => r.slug)).toEqual(["lazygit"]);
    expect(filterRows(rows, { tab: "all", query: "acme/neo" }).map((r) => r.slug)).toEqual(["neovim"]);
  });

  it("combines tab and query, and can match nothing", () => {
    expect(filterRows(rows, { tab: "git", query: "modal" })).toEqual([]);
  });
});

describe("sortRows", () => {
  const rows = [
    makeRow({ slug: "b", stars: 50, deltaStars: 30, days: 2 }),
    makeRow({ slug: "a", stars: 200, deltaStars: 5, days: 2 }),
    makeRow({ slug: "c", stars: null, deltaStars: null, days: 0 }),
    makeRow({ slug: "d", stars: 80, deltaStars: null, days: 0 }),
  ];

  it("sorts by stars descending with untracked repos last", () => {
    expect(sortRows(rows, "stars").map((r) => r.slug)).toEqual(["a", "d", "b", "c"]);
  });

  it("sorts by growth descending, with repos lacking a growth window after those with one", () => {
    expect(sortRows(rows, "growth").map((r) => r.slug)).toEqual(["b", "a", "d", "c"]);
  });

  it("sorts by name A-Z", () => {
    expect(sortRows(rows, "name").map((r) => r.slug)).toEqual(["a", "b", "c", "d"]);
  });

  it("does not mutate its input", () => {
    const before = rows.map((r) => r.slug);
    sortRows(rows, "stars");
    expect(rows.map((r) => r.slug)).toEqual(before);
  });

  it("ranks a real decline below a real gain rather than excluding it", () => {
    const sorted = sortRows(
      [makeRow({ slug: "down", deltaStars: -4, days: 2 }), makeRow({ slug: "up", deltaStars: 4, days: 2 })],
      "growth",
    );
    expect(sorted.map((r) => r.slug)).toEqual(["up", "down"]);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 14 }, (_, i) => i + 1);

  it("slices a page and reports a 1-based range", () => {
    const p = paginate(items, 1, 6);
    expect(p.items).toEqual([1, 2, 3, 4, 5, 6]);
    expect(p).toMatchObject({ page: 1, totalPages: 3, total: 14, from: 1, to: 6 });
  });

  it("handles a short last page", () => {
    const p = paginate(items, 3, 6);
    expect(p.items).toEqual([13, 14]);
    expect(p).toMatchObject({ from: 13, to: 14 });
  });

  it("clamps an out-of-range page", () => {
    expect(paginate(items, 99, 6).page).toBe(3);
    expect(paginate(items, 0, 6).page).toBe(1);
  });

  it("reports an empty result as 0-0 on a single page", () => {
    expect(paginate([], 1, 6)).toMatchObject({ items: [], page: 1, totalPages: 1, total: 0, from: 0, to: 0 });
  });
});
