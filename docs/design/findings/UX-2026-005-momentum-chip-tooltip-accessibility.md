# UX-2026-005 — MomentumChip's signals were inspectable on hover only, not by keyboard, touch, or (reliably) screen reader

- **Status: FIXED** (same run it was found in, via a pre-flagged TECH-DEBT.md row —
  design run 12/13 already named this, not newly discovered this run). **Verified:
  yes** — `npm run lint` / `npx tsc --noEmit` / `npm test` (309/309: 3 new/updated in
  `tests/components/momentum-chip.test.tsx`, replacing the old title-tooltip
  assertion, plus 1 new in `tests/app/compare-page.test.tsx` for the two-instance
  table-row case) all clean locally. `npm run build` reproduces the known ADR-006
  sandbox font-fetch gap (confirmed it compiles past this change first), left to CI's
  GitHub-hosted runner. Real, correctly-fonted post-merge screenshots (desktop/tablet/
  mobile × light/dark of `/repo/ollama` and `/compare/ollama/vllm`) still need review
  once `commit-screenshots` recommits them — the collapsed state renders identically to
  before (same chip chrome), so no visual regression is expected, but that's a claim to
  verify against the real render, not assert from source alone; noted as this lane's
  next-run follow-up rather than blocking this fix.
- **Severity:** MAJOR — not a fabricated or missing signal (the data was always
  correct), but a WCAG-adjacent reach failure: `docs/design/DESIGN-SYSTEM.md`'s own
  Momentum/Heat contract requires the underlying signals be "inspectable on hover/
  expand, never just the badge alone" as an explicit UX requirement, and a native
  `title` tooltip technically satisfies "hover" for a sighted mouse user while excluding
  keyboard users entirely (no focus, no trigger), touch users entirely (no hover concept
  on most touchscreens), and screen reader users unreliably (browser/AT-dependent
  whether `title` on a plain `<span>` is announced at all). Every one of those users
  could see *that* a repo was Rising/Active/Slowing/Dormant, but only a subset could
  ever get to *why* — the exact distinction spec §7/§23's Grove Heat concept exists to
  make legible, silently unavailable to part of the audience.
- **Summary:** `src/components/MomentumChip.tsx` exposed `heat.signals` (star growth,
  open issues, contributor growth — see `src/lib/heat.ts`) by joining them into one
  string and setting it as the chip `<span>`'s `title` attribute. `TECH-DEBT.md`'s
  2026-09-29 row (filed by the design lane, own component) named this precisely: "not
  reliably read by screen readers, no keyboard/touch trigger." Fixed this run by
  converting the chip into a real interactive disclosure.

## Component
`src/components/MomentumChip.tsx`. Renders on `src/app/repo/[slug]/page.tsx` (inside
the metadata `<dl>`) and `src/app/compare/[a]/[b]/page.tsx` (inside a `<table>` cell,
up to twice per page — once per compared repo).

