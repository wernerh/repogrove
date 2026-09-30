import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GrovePage, { generateStaticParams } from "@/app/grove/[slug]/page";

describe("Grove page (/grove/[slug])", () => {
  it("statically generates params for every Grove in /content", async () => {
    const params = generateStaticParams();
    expect(params.map((p) => p.slug).sort()).toEqual(["ai", "developer-tools", "self-hosted"]);
  });

  it("renders /grove/ai from content/groves/ai.md, not a hardcoded string", async () => {
    const element = await GrovePage({ params: Promise.resolve({ slug: "ai" }) });
    render(element);

    expect(screen.getByRole("heading", { level: 1, name: "AI" })).toBeInTheDocument();
    expect(
      screen.getByText(/Open-source tools for running, building, and integrating AI models\./),
    ).toBeInTheDocument();
    // The body's own "## Core projects" section links to Ollama.
    expect(screen.getByRole("link", { name: "Ollama" })).toHaveAttribute("href", "/repo/ollama");
  });

  it("calls notFound() for a Grove slug that doesn't exist in /content", async () => {
    await expect(
      GrovePage({ params: Promise.resolve({ slug: "does-not-exist" }) }),
    ).rejects.toThrow();
  });
});
