"use client";

import { useState } from "react";

/**
 * "RepoGrove Weekly" signup (spec §8/§12, issue #65). Scoped, per the issue's
 * own acceptance criteria, to **form UI only** — real client-side validation,
 * but no working submit path: `CLAUDE.md` rule 6 lists a paid vendor and
 * subscriber-PII storage as human gates, and `output: "export"` (ADR-002)
 * has no server runtime today to store a submission in even if that
 * decision were answered. So this form never calls `fetch`, never sets a
 * real `action`/`method` — see `tests/components/newsletter-signup-form.test.tsx`,
 * which asserts exactly that, not just the happy-path UI. A malformed/empty
 * submission gets a real inline validation message either way, so the
 * "coming soon" label isn't the only thing standing in for a real backend.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = { kind: "idle" } | { kind: "error"; message: string } | { kind: "submitted" };

export default function NewsletterSignupForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();

    if (trimmed === "") {
      setStatus({ kind: "error", message: "Enter your email address to sign up." });
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setStatus({ kind: "error", message: "Enter a valid email address." });
      return;
    }

    // No submit path exists yet (see doc comment above) — this is the
    // acceptance criteria's "clearly labeled, no working submission" state,
    // not a stand-in for a real success response.
    setStatus({ kind: "submitted" });
  }

  return (
    <div>
      <p className="font-sans text-sm text-text-secondary">
        The 10 open-source projects worth knowing about this week.{" "}
        <span className="font-medium text-text-default">Coming soon</span> — sign up to
        be notified when it launches.
      </p>

      <form
        aria-label="Newsletter signup"
        onSubmit={handleSubmit}
        noValidate
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start"
      >
        <div className="flex-1">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              // Clear both the error and the (fake) success confirmation on
              // any edit — without this, editing the address after a
              // "submitted" state left the stale "Thanks! ..." message on
              // screen while the user typed a different one (caught in
              // review).
              if (status.kind !== "idle") {
                setStatus({ kind: "idle" });
              }
            }}
            aria-invalid={status.kind === "error"}
            aria-describedby={status.kind === "error" ? "newsletter-email-error" : undefined}
            className="w-full rounded-sm border border-border-default bg-bg-elevated px-4 py-3 font-sans text-base text-text-default placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-cta-fill"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-cta-fill px-6 py-3 font-sans text-sm font-medium text-cta-text hover:bg-cta-fill-hover focus:outline-none focus:ring-2 focus:ring-cta-fill focus:ring-offset-2 focus:ring-offset-bg-default"
        >
          Notify me
        </button>
      </form>

      <div className="mt-2" aria-live="polite">
        {status.kind === "error" && (
          <p id="newsletter-email-error" role="alert" className="font-sans text-sm text-error-text">
            {status.message}
          </p>
        )}
        {status.kind === "submitted" && (
          <p role="status" className="font-sans text-sm text-success-text">
            Thanks! Signups aren&apos;t open yet — we&apos;ll only use this to let you
            know when RepoGrove Weekly launches.
          </p>
        )}
      </div>
    </div>
  );
}
