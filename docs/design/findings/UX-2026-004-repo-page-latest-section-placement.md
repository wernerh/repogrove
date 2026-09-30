# UX-2026-004 — "Latest" (releases) section buried the repo page's lead sentence

- **Status: FIXED** (same run it was found in). **Verified: yes** — `npm run lint` /
  `npx tsc --noEmit` / `npm test` (295/295) all pass locally against the reordered page;
  `npm run build` reproduces the known ADR-006 sandbox font-fetch gap (confirmed it
  compiles past this change first), real build left to CI.
- **Severity:** MINOR — not a WCAG failure (both headings/text are still present and
  correctly structured for a screen reader; DOM order now also matches visual order,
  which is an accessibility improvement, not a regression) and no task is blocked, but
  it works against PRODUCT.md §5's explicit intent for the page's most important line
  ("a plain-English explanation... the one thing a stranger should read first").
- **Summary:** The basic news widget (issue #72, PR #74) inserted a new "Latest"
  `<section>` directly after `<StarGrowthChart />` and before the rest of the page's
  editorial content, which begins with the repo's one-sentence tagline (e.g. "Run large
  language models locally." for Ollama) rendered as a plain, unstyled `<Markdown>`
  paragraph. With no distinct lede styling and the "Latest" section's "No recent
  releases." empty-state text directly above it with identical spacing/typography, the
  tagline visually read as a trailing continuation of the news section rather than the
  page's lead sentence — confirmed by rendering the real, CI-committed
  `docs/design/screenshots/repo-ollama__desktop-light.png` (refreshed automatically by
  the `commit-screenshots` job right after PR #74 merged; this run was the first design
  review since the news widget shipped).

## Component
`src/app/repo/[slug]/page.tsx` — the "Latest" `<section>` and its surrounding element
order. No other file changed.

## Found
2026-09-30, design factory run 14 — reviewing the already-committed real screenshots
under `docs/design/screenshots/` refreshed since the last design run (design run 13,
which pre-dates PR #74), per this lane's "look at screenshots before judging" rule and
its own stated next-action priority ("a new dev-lane page needing a pattern" ranks above
the existing backlog items).

## Impact
Every repo page with the news widget shows this (today, any repo with the "Latest"
section rendered at all — both the populated and "No recent releases." empty-state
cases). Low severity per view (the tagline is still legible, just poorly separated), but
high reach as more repo pages/releases get ingested, and it undermines the specific
product goal (spec §5's "one-sentence explanation... read first") that this exact page
element exists to serve.

## Fix
Moved the "Latest" `<section>` (pure JSX relocation, no logic/prop/content changes) from
directly after `<StarGrowthChart />` to the very end of the page, after the "Compared
with" comparisons section and right before the closing `</article>`. This:
- restores the tagline as the first thing a reader sees after the star chart, matching
  PRODUCT.md §5's intent, with nothing else competing for that position;
- matches PRODUCT.md §10's documented page-perspective order (Overview → Alternatives →
  Comparison → Momentum → News) — News was always meant to sit last, not lead;
- keeps the same `mt-6` spacing rhythm as every other section on the page, so no visual
  regression on desktop, tablet or mobile.
An independent reviewer subagent considered placing "Latest" immediately after
`AlternativesTable` (before "Compared with") instead, and concluded end-of-page is
better: it matches the documented order exactly, and an empty "No recent releases."
state reads far less jarring at the bottom of a fully-populated page than sitting right
under the hero chart. Also flagged (and fixed) a first-draft version of this doc's own
component comment citing a file that didn't exist yet at review time — this file is that
fix.

## Verification
- `npm run lint` / `npx tsc --noEmit` / `npm test` (295/295, no test changes needed —
  `tests/app/repo-page.test.tsx` and `tests/app/repo-page-releases.test.tsx` assert
  headings/text by role and content, not DOM order) all clean locally.
- Independent reviewer subagent reviewed the relocated section against the real
  pre-fix screenshot and the product-spec page order, confirmed no accessibility
  regression (both `<h2>`s remain plain siblings inside one `<article>`, no landmark
  changes, DOM order now matches visual order), and confirmed no other design-system
  inconsistency in the touched file.
- `npm run build` reproduces the known ADR-006 sandbox font-fetch gap (confirmed it
  compiles past this change first); the real build, and a refreshed
  `repo-ollama__*.png` screenshot set via `commit-screenshots`, are left to CI —
  post-merge screenshot review is this finding's last verification step (to be
  confirmed by this run's close-out once the PR is merged, or the next design run if
  the lock closes first).

## Related
Issue #72 / PR #74 (basic news widget — the change that introduced this placement).
PRODUCT.md §5 ("Repository Intelligence" page template) and §10 ("Repository Pages
Should Have Multiple Perspectives", the Overview → Alternatives → Comparison →
Momentum → News order this fix now matches).
