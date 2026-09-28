# ADR-007: Design lane screenshot + accessibility harness (Playwright + axe-core)

**Status:** Accepted
**Date:** 2026-09-28

## Context

The design lane's brief (docs/factory prompt, `docs/design/README.md`) has verified
every page it has touched so far (PR #25's token wiring, PR #32's font ADR) with
one-off Playwright screenshots run from a globally-installed copy outside the repo —
flagged as tech debt (`TECH-DEBT.md`, 2026-09-28): "not a project dependency... not
reproducible by another run or a human without that global install." The brief's
mission section calls building a reusable, dev-dependency-only harness (screenshots +
`@axe-core/playwright` for WCAG 2.1 AA checks) a valid major task once walking-skeleton
pages exist to screenshot — they now do (issue #7 / PR #10, Phase 1).

`CLAUDE.md` rule 7 treats adding a runtime dependency to the app itself as notable, and
this lane's brief separately requires an ADR for "never add runtime dependencies... to
the code" and for adding tooling like this. This is a **dev**-dependency only — nothing
here ships in the static-exported production bundle (`next.config.ts`'s
`output: "export"`) — but it's still a new tool the factory and any human contributor
need to know how to run, so it gets the same ADR treatment.

## Decision

- Add `@playwright/test` and `@axe-core/playwright` as **devDependencies**, pinned
  exact (`1.63.0` / `4.13.0`) rather than `^`-ranged, since a browser-automation tool's
  behavior is more sensitive to minor-version drift than a typical library and this
  harness's correctness depends on matching it to the sandbox's pre-installed Chromium
  (see "Consequences" below).
- `playwright.config.ts` (repo root) + `tests/design/screenshots.spec.ts`: for each
  route in a small, explicit list (currently `/`, `/grove/ai`, `/repo/ollama` — the
  Phase 1 walking-skeleton pages) × 6 projects (desktop/tablet/mobile × light/dark),
  capture a full-page PNG under `docs/design/screenshots/` and run an axe-core scan
  tagged `wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`, asserted to have zero violations.
  Extend the `ROUTES` array as new page families land.
- The harness runs against the real static-exported build (`next build` → `out/`), not
  `next dev`, so what's screenshotted and scanned is what actually ships. Since
  RepoGrove's export has no server runtime (ADR-002/RG-2), `next start` cannot serve
  it — `scripts/design/static-server.mjs`, a ~50-line file using only Node's built-in
  `http`/`fs` modules, serves `out/` locally instead of adding a `serve`-type runtime
  dependency for one job.
- `npm run design:screenshots` runs it (`playwright test`). **Not** added to
  `npm test` (vitest) or `.github/workflows/ci.yml`: installing browsers in CI (`npx
  playwright install --with-deps chromium`) and keeping a browser-automation suite
  reliably green on every PR is a bigger commitment (flakiness, CI runtime, a new
  system-dependency install step) than this run's "one major task" scope covers, and
  it's this lane's own verification tool, not a merge gate for other lanes' PRs.
  Tracked as a possible follow-up in `TECH-DEBT.md`, not decided here.
- Chromium launch uses `launchOptions.executablePath` pointed at this sandbox's
  pre-installed `/opt/pw-browsers/chromium`, per this environment's own setup notes,
  rather than `npx playwright install` (which would try to download a browser build
  from Playwright's CDN — outside this sandbox's network allowlist, and unnecessary
  when a compatible Chromium is already present).

## Consequences

- **Version skew is real but acceptable.** `@playwright/test@1.63.0`'s bundled
  `browsers.json` names Chromium revision 1243; the sandbox ships revision 1194 (one
  Playwright release behind). Verified this run: the harness's actual usage surface —
  navigate, wait for network idle, take a full-page screenshot, inject and run
  axe-core — worked correctly end-to-end (18/18 checks passed across all 3 routes × 6
  projects) against revision 1194 via `executablePath`. CDP's core surface is stable
  across adjacent Chromium releases; this is the documented tradeoff for using a
  pre-installed browser instead of downloading a network-fetched one, not a defect.
  Revisit (bump the pin, or drop `executablePath` in favor of `playwright install`) if
  a future Playwright/Chromium API actually diverges enough to break this.
- **Could not verify end-to-end against the real, un-stubbed production build in this
  sandbox this run.** `next build` now requires fetching Inter/Source Serif 4/IBM Plex
  Mono from `fonts.googleapis.com` (ADR-006, PR #32), and this sandbox's network
  allowlist (`registry.npmjs.org` + the GitHub API only) blocks that host — the same,
  already-documented constraint ADR-006's own Consequences section names ("the
  font-fetch step cannot be verified in this environment — left to CI's `ci.yml` build
  job"). That constraint now also blocks locally running *this* harness, since it needs
  a real `out/` directory to screenshot.
  - **What this run did instead:** built once against a local-only, uncommitted stub
    (`inter`/`sourceSerif4`/`ibmPlexMono` replaced with `{ variable: "" }`, never
    staged or committed — confirmed via `git diff`/`git status` showing `src/app/
    layout.tsx` unchanged before this PR's commits) purely to prove the harness's own
    mechanics work against the real app pages: static server serves `out/` correctly,
    all 6 viewport/color-scheme projects resolve, screenshots write to disk, and
    axe-core runs and reports (0 violations found, across all 18 combinations). Those
    stub-build screenshots were deleted, not committed — they show fallback fonts, not
    the real typeface stack, so they're not representative design artifacts.
  - **What's left:** the first *real* screenshots (with actual fonts) and the first
    real CI run of `npm run build` on this repo's current `main` (which already
    requires the same Google Fonts fetch, independent of this harness) come from an
    environment with that network access — the owner's machine, or a future dev-lane/
    design-lane run in a sandbox without this restriction, or by wiring `design:
    screenshots` into `ci.yml` (GitHub-hosted runners have normal internet access) as
    a possible follow-up. Tracked in `TECH-DEBT.md`.
- Screenshots are committed only when small and drawn from the repo's existing
  synthetic/example content (`content/repos/*.md`, `content/groves/*.md` — public
  open-source project metadata, never user data), per this lane's brief and
  `CLAUDE.md` rule 1.
- `.gitignore` gained `test-results/`, `playwright-report/`, `blob-report/`,
  `playwright/.cache/` — Playwright's own run-output directories, not the harness's
  committed screenshots (which live under `docs/design/screenshots/`, not gitignored).

## Review fixes (same run)

An independent review (a skeptical senior product designer/front-end engineer
subagent, per this lane's brief) caught three real issues before merge, all fixed and
re-verified (18/18 checks still pass against the same stubbed-build smoke test):

- `playwright.config.ts`'s `executablePath` was hardcoded to
  `/opt/pw-browsers/chromium` with no existence check — correct only in this exact
  sandbox image, and would fail outright with an executablePath-not-found error on the
  owner's machine or in a future CI job (both places this ADR itself names as where
  this harness should eventually run for real). Fixed: falls back to `undefined`
  (Playwright's normal managed-browser resolution) via `existsSync()`, and reads a
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE` env var override first.
- `scripts/design/static-server.mjs`'s traversal guard (`resolved.startsWith(rootDir)`)
  was a bare prefix match, not true path containment — a request could resolve into a
  sibling directory that merely shares `rootDir` as a string prefix (e.g. `out-evil`
  next to `out`). Fixed to require an exact match or `rootDir + path.sep`. Confirmed
  with a standalone repro before and after the fix.
- Nothing guarded against a false-green run: if `out/` were stale or missing, the
  server would 404 every route, `page.goto` wouldn't throw on a non-2xx response, and
  axe-core would find ~0 violations on an empty error page — the whole suite would
  "pass" without testing anything real. Fixed two ways: the static server now checks
  for `out/index.html` at startup and exits non-zero with a clear message if it's
  missing (confirmed: `rm -rf out && node scripts/design/static-server.mjs` exits 1),
  and each test now asserts a real 2xx response and that the site header renders
  before running axe-core.
