import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SearchPage from "@/app/search/page";

describe("Search page (/search, issue #63) — real /content fixtures", () => {
  it("shows a prompt and no results before anything is typed", () => {
    render(<SearchPage />);
    expect(screen.getByText(/start typing a repository name/i)).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("finds a real repo by name and links to its repo page", () => {
    render(<SearchPage />);
    const input = screen.getByLabelText(/search repositories, groves and alternatives/i);
    fireEvent.change(input, { target: { value: "Ollama" } });

    const link = screen.getByRole("link", { name: "Ollama" });
    expect(link).toHaveAttribute("href", "/repo/ollama");
    expect(screen.getByText("Repo")).toBeInTheDocument();
  });

  it("finds a real Grove by name and links to its Grove page", () => {
    render(<SearchPage />);
    const input = screen.getByLabelText(/search repositories, groves and alternatives/i);
    fireEvent.change(input, { target: { value: "AI" } });

    // Both the "AI" Grove and repos categorized "ai" can match this query;
    // assert the Grove result specifically rather than the full result set,
    // which would make this test brittle against unrelated future content.
    const groveLink = screen.getAllByRole("link").find((el) => el.getAttribute("href") === "/grove/ai");
    expect(groveLink).toBeDefined();
  });

  it("finds a real paid-product alternative by product name and links to its page", () => {
    render(<SearchPage />);
    const input = screen.getByLabelText(/search repositories, groves and alternatives/i);
    fireEvent.change(input, { target: { value: "Notion" } });

    const link = screen.getByRole("link", { name: "Notion" });
    expect(link).toHaveAttribute("href", "/alternative/notion");
    expect(screen.getByText("Alternative")).toBeInTheDocument();
  });

  it("shows a no-matches message for a query that matches nothing", () => {
    render(<SearchPage />);
    const input = screen.getByLabelText(/search repositories, groves and alternatives/i);
    fireEvent.change(input, { target: { value: "zzzznonexistentzzzz" } });

    expect(screen.getByText(/no matches for/i)).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("clears back to the empty-query prompt when the input is cleared", () => {
    render(<SearchPage />);
    const input = screen.getByLabelText(/search repositories, groves and alternatives/i);
    fireEvent.change(input, { target: { value: "Ollama" } });
    expect(screen.getByRole("link", { name: "Ollama" })).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "" } });
    expect(screen.getByText(/start typing a repository name/i)).toBeInTheDocument();
  });
});
