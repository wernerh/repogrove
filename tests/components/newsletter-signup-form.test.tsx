import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NewsletterSignupForm from "@/components/NewsletterSignupForm";

// Issue #65: "form UI only, no working submit path until the owner decision
// (storage/vendor) is answered" (CLAUDE.md rule 6 — paid vendor and
// subscriber-PII storage are both human gates). These tests exist to prove
// that hard rule, not just the happy-path UI: no fetch/XHR is ever made, and
// the form has no `action`/`method` that could hit a real endpoint either.

describe("NewsletterSignupForm", () => {
  it("renders an email input and a submit button, clearly labeled as not yet live", () => {
    render(<NewsletterSignupForm />);
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
    expect(screen.getByRole("button", { name: /notify me/i })).toBeInTheDocument();
    // Acceptance criteria: "clearly labeled e.g. 'Coming soon'" — this is the
    // one thing a returning owner/user must see before typing anything.
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it("has no action/method — nothing for a real browser submit to hit", () => {
    render(<NewsletterSignupForm />);
    const form = screen.getByRole("form", { name: /newsletter/i });
    expect(form).not.toHaveAttribute("action");
    expect(form).not.toHaveAttribute("method");
  });

  it("rejects an empty submission with a client-side validation message, and never calls fetch", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<NewsletterSignupForm />);

    fireEvent.click(screen.getByRole("button", { name: /notify me/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/enter your email/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects a malformed email with a client-side validation message, and never calls fetch", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<NewsletterSignupForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "not-an-email" } });
    fireEvent.click(screen.getByRole("button", { name: /notify me/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/valid email/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts a well-formed email but only shows a 'not open yet' confirmation — never calls fetch", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<NewsletterSignupForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "reader@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /notify me/i }));

    expect(screen.getByRole("status")).toHaveTextContent(/aren.t open yet/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // TECH-DEBT.md's 2026-09-30 "design" row: a `focus:ring-offset-2` button
  // with no `ring-offset-color` falls back to Tailwind's default (white),
  // visible as a light halo against dark-mode surfaces. Regression guard
  // for the DESIGN-SYSTEM.md "Focus rings" convention (fixed design run 16).
  it("pairs its submit button's focus ring offset with the themed bg-default token, not the browser default", () => {
    render(<NewsletterSignupForm />);
    const button = screen.getByRole("button", { name: /notify me/i });
    expect(button.className).toContain("focus:ring-offset-2");
    expect(button.className).toContain("focus:ring-offset-bg-elevated");
  });
});
