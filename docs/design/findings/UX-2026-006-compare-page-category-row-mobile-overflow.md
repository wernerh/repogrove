# UX-2026-006 — Compare page's Category value silently clipped on mobile

- **Status: FIXED (re-diagnosed and re-fixed, design run 18 — the first fix below did
  not actually work).** **Verified: yes** — see "Re-diagnosis" and "Second fix" below for
  the real root cause and what actually resolved it; `npm run lint` / `npx tsc --noEmit`
  / `npm test` (333/333, 1 new this run) clean locally, plus a real-browser geometry
  reproduction (not just a class-presence assertion — see below) at the project's own
  390/768/1440 viewports confirming zero horizontal overflow after the second fix.
- **Original (ineffective) fix, FIRST DRAFT ONLY — do not rely on this section, kept for
  history:** wrote a failing test first (`tests/app/compare-page.test.tsx`), confirmed it
  failed against the pre-fix component, then fixed and re-ran `npm run lint` / `npx tsc
  --noEmit` / `npm test` (330/330, 1 new) clean locally. Independently compiled the new
  Tailwind utility classes (`max-w-32` / `sm:max-w-none` / `break-words`) via
  `@tailwindcss/postcss` directly against `src/app/globals.css` to confirm they resolve to
  real CSS (`max-width: calc(var(--spacing) * 32)` = 8rem/128px below `sm`, `max-width:
  none` at `sm`+) rather than silently no-op'ing as an unrecognized class name. **This was
  all true and all insufficient** — see "Re-diagnosis" below for why passing tests and
  real CSS compilation still shipped a fix with zero actual effect.
- **Severity:** MINOR — not a WCAG failure, and the fix as shipped keeps the content
  visible and in the accessibility tree at every viewport (wrapped onto a second line
  below `sm`, not hidden). Still worth fixing now rather than filing as debt — it's live,
  real content was being clipped today, and the fix is small and contained.
