import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ComparePage, { generateMetadata, generateStaticParams } from "@/app/compare/[a]/[b]/page";
import { getAllComparisons } from "@/lib/content";

describe("Compare page (/compare/[a]/[b])", () => {
  it("statically generates params for both URL orders of every comparison", async () => {
    const params = generateStaticParams();
    expect(params).toContainEqual({ a: "ollama", b: "vllm" });
    expect(params).toContainEqual({ a: "vllm", b: "ollama" });
    // Twice the real comparison count (both URL orders per comparison) —
    // derived from the real fixtures rather than hardcoded, so this doesn't
    // need updating every time a new content/comparisons/*.md file ships.
    expect(params).toHaveLength(getAllComparisons().length * 2);
  });

  it("renders /compare/appwrite/supabase from content/comparisons/appwrite-vs-supabase.md", async () => {
    // Deliberately structural/content-only, not a specific Stars/Momentum
    // assertion: Appwrite has no ingested snapshot history yet in the real
    // committed data/repogrove.db (it was added to content/repos/ after the
    // last ingestion run), but that's a temporary, mutable state the next
    // scheduled ingestion run will change — asserting against it here would
    // be exactly the real-db coupling TECH-DEBT.md's 2026-09-30 row warns
    // about. The graceful-degradation behavior itself (no crash either way)
    // is covered in isolation by compare-page-no-history.test.tsx, which
    // mocks @/lib/snapshots instead of relying on the real db's current,
    // temporary emptiness.
    render(await ComparePage({ params: Promise.resolve({ a: "appwrite", b: "supabase" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Appwrite vs Supabase" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Appwrite" })).toHaveAttribute(
      "href",
      "/repo/appwrite",
    );
    expect(screen.getByRole("link", { name: "Supabase" })).toHaveAttribute(
      "href",
      "/repo/supabase",
    );

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(screen.getByText(/Supabase is built on real Postgres/)).toBeInTheDocument();
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

  it("renders /compare/lazygit/tig from content/comparisons/lazygit-vs-tig.md, part of the fully-mutual git-TUI trio", async () => {
    // gitui, lazygit, and tig each list the other two under
    // alternatives.open_source — this is one of the three new comparison
    // files (gitui-vs-lazygit, gitui-vs-tig, lazygit-vs-tig) that closes the
    // trio out, same shape as the appwrite/pocketbase/supabase trio.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "lazygit", b: "tig" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "LazyGit vs Tig" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "LazyGit" })).toHaveAttribute("href", "/repo/lazygit");
    expect(screen.getByRole("link", { name: "Tig" })).toHaveAttribute("href", "/repo/tig");

    const table = container.querySelector("table")!;
    expect(within(table).getByText(/MIT/)).toBeInTheDocument();
    expect(within(table).getByText(/GPL-2.0/)).toBeInTheDocument();

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(screen.getByText(/Tig predates LazyGit by years/)).toBeInTheDocument();
  });

  it("renders /compare/coolify/dokploy from content/comparisons/coolify-vs-dokploy.md", async () => {
    // coolify.md and dokploy.md have listed each other under
    // alternatives.open_source since dokploy.md was added (run 38) — this is
    // the comparison page that finally closes that pair out.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "coolify", b: "dokploy" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Coolify vs Dokploy" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Coolify" })).toHaveAttribute("href", "/repo/coolify");
    expect(screen.getByRole("link", { name: "Dokploy" })).toHaveAttribute("href", "/repo/dokploy");

    const table = container.querySelector("table")!;
    expect(within(table).getAllByText(/Apache-2.0/).length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(screen.getByText(/Dokploy builds multi-server deployment on Docker Swarm/)).toBeInTheDocument();
  });

  it("renders /compare/ollama/localai from content/comparisons/localai-vs-ollama.md, part of the fully-mutual AI inference trio", async () => {
    // ollama, localai, and vllm each list the other two under
    // alternatives.open_source — localai-vs-ollama and localai-vs-vllm are
    // the two new comparison files that complete the trio alongside the
    // pre-existing ollama-vs-vllm. URL order is ollama/localai (neither
    // matches the content file's own canonical [localai, ollama] order) to
    // also exercise the non-canonical-URL-order lookup, same as the
    // vllm/ollama reverse-order test below.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "ollama", b: "localai" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "LocalAI vs Ollama" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ollama" })).toHaveAttribute("href", "/repo/ollama");
    expect(screen.getByRole("link", { name: "LocalAI" })).toHaveAttribute("href", "/repo/localai");

    const table = container.querySelector("table")!;
    expect(within(table).getAllByText(/MIT/).length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { level: 2, name: "How they differ" })).toBeInTheDocument();
    expect(
      screen.getByText(/Ollama is built around one job done simply/),
    ).toBeInTheDocument();
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

  it("wraps the Category value instead of letting it widen the table past the mobile viewport (UX-2026-006)", async () => {
    // vLLM's category list (ai, llm, inference) is three items long — real
    // content on main today, not a synthetic worst case. At the project's
    // own 390px mobile screenshot viewport (playwright.config.ts), an
    // un-constrained three-item Category value widens this table (no
    // table-layout: fixed, so a cell avoids wrapping if it can) past the
    // viewport, and the overflow-x-auto wrapper's horizontal scroll has no
    // visual affordance — real text gets clipped at the viewport edge with
    // no hint there's more (confirmed against the real, correctly-fonted
    // compare-ollama-vllm__mobile-light.png screenshot, where vLLM's own
    // three-item category list — ai, llm, inference — is cut off mid-word).
    // Fixed by constraining the value's width below `sm` so it wraps onto a
    // second line instead (content stays visible and in the a11y tree at
    // every viewport) — not by hiding the row, which an earlier draft of
    // this fix did and an independent review correctly flagged: `hidden` is
    // `display:none`, removed from the accessibility tree too, so it would
    // have also hidden the fact from a screen reader on the same mobile
    // viewport where the bug was found, not just from sighted users.
    const { container } = render(
      await ComparePage({ params: Promise.resolve({ a: "ollama", b: "vllm" }) }),
    );
    const table = container.querySelector("table")!;
    const categoryRow = within(table).getByText("Category").closest("tr")!;

    // The row itself is never hidden at any breakpoint — only its value
    // cells get a wrap-forcing max-width below `sm`.
    expect(categoryRow.className).not.toContain("hidden");

    const ollamaValue = within(categoryRow).getByText("ai, llm");
    const vllmValue = within(categoryRow).getByText("ai, llm, inference");
    for (const value of [ollamaValue, vllmValue]) {
      expect(value.className).toContain("max-w-32");
      expect(value.className).toContain("sm:max-w-none");
      expect(value.className).toContain("break-words");
    }

    // The four other FactRows are untouched by this fix.
    for (const label of ["Stars", "License", "Status", "Momentum"]) {
      const row = within(table).getByText(label).closest("tr")!;
      expect(row.className).not.toContain("hidden");
    }
  });
});
