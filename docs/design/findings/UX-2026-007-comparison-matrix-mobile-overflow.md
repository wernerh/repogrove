# UX-2026-007 — "How it compares" matrix silently clipped on mobile

- **Status: FIXED (re-diagnosed after independent review — the first fix below was
  insufficient).** **Verified:** `npm run lint` / `npx tsc --noEmit` / `npm test`
  (384/384, 1 updated) clean locally; a regression test written first, confirmed red
  against the pre-fix component, green after. See "Independent review" and "Second fix"
  for why the first attempt didn't actually close this, and "Verification" for how both
  were checked without a full `next build` (ADR-006's sandbox font-fetch gap).
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
  affordance, silently clipping content exactly like UX-2026-006. A real reproduction of
  the actual worst-case content (`/repo/zed`) showed the real overflow is much larger —
  up to 68px — and a first, padding-only fix only shrank it to 28px, not zero.

## Component
`src/components/ComparisonMatrix.tsx` — the `<table>`'s layout mode and every `<th>`/
`<td>` cell's horizontal padding/wrapping.

## Found
2026-10-02, dev factory run (not design) — the non-gating "Design screenshots &
accessibility" GitHub Actions check failed on `main` immediately after PR #115 merged
(https://github.com/wernerh/repogrove/actions/runs/37049099675), 2 of 48 checks
(`mobile-light`/`mobile-dark` × `repo-ollama`). Dev picked this up under this run's
"failing CI on `main`" top priority (`CLAUDE.md` §5/dev-factory skill) rather than
waiting for design's next scheduled run, since it looked small and contained (no API/
data-model/feature work) — filed and claimed as issue #116 per the factory's cross-lane
claim protocol.

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
2×16px card padding − 2×1px card border`). `/repo/ollama`'s content (license "MIT",
alternatives "LocalAI"/"vLLM") only needed 326px with that padding — 2px over. But the
real binding constraint isn't the padding amount, it's `table-layout: auto` (the
default): an auto-layout table with `width: 100%` only shrinks a column below its
**max-content** (fully unwrapped) width if doing so still lets every cell's content
fit — in practice, browsers commonly just let the table overflow its container instead
of wrapping cell text, which is exactly what both the real CI build and this finding's
own Chromium reproduction (see Verification) showed happening.

## First fix (insufficient — kept for history, see independent review below)
Scoped every cell's horizontal padding down below the `sm` breakpoint only
(`px-3`→`px-2 sm:px-3`, `pr-4`→`pr-2 sm:pr-4`), reasoning that 32px of padding savings
against ollama's measured 2px overflow was a comfortable margin. **This was true only
for `/repo/ollama`'s unusually short content** (a 3-letter license, 4-10 character
names) — every test, compile, and local check passed, but the fix never addressed the
actual mechanism (table-layout's refusal to shrink below max-content), only ollama's
specific numbers.

## Independent review (factory-reviewer-dev subagent, before merge)
Caught two real MAJOR gaps before this was considered closed:
1. The first fix's own regression test only asserted the thead `columnheader` cells —
   15 of the table's 17 cells for its own test fixture (every tbody `rowheader`/`cell`)
   were completely unchecked, despite the fix doc's claim that it was "mirrored" there.
2. The real-browser geometry check (and the project's own CI screenshot coverage) only
   ever exercised `/repo/ollama`'s unusually short content. Real content already in
   `content/repos/*.md` is meaningfully longer — `zed.md`'s own `license: GPL-3.0 /
   AGPL-3.0` (18 characters, the longest in the corpus) renders a full 4-column matrix
   against `vim`/`neovim`/`helix`, with real 6-7-digit comma-formatted star counts. Since
   the table has no `table-layout: fixed` or `min-w-*` floor, its natural width is driven
   by the longest string per column — nothing in either the unit test or the ad-hoc
   geometry check would have caught a regression (or, as it turned out, an *existing*,
   unfixed overflow) on that real page.

Re-ran the Chromium reproduction against `/repo/zed`'s real content (real snapshot
numbers queried directly from `data/repogrove.db`, not placeholders) and confirmed the
second concern was not hypothetical: **68px of real overflow** before any fix, and
**28px still remaining** after the padding-only fix — nowhere near closed.

## Second fix (the one that actually ships)
Padding alone cannot work for arbitrarily long content without wrapping it, so this adds
`table-layout: fixed` (forces every column to the width the layout assigns it,
regardless of content) and `break-words` (lets any cell's text — even a single
unbroken token like `AGPL-3.0` or `102,709` — wrap within that assigned width instead of
forcing the table wider), both scoped to below `sm`:
```diff
- <table className="w-full border-collapse text-left font-sans text-sm">
+ <table className="w-full table-fixed sm:table-auto border-collapse text-left font-sans text-sm">
...
- <th scope="col" className="py-2 pr-2 sm:pr-4 font-mono text-sm font-normal text-text-secondary">
+ <th scope="col" className="w-[30%] py-2 pr-2 font-mono text-sm font-normal text-text-secondary break-words sm:w-auto sm:pr-4">
...
- className={`px-2 sm:px-3 py-2 font-sans text-sm font-semibold ${...}`}
+ className={`px-2 py-2 font-sans text-sm font-semibold break-words sm:px-3 ${...}`}
```
(mirrored on the `<td>`/row-label `<th>` cells in `<tbody>`). The "Parameter" column
gets an explicit `w-[30%]` share below `sm` (readable for labels like "Contributors");
the repo columns split the remaining 70% equally, which is what `table-fixed` does by
default for columns with no explicit width. `sm:table-auto`/`sm:w-auto` restore the
original, unconstrained, content-sized columns at `sm:` and up — unchanged.

Trade-off: below `sm`, long values now wrap onto multiple lines instead of forcing a
wider table — row height grows on mobile for long content (e.g. `/repo/zed`'s license
row), the same "wrap rather than clip" trade-off UX-2026-006 made for the compare page's
Category row.

## Verification
- Regression test rewritten in `tests/components/repo-widgets.test.tsx`; checks EVERY
  cell this time (`columnheader`/`rowheader`/`cell` roles — thead and tbody alike, not
  just thead as the first attempt's test did), using order-independent class-token
  membership (not a fixed substring) so a future class-list reorder can't make the test
  pass vacuously. Confirmed red against the first (padding-only) fix, then against the
  pre-fix component, before confirming green against this fix.
- `npm run lint` / `npx tsc --noEmit` / `npm test` (384/384) all clean locally;
  `npm audit --audit-level=high` 0 vulnerabilities.
- `npm run build` reproduces the known ADR-006 sandbox font-fetch gap (compiles past
  content/data loading first), left to CI for a real, correctly-fonted build.
- **Real-browser geometry reproduction**, against BOTH content profiles, with the real
  `main`/`CARD` ancestor chain, the real `src/app/globals.css` compiled via
  `@tailwindcss/postcss` (no `next/font` involvement, so ADR-006's gap doesn't apply to
  this step), and this sandbox's pre-installed Chromium via Playwright at 390×844 —
  `wrapper.scrollWidth` vs `wrapper.clientWidth` (324px), the exact metric the real CI
  check uses:

  | Content profile | Original (unfixed) | First fix (padding only) | Second fix (table-fixed + break-words) |
  |---|---|---|---|
  | `/repo/ollama` (short: "MIT", "LocalAI"/"vLLM") | 0px over* | 0px over | 0px over |
  | `/repo/zed` (real worst case: "GPL-3.0 / AGPL-3.0", 6-7-digit star counts) | **68px over** | **28px over** | **0px over** |

  *This sandbox's fallback system fonts render `/repo/ollama`'s short content a few px
  narrower than the real, correctly-fonted CI build (which measured 326px vs 324px, a
  real 2px overflow) — expected font-metric noise at this one, already-tight boundary,
  not a modeling error; the `/repo/zed` numbers are two orders of magnitude past that
  noise floor and not sensitive to it.
  Also confirmed at tablet (768px) and desktop (1440px): table width and every row's
  height are byte-identical before/after this fix (`sm:table-auto`/`sm:w-auto` correctly
  restore the original layout untouched).
- Added `/repo/zed` to `tests/design/screenshots.spec.ts`'s `ROUTES`, so the project's
  own real, correctly-fonted CI build now exercises this component's actual worst-case
  content on every future run — not just `/repo/ollama`'s easy case. This is the durable
  fix for the independent review's second finding: a future regression (or a different
  kind of overflow entirely) on the worst-case page will fail CI automatically, the same
  way this finding itself was caught.
- Real post-merge CI screenshot re-verification (the correctly-fonted, authoritative
  check, now covering both `/repo/ollama` and `/repo/zed`) is this PR's own follow-up,
  same pattern as every prior UX-fix in this lane's history that hit the ADR-006 gap.

## Related
UX-2026-006 (`/compare/[a]/[b]`'s Category row) — same bug class (silent `overflow-x-auto`
clipping, no visual affordance), the direct reason the generic rendered-geometry guard in
`tests/design/screenshots.spec.ts` existed to catch this one automatically, and the same
"wrap rather than clip" trade-off this fix's second attempt makes. Also a direct parallel
to UX-2026-006's own history: a first fix that passed every available local check but
didn't actually work, caught only by reproducing the real rendered geometry rather than
trusting code review or a class-presence test alone. Fixed by the dev lane (not design)
under this run's "failing CI on `main`" priority — see issue #116.
