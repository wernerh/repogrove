import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ComparePage, { generateMetadata, generateStaticParams } from "@/app/compare/[a]/[b]/page";

describe("Compare page (/compare/[a]/[b])", () => {
  it("statically generates params for both URL orders of every comparison", async () => {
    const params = generateStaticParams();
    expect(params).toContainEqual({ a: "ollama", b: "vllm" });
    expect(params).toContainEqual({ a: "vllm", b: "ollama" });
    expect(params).toHaveLength(2);
  });

  it("renders /compare/ollama/vllm from content/comparisons/ollama-vs-vllm.md, not hardcoded data", async () => {
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "ollama", b: "vllm" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Ollama vs vLLM" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ollama" })).toHaveAttribute("href", "/repo/ollama");
    expect(screen.getByRole("link", { name: "vLLM" })).toHaveAttribute("href", "/repo/vllm");

    // At-a-glance table: both repos' license, status, and category — reused
    // from getRepo, not re-authored in the comparison content file.
    const table = container.querySelector("table")!;
    expect(within(table).getByText(/MIT/)).toBeInTheDocument();
    expect(within(table).getByText(/Apache-2.0/)).toBeInTheDocument();
    expect(within(table).getAllByText("Active").length).toBeGreaterThan(0);

    // Pros/Cons reused verbatim from each repo's own content body — not
    // re-authored in the comparison content file (which has no Pros/Cons
    // frontmatter or sections of its own at all).
    expect(screen.getByText("Fast to get started")).toBeInTheDocument();
    expect(screen.getByText(/Production-grade performance/)).toBeInTheDocument();

    // The hand-authored "How they differ" prose.
    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(screen.getByText(/reach for Ollama to run a model locally/)).toBeInTheDocument();
  });

  it("resolves the reverse URL order (/compare/vllm/ollama) to the same content, rendered in canonical order", async () => {
    const { container: forward } = render(
      await ComparePage({ params: Promise.resolve({ a: "ollama", b: "vllm" }) }),
    );
    const { container: reverse } = render(
      await ComparePage({ params: Promise.resolve({ a: "vllm", b: "ollama" }) }),
    );
    // Same heading either way — the page always renders in the content
    // file's own canonical repos order, not whichever order the URL used.
    expect(forward.querySelector("h1")?.textContent).toBe(reverse.querySelector("h1")?.textContent);
  });

  it("calls notFound() for a repo pair with no comparison content file", async () => {
    await expect(
      ComparePage({ params: Promise.resolve({ a: "ollama", b: "supabase" }) }),
    ).rejects.toThrow();
  });

  it("calls notFound() for a slug that doesn't exist at all", async () => {
    await expect(
      ComparePage({ params: Promise.resolve({ a: "ollama", b: "does-not-exist" }) }),
    ).rejects.toThrow();
  });

  it("both URL orders point their canonical link at the same, content-file-order URL (issue #64 review finding)", async () => {
    const forward = await generateMetadata({ params: Promise.resolve({ a: "ollama", b: "vllm" }) });
    const reverse = await generateMetadata({ params: Promise.resolve({ a: "vllm", b: "ollama" }) });
    expect(forward.alternates?.canonical).toBe("/compare/ollama/vllm");
    expect(reverse.alternates?.canonical).toBe("/compare/ollama/vllm");
  });

  it("expands one repo's momentum signal panel independently of the other's, without misaligning the row (UX-2026-005 review finding)", async () => {
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "ollama", b: "vllm" }) }),
    );
    const table = container.querySelector("table")!;
    const momentumRow = within(table).getByText("Momentum").closest("tr")!;
    const buttons = within(momentumRow).getAllByRole("button");
    // Both ollama and vllm have enough real snapshot history for
    // computeHeat to return a result (not "Not enough data yet"), so this
    // row renders a real MomentumChip — and its interactive button — for
    // both repos, same as the real committed data/repogrove.db.
    expect(buttons).toHaveLength(2);
    const [firstButton, secondButton] = buttons;

    // useId() is scoped per component instance in the render tree, not a
    // global counter — two chips in the same row never collide.
    const firstPanelId = firstButton.getAttribute("aria-controls");
    const secondPanelId = secondButton.getAttribute("aria-controls");
    expect(firstPanelId).toBeTruthy();
    expect(secondPanelId).toBeTruthy();
    expect(firstPanelId).not.toBe(secondPanelId);

    fireEvent.click(firstButton);

    expect(firstButton).toHaveAttribute("aria-expanded", "true");
    expect(secondButton).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(firstPanelId!)).toBeVisible();
    expect(document.getElementById(secondPanelId!)).not.toBeVisible();

    // Review finding: MomentumChip's signal panel is independent,
    // uncoordinated `useState` per instance, so expanding only one side can
    // grow that cell taller than its sibling — `align-top` on every cell in
    // the row (not the browser's default vertical-centering) is what keeps
    // the label and both values reading as aligned while that's happening.
    const cells = momentumRow.querySelectorAll("th, td");
    expect(cells.length).toBeGreaterThan(0);
    cells.forEach((cell) => expect(cell.className).toContain("align-top"));
  });
});
