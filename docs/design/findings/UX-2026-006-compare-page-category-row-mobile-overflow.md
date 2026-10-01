# UX-2026-006 — Compare page's Category value silently clipped on mobile

- **Status: FIXED** (same run it was found in; the fix shipped was a revised, less lossy
  second draft — see "Revised after review" below). **Verified: yes** — wrote a failing
  test first (`tests/app/compare-page.test.tsx`), confirmed it failed against the pre-fix
  component, then fixed and re-ran `npm run lint` / `npx tsc --noEmit` / `npm test`
  (330/330, 1 new) clean locally. Independently compiled the new Tailwind utility classes
  (`max-w-32` / `sm:max-w-none` / `break-words`) via `@tailwindcss/postcss` directly
  against `src/app/globals.css` to confirm they resolve to real CSS (`max-width:
  calc(var(--spacing) * 32)` = 8rem/128px below `sm`, `max-width: none` at `sm`+) rather
  than silently no-op'ing as an unrecognized class name.
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