- **Summary:** `/compare/[a]/[b]`'s at-a-glance `FactRow` table has no `table-layout:
  fixed`, so a cell avoids wrapping onto a second line if it can — instead the whole table
  widens past the viewport and the `overflow-x-auto` wrapper makes the overflow reachable
  by horizontal scroll. That scroll has no visual affordance (no scrollbar hint, no edge
  shadow), so on the project's own 390px mobile screenshot viewport, real content past the
  right edge is effectively invisible. This was first design-reviewed clean (design run 13,
  2026-09-30 — "table reflows on mobile with no horizontal scroll, didn't inherit
  AlternativesTable's UX-2026-002 bug") when every repo's `category` list was short enough
  to fit. It no longer is: vLLM's content file now lists three categories
  (`ai, llm, inference`, added since that review), and the real, correctly-fonted
  `compare-ollama-vllm__mobile-light.png` screenshot (refreshed 2026-10-01T17:02:54Z,
  right after dev run 45's PR #95 merged) shows vLLM's Category value cut off mid-word
  ("…ai, llm, inferenc" — the final "e" is past the viewport edge) with no indication
  there's more to scroll to.

## Component
`src/app/compare/[a]/[b]/page.tsx` — the `Category` `FactRow`'s value cell.

## Found
2026-10-01, design factory run 17 — this lane's own "look at screenshots before judging"
step, reviewing the real, correctly-fonted `compare-ollama-vllm__mobile-*.png` screenshots
(refreshed right after dev run 45's content PR merged) as part of this run's routine
re-check for drift/regressions on existing pages, since no new UI had landed to review
directly.

## Impact
Low-to-moderate — the four more important rows (Stars, License, Status, Momentum — "what
is it, is it active, how big is it") were never affected; only the Category row's value
was clipped. Still a real, screenshot-verified regression, and on a two-repo comparison
page specifically, Category is arguably more central to the page's own purpose ("how do
these differ") than it is on `AlternativesTable`'s multi-row listing — a reason the first
draft's fix (below) was revised rather than shipped as first written.

## First draft, revised after review
The first draft of this fix mirrored `AlternativesTable.tsx`'s own UX-2026-002 fix
verbatim: hide the whole `Category` row below Tailwind's `sm` breakpoint (`hidden
sm:table-row`), same as that component hides its own least-essential column. An
independent reviewer subagent (skeptical senior product designer + front-end engineer),
run before any PR opened, found this was a materially worse fix than it looked:
- **Accessibility overclaim.** The draft's comments and this file both claimed the
  content "stays in the DOM" so "any non-visual UA reading the raw DOM still get[s] the
  fact." That's only true for a tool with no CSS engine (`curl`, a crawler). A real screen
  reader (VoiceOver/TalkBack) on the same 390px phone this bug was found on follows CSS
  `display`, not raw DOM — `hidden` is `display:none`, which removes a node from the
  accessibility tree exactly where it was already visually clipped. The fix would not
  have preserved the fact for non-visual users at the affected viewport; it would have
  removed it for them too, which UX-2026-002's own finding (correctly) never claimed
  otherwise.
- **More lossy than necessary.** The table has no fixed/max width constraint other than
  `min-w-[24rem]`, and the Category value had no wrapping class. A `max-width` + wrap on
  just that value (see Fix below) keeps the actual text visible and reachable at 390px
  for everyone, rather than removing it below 640px for everyone — a strictly better
  outcome than hiding, available at the same cost.

Reverted that draft and shipped the wrap-based fix below instead.

## Fix
The Category value's `<span>` gained `inline-block max-w-32 break-words sm:max-w-none`.
`inline-block` makes `max-w-32`/wrapping apply (a bare `<span>` is inline and ignores
width constraints); `max-w-32` (8rem/128px — independently confirmed via
`@tailwindcss/postcss` to compile to `max-width: calc(var(--spacing) * 32)`, matching the
natural width of this table's other value columns at the 390px mobile viewport) forces
the browser to wrap the comma-separated list onto a second line instead of growing the
table past the viewport; `break-words` is a defensive fallback for a future single
category word longer than 128px; `sm:max-w-none` removes the constraint at 640px+,
restoring the original single-line desktop/tablet rendering unchanged. The row itself,
and every other `FactRow`, are untouched.

## Verification
- Wrote `tests/app/compare-page.test.tsx`'s new test first, confirmed it failed against
  the pre-fix component, then implemented the fix and re-ran it green. The test also
  asserts the row is never `hidden` at any breakpoint, guarding against a regression back
  to the reverted first draft.
- `npm run lint` / `npx tsc --noEmit` / `npm test` (330/330, including the new test) all
  clean locally.
- Independently compiled `max-w-32` / `sm:max-w-none` / `break-words` via
  `@tailwindcss/postcss` against the real `src/app/globals.css` (this project's Tailwind
  v4 config has no spacing-scale overrides, so the default `--spacing: 0.25rem` applies)
  to confirm these aren't unrecognized/no-op class names before relying on them.
- `npm run build` reproduces the known ADR-006 sandbox font-fetch gap, left to CI.
- Real-screenshot re-review (`compare-ollama-vllm__mobile-*.png` after this fix's PR
  merges and `commit-screenshots` recommits them) is this lane's next run's first job,
  same pattern as UX-2026-001/UX-2026-002/UX-2026-004's own verification — this is the
  step that confirms the wrap actually renders as intended with real fonts/layout, which
  this sandbox's font-fetch restriction (ADR-006) prevents verifying directly.

## Related
UX-2026-002 (`AlternativesTable.tsx`'s own, earlier version of this exact overflow
problem — same root cause, different fix shape: that component hides its least-essential
*column* rather than wrapping, a defensible tradeoff there given it's one of four
columns and the table has several rows, but — per the review above — not reused here
without re-justifying it for this page's own shape and content). No GitHub issue filed —
fixed in the same run it was found, before any issue would have outlived its own
existence, same precedent as UX-2026-002.

## Re-diagnosis (design run 18, 2026-10-01)
Design run 17's own next action was to re-review the real, CI-rendered screenshot once
`commit-screenshots` recommitted it after the first fix's PR (#96) merged. That review
(this run) found the real screenshot **unchanged** — the exact same mid-word clipping,
pixel for pixel. Confirmed mechanically, not just by eye: the `commit-screenshots` job's
own run on PR #96's merge commit (`ad704bc8`, job id `110499858917`) completed
`success`, but produced **no new commit** — its script does `git add
docs/design/screenshots && git diff --cached --quiet || commit` (see
`.github/workflows/design-screenshots.yml`), so "no commit" means the real, correctly
-fonted post-fix screenshot was byte-identical to the pre-fix one already committed.
The first fix changed real, correctly-compiling CSS (confirmed above) that does nothing
visible in production is a strong, specific signal, not a vague "still looks wrong."

Root-caused by reproducing the exact table (real compiled `globals.css` via
`@tailwindcss/postcss`, the real `FactRow`/`StatusChip`/`MomentumChip` markup, real
`RootLayout`'s `main` wrapper) in an actual Chromium render (Playwright, this sandbox's
pre-installed browser) at the project's own 390/768/1440 viewports, rather than trusting
class-name presence alone a second time:

- `RootLayout`'s `<main className="... max-w-3xl px-6 ...">` leaves **342px** of content
  width at the 390px mobile viewport (390 − 24px × 2 padding), not the 358px or full
  390px an unmeasured guess might assume.
- The table's `min-w-[24rem]` is **384px** — unconditionally, at every viewport,
  including mobile. 384px > 342px **always**, for every comparison page, regardless of
  any individual cell's content. This — not Category's unwrapped text — is what forced
  `overflow-x-auto`'s silent horizontal scroll on every single mobile pageview of this
  route.
- Direct measurement: with the first fix's classes in place, the vLLM Category span's
  own rendered width (100.7px) stayed comfortably under its 128px `max-w-32` cap — it
  never even needed to wrap — while the row's bounding box still extended to 408px
  (24px start + 384px table width), 42px past the 366px visible edge of the scrollable
  wrapper. The span's tail was still being clipped by the wrapper, not by its own
  unconstrained width; constraining the span's own width was fixing a cause that wasn't
  the one actually forcing the overflow.
- Confirmed the floor, not the content, was the actual forcing factor: removing
  `min-w-[24rem]` entirely from the reproduction (keeping everything else, including the
  first fix's `max-w-32`/`break-words`) rendered the full 5-row table at exactly 342px
  wide on mobile with **zero** horizontal overflow (`wrapper.scrollWidth ===
  wrapper.clientWidth`), and with no shrinkage/regression at 768px or 1440px (table
  renders at its natural ~520px width at both, unaffected — matching design run 13's
  already-reviewed tablet/desktop screenshots).

This is also a process finding worth recording plainly: this bug shipped past a green
CI run, a passing unit test, and an independent reviewer subagent, because every one of
those checks (correctly) verified the *code did what it claimed* (real CSS, real classes,
no regression elsewhere) without anyone verifying the *actual rendered geometry* in a
browser — the one thing that would have caught it. `npm test`'s class-presence
assertions are an appropriate check for "is this utility class on the element" but not a
substitute for "does the page actually fit," and this sandbox's inability to run a real,
correctly-fonted `next build` (ADR-006) meant that gap went unnoticed until the next
run's screenshot review — exactly the scenario this lane's "look at screenshots before
judging" rule exists for, and exactly why it's a *rule* and not a formality.

## Second fix
Scoped the table's floor to `sm:` and up instead of removing it outright, preserving the
already-reviewed tablet/desktop rendering unchanged while eliminating it exactly where it
was always harmful:
```diff
- <table className="w-full min-w-[24rem] border-collapse text-left font-sans text-sm">
+ <table className="w-full sm:min-w-[24rem] border-collapse text-left font-sans text-sm">
```
The first fix's `max-w-32`/`break-words`/`sm:max-w-none` on the Category value is kept —
it's a real, independent second guard against a future, even-longer category list
widening the table past 342px on its own, even with the floor gone below `sm`. Neither
fix alone is sufficient on its own for every future case; both together are.

New test (`tests/app/compare-page.test.tsx`, "never forces the table wider... (UX-2026-006
re-fix)") written first and confirmed failing against the pre-this-fix component (`git
stash` the source change, run the test, confirm red; restore, confirm green) —
asserts the table's class list contains `sm:min-w-[24rem]` and no unqualified `min-w-*`
utility at all, so a regression back to an unconditional floor fails loudly in CI next
time, rather than silently reproducing this exact bug again.

**Independent review (subagent, skeptical senior product designer + front-end engineer)
caught one real gap before this was considered closed:** that new unit test is itself only
a class-presence assertion (jsdom, no real layout engine) — the exact same category of
check that let the *first* fix ship broken (real CSS, real classes, a passing test, zero
actual effect). A future regression that reintroduces overflow by some *other* means (not
necessarily an unqualified `min-w-*`) would still only be caught by the next run's manual
screenshot review, same gap as before.

Closed that gap with a second, generic regression guard in the Playwright harness itself
(`tests/design/screenshots.spec.ts`): every route, at every viewport this harness already
covers, now asserts there is no element with computed `overflow-x: auto|scroll` whose
`scrollWidth` exceeds its `clientWidth` (1px rounding tolerance) — the actual rendered-
geometry check this whole bug class needed, not a proxy for it. Verified the check itself
works before relying on it: ran it (standalone, via the sandbox's pre-installed Chromium)
against the pre-fix reproduction (flagged the real `overflow-x-auto` wrapper, 384px
scrollWidth vs 342px clientWidth) and the post-fix reproduction (zero offenders). This
runs inside the existing report-only, non-blocking workflow
(`.github/workflows/design-screenshots.yml` — "does not gate merges", ADR-007), so it
adds a real, durable signal without creating a new way for an unrelated change to block
another lane's PR.
