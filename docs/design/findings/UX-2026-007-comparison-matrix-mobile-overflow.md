# UX-2026-007 — "How it compares" matrix silently clipped on mobile

- **Status: FIXED.** **Verified:** `npm run lint` / `npx tsc --noEmit` / `npm test`
  (385/385, 1 new) clean locally; a regression test written first, confirmed red against
  the pre-fix component, green after. See "Verification" below for how this was checked
  without a full `next build` (ADR-006's sandbox font-fetch gap).
- **Severity:** MAJOR — same bug class as UX-2026-006 (silent horizontal clipping, no
  visual scroll affordance, real content on a real page). Caught as a **failing CI run on
  `main`**, not a screenshot review, because UX-2026-006's own generic regression guard
  (`tests/design/screenshots.spec.ts`'s overflow check) is now live and did exactly what
  it was built for.
- **Summary:** `src/components/ComparisonMatrix.tsx`'s new "How it compares" table
  (`PR #115`, "add details-page widgets to repo page") renders on `/repo/[slug]` for any
  repo with ≥1 resolved alternative. At the project's 390px mobile viewport, its
  `overflow-x-auto` wrapper measured `scrollWidth: 326` vs `clientWidth: 324` on
  `/repo/ollama` (real, correctly-fonted CI build) — a 2px overflow with no visual
  affordance, silently clipping content exactly like UX-2026-006.

## Component
`src/components/ComparisonMatrix.tsx` — every `<th>`/`<td>` cell's horizontal padding.

## Found
2026-10-02, dev factory run (not design) — the non-gating "Design screenshots &
accessibility" GitHub Actions check failed on `main` immediately after PR #115 merged
(https://github.com/wernerh/repogrove/actions/runs/37049099675), 2 of 48 checks
(`mobile-light`/`mobile-dark` × `repo-ollama`). Dev picked this up under this run's
"failing CI on `main`" top priority (`CLAUDE.md` §5/dev-factory skill) rather than
waiting for design's next scheduled run, since it was small, contained, and purely a
CSS padding change (no API/data-model/feature work) — filed and claimed as issue #116
per the factory's cross-lane claim protocol.

## Impact
Low-to-moderate, same shape as UX-2026-006: only the comparison matrix (one of several
sections on the page) is affected, and only on repos with a resolved alternative at the
mobile viewport. Still real, live content silently cut off with zero indication there's
more to see — worth fixing immediately rather than filing as debt, per this lane's own
precedent (UX-2026-002/006).

## Root cause
Every data column used unconditional `px-3` (12px each side) and the "Parameter"
column used unconditional `pr-4` (16px). `RootLayout`'s `<main>` is `max-w-6xl px-4`
and the repo page wraps the matrix in a `CARD` (`p-4 border ... sm:p-6`) — at 390px
mobile that chain leaves exactly 324px of content width (`390 − 2×16px main padding −
2×16px card padding − 2×1px card border`). A 4-column table (Parameter + 3 repos) with
that padding needed 326px with real fonts — 2px over, with no `table-layout: fixed` or
`min-w-*` floor forcing the overflow outright (unlike UX-2026-006's `min-w-[24rem]`);
here the padding itself was simply too generous for the available width at this one
breakpoint.

## Fix
Scoped every cell's horizontal padding down below the `sm` breakpoint, restoring the
original padding at `sm:` and up (desktop/tablet unchanged):
```diff
- <th scope="col" className="py-2 pr-4 font-mono text-sm font-normal text-text-secondary">
+ <th scope="col" className="py-2 pr-2 sm:pr-4 font-mono text-sm font-normal text-text-secondary">
...
- className={`px-3 py-2 font-sans text-sm font-semibold ${...}`}
+ className={`px-2 sm:px-3 py-2 font-sans text-sm font-semibold ${...}`}
```
(mirrored on the `<td>`/row-label `<th>` cells in `<tbody>`). This saves 8px on the
Parameter column and 8px per data column (24px across 3 columns) below `sm` — 32px
against the 2px actually needed, a deliberate safety margin rather than a minimal patch,
since the exact overflow amount depends on real font metrics this sandbox cannot render
(see Verification).

## Verification
- Regression test added first in `tests/components/repo-widgets.test.tsx`
  ("scopes cell horizontal padding down below the sm breakpoint"); confirmed it fails
  against the pre-fix component (`git stash` the component change only, re-run, red;
  restore, green) before relying on it.
- `npm run lint` / `npx tsc --noEmit` / `npm test` (385/385, 1 new) all clean locally;
  `npm audit --audit-level=high` 0 vulnerabilities.
- `npm run build` reproduces the known ADR-006 sandbox font-fetch gap (compiles past
  content/data loading first), left to CI for a real, correctly-fonted build.
- **Real-browser geometry reproduction**, since a class-presence test alone is exactly
  the gap UX-2026-006 found: compiled the actual `src/app/globals.css` to real CSS via
  `@tailwindcss/postcss` (no Next.js/font involvement — this step doesn't touch
  `next/font/google` at all, so ADR-006's fetch restriction doesn't apply to it), then
  built a static HTML fixture reproducing the real DOM ancestor chain (`RootLayout`'s
  `<main>`, the page's `CARD` wrapper, the table markup) with representative content,
  and measured it with this sandbox's pre-installed Chromium via Playwright at the
  project's own 390×844 mobile viewport:
  - **Before fix:** wrapper `clientWidth` 324px, table's unconstrained natural width
    324px — a 0px margin with this sandbox's fallback system fonts (Helvetica
    Neue/Arial, `ui-monospace`), consistent with the real, correctly-fonted CI build
    measuring the same structure at 326px (an expected few-px difference between
    fallback and production font metrics, not a modeling error — the structure/padding
    math matches CI exactly at the boundary).
  - **After fix:** table's unconstrained natural width drops to 305px — 19px of margin
    inside the unchanged 324px container, comfortably absorbing the real-font gap the
    "before" case showed (19px ≫ 2px).
  This is strong, concrete local evidence the fix resolves the overflow with margin to
  spare, not just that the new classes compile. Real post-merge CI screenshot
  re-verification (the correctly-fonted, authoritative check) is this PR's own follow-up,
  same pattern as every prior UX-fix in this lane's history that hit the ADR-006 gap.

## Related
UX-2026-006 (`/compare/[a]/[b]`'s Category row) — same bug class (silent `overflow-x-auto`
clipping, no visual affordance) and the direct reason the generic rendered-geometry guard
in `tests/design/screenshots.spec.ts` existed to catch this one automatically, rather than
waiting for a manual screenshot review. Fixed by the dev lane (not design) under this
run's "failing CI on `main`" priority — see issue #116.