## Found
Originally named 2026-09-29 (design run 12's own TECH-DEBT.md row, filed against the
component this same lane had just shipped in run 11) as a known placeholder, not an
oversight — `docs/adr/ADR-004`'s v1 scope note already flagged the mechanism as
undecided. Picked up this run (design run 15) per `.factory/state.yaml`'s own recorded
"next major task" queue (run 13's close-out: "MomentumChip's tooltip-only signal
exposure ... first, then AlternativesTable's non-interactive sort").

## Impact
Every repo page with a computed momentum label (today: any repo with ≥2 calendar days
of snapshot history — `ollama` and `vllm` for real, more as ingestion history accrues)
shows this chip. Anyone using a keyboard, a touchscreen, or most screen readers could
see the label but never reach the "why" behind it — a full category of users, not an
edge case, and on the one feature spec §7 calls RepoGrove's differentiation from a
plain GitHub mirror.

## Fix
Converted `MomentumChip` to the WAI-ARIA "disclosure (show/hide)" pattern
(https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/): the chip is now a real
`<button type="button">` with `aria-expanded`/`aria-controls`, reachable by Tab and
activated by Enter/Space/tap — all native `<button>` behavior, no custom key handling
written. `aria-controls` points at a signal panel (a `<dl>` of label/detail pairs,
including unavailable signals as "not enough data yet" — never silently dropped) that's
always present in the DOM (so the id always resolves for assistive tech) but hidden via
the native `hidden` attribute until expanded. A trailing `sr-only` span ("— show/hide
momentum signals") is included in the button's accessible name so a screen reader user
hears a reason to activate it, not just the bare state label. The icon stays
`aria-hidden` and the icon+label+color triad is unchanged (WCAG 1.4.1 already satisfied
before this fix; not what was broken).

**Independent review before merge (subagent, skeptical senior product designer + front-
end engineer) found one real MAJOR, not caught in the first draft:** `/compare/[a]/[b]`
renders two `MomentumChip` instances in the same table row (one per compared repo),
each with fully independent `useState` — expanding only one side grows that `<td>`
taller than its sibling, and `FactRow`'s cells had no `vertical-align` set, so the
browser's default cell-centering would visibly misalign the row's label and both values
for as long as only one side was expanded. Fixed pre-push: `align-top` added to every
cell `FactRow` renders (`src/app/compare/[a]/[b]/page.tsx`), plus a new test
(`tests/app/compare-page.test.tsx`) expanding one repo's chip and asserting the row
stays `align-top` throughout, the sibling button/panel are unaffected, and the two
instances' `aria-controls`/panel `id` pairs never collide (`useId()` is scoped per
component instance in the render tree, not a global counter — verified, not just
assumed). Two lower-severity items from the same review were filed as their own new
TECH-DEBT.md rows rather than fixed in this PR to keep it scoped: a pre-existing (not
introduced here) dark-mode `ring-offset-color` gap shared by every `focus:ring-offset-2`
button in the codebase, now more visible with up to two `MomentumChip` instances per
page instead of none; and an empty-`heat.signals` defensive-fallback gap that can't
happen with real data today (`computeHeat` always returns exactly 3 signals whenever it
returns non-null).

**Trade-off named, not hidden:** before this fix, a sighted mouse user got the "not
enough data yet" contributor-growth note for free on hover; it now requires a click.
This is the correct trade given the old mechanism excluded keyboard/touch/most-SR users
entirely — but it is a real cost for the one audience the old approach did serve, worth
naming rather than treating this as a pure win. A supplementary hover-preview for mouse
users (without weakening the accessible disclosure underneath) is a reasonable future
enhancement, not required for this fix.

## Verification
- `npm run lint` / `npx tsc --noEmit` / `npm test` (309/309) clean locally.
- `npm run build` reproduces the known ADR-006 sandbox font-fetch gap (confirmed it
  compiles past this change first) — left to CI's GitHub-hosted runner.
- Manual trace of the accessible-name computation (button's visible "Active"/etc. text
  plus the `sr-only` hint, both non-`aria-hidden` descendants) confirms the hint is
  actually included in what a screen reader announces, not just visually adjacent —
  checked against the accname algorithm, not assumed from the JSX alone.
- Confirmed directly against the installed Tailwind v4 (`node_modules/tailwindcss/
  preflight.css`) that its `[hidden]` rule (`display: none !important`) cannot be
  overridden by the panel's own `flex` utility class — the native `hidden` attribute
  genuinely hides it, not just visually.
- Real, correctly-fonted post-merge screenshots still need a human/agent look once CI's
  `commit-screenshots` job recommits them — tracked as this lane's next-run follow-up,
  not blocking this fix (collapsed-state chrome is visually unchanged from before).

## Related
`TECH-DEBT.md`'s 2026-09-29 design-lane row (now marked resolved, pointing here).
`docs/adr/ADR-004-grove-heat-v1.md` (the original ship of `MomentumChip`, which flagged
the tooltip as a known v1 placeholder). `docs/design/DESIGN-SYSTEM.md`'s Momentum/Heat
component contract (the "inspectable on hover/expand" requirement this fix satisfies for
real). Two new TECH-DEBT.md rows filed alongside this fix (dark-mode `ring-offset-color`,
empty-`heat.signals` fallback) for the review's lower-severity findings.
