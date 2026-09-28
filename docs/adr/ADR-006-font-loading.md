# ADR-006: Font loading — next/font/google, self-hosted at build time

**Status:** Accepted
**Date:** 2026-09-28

## Context
`docs/design/DESIGN-SYSTEM.md`'s Typography section names three faces — Inter (UI
chrome), Source Serif 4 (long-form editorial prose only), IBM Plex Mono (stats, dates,
code, repo slugs) — and specifies loading them via `next/font` once the app exists,
self-hosted at build time rather than a runtime Google Fonts CDN request. `CLAUDE.md`
rule 7 treats adding a web font as needing an ADR note even when self-hosted, so this
records that decision; it does not revise ADR-001's locked stack (Next.js/React/TS +
Tailwind), only wires in typefaces already specified there and in DESIGN-SYSTEM.md.
`src/app/globals.css` and the four Phase 1 pages have used fallback system-font stacks
for these three roles since PR #25; this closes that gap (TECH-DEBT.md, row added
2026-09-28).

## Decision
- Load all three faces with `next/font/google` (`Inter`, `Source_Serif_4`,
  `IBM_Plex_Mono`) in `src/app/layout.tsx`, each exposed as a CSS custom property
  (`--font-inter`, `--font-source-serif-4`, `--font-ibm-plex-mono`) via the `variable`
  option, applied on `<html>`.
- `next/font` downloads the font files once during `next build` and serves them from
  our own static output — no runtime request to `fonts.googleapis.com` /
  `fonts.gstatic.com`, and no new npm dependency (`next/font` ships with Next.js).
  Compatible with `output: "export"` (ADR-002 / RG-2's Azure Storage static-website
  hosting, which has no server runtime): the downloaded font files become plain static
  assets in the exported output, same as any other `public/` file.
- `src/app/globals.css`'s `--font-sans` / `--font-serif` / `--font-mono` tokens now
  reference the loaded variable, falling back to the named family and system stack
  (e.g. `var(--font-inter, Inter), "Helvetica Neue", Arial, sans-serif`) for any render
  path that doesn't mount `RootLayout` (component tests that render in isolation under
  jsdom). The fallback is passed as the `var()` call's own second argument, not
  appended after a comma outside it — per the CSS Custom Properties spec, a bare
  `var(--unset-property)` with no in-call fallback invalidates the *whole* containing
  declaration at computed-value time, not just that one comma-list item, which would
  silently drop the entire fallback stack (not just the missing face) the moment
  `--font-inter` is unset. Caught in review before merge.
- `subsets: ["latin"]` for all three (RepoGrove's content is English-only at this
  phase); IBM Plex Mono limited to weights `400/500/600`, the only weights actually
  used per DESIGN-SYSTEM.md's mono usage (stats/dates/code — no bold mono anywhere in
  the current pages).
- `display: "swap"` on all three, standard practice to avoid invisible text during
  font load (FOIT) — not itself a design-system value, a `next/font` loading-strategy
  default worth naming explicitly.

## Consequences
- Local `next build` fetches the font files from Google's servers at build time; this
  sandbox's outbound network is allowlisted to `registry.npmjs.org` and the GitHub API
  only (see `CLAUDE.md` rule on local-vs-CI validation), so the font-fetch step cannot
  be verified in this environment — left to CI's `ci.yml` build job, which runs on a
  GitHub-hosted runner with normal internet access. Lint, typecheck, and test all run
  and pass locally (none of them touch the network); see this PR's report for exact
  commands/results.
- No visual regression expected: the in-call `var(--x, fallback)` syntax means a
  browser that somehow never receives the `next/font`-generated `<style>` (build
  failure, or a test environment) still renders the same fallback stack
  DESIGN-SYSTEM.md's fallback-only version already used and the design lane already
  screenshot-verified (PR #25).
- Revisit if a non-Latin subset is needed later (community-submitted content, i18n) —
  add the relevant `subsets` entries then, not preemptively.
