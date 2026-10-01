import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Isolated from tests/app/repo-page.test.tsx (which exercises the page against the real
// committed content/comparisons/*.md files) — same isolation pattern as
// tests/app/repo-page-releases-empty.test.tsx. Every real repo now has at least one
// comparison content file (langchain-vs-llamaindex closed the last mutual pair without
// one), so there's no remaining real-repo fixture for "no comparisons at all" — this
// mocks getComparisonsForRepo to an empty result instead of relying on a real repo that
// might gain a comparison file later, which is exactly what happened to this test's
// original, real-content-coupled version in tests/app/repo-page.test.tsx (see
// TECH-DEBT.md's 2026-09-30 row on asserting absence against mutable real data).
vi.mock("@/lib/content", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/content")>();
  return {
    ...actual,
    getComparisonsForRepo: () => [],
  };
});

const { default: RepoPage } = await import("@/app/repo/[slug]/page");

describe("Repo page (/repo/[slug]) — no 'Compared with' section (issue #62)", () => {
  it("omits the 'Compared with' heading for a repo with no comparison content file", async () => {
    const element = await RepoPage({ params: Promise.resolve({ slug: "ollama" }) });
    render(element);

    expect(
      screen.queryByRole("heading", { level: 2, name: "Compared with" }),
    ).not.toBeInTheDocument();
  });
});
