# UX-2026-002 — Alternatives table's Category column forced horizontal scroll on mobile

- **Status: FIXED** (same run it was found in). **Verified: yes** — re-ran
  `npm run lint` / `npx tsc --noEmit` / `npm test` (135/135) after the fix; no visual
  regression tooling was re-run this same run (see Verification below for what will
  confirm it against a real screenshot).
- **Severity:** MINOR — not a WCAG failure (axe-core's 18/18 scan already passed against
  the pre-fix table: a horizontally scrollable region within a page is a valid pattern,
  and no content was actually unreachable, only reachable via scroll rather than at a
  glance) and only the least-essential column was affected. Still worth fixing rather
  than filing as debt, since the fix was a small, contained CSS change.
- **Summary:** `AlternativesTable.tsx`'s open-source alternatives table used
  `min-w-[28rem]` (448px) across all four columns (Project/Status/Stars/Category) with
  an `overflow-x-auto` wrapper as the only mobile accommodation. At the project's own
  390px mobile screenshot viewport (`playwright.config.ts`), that pushed the table wider
  than the viewport — the real, correctly-fonted `repo-ollama__mobile-light.png`
  screenshot (PR #57's post-merge `commit-screenshots` run) shows only three columns
  (Project/Status/Stars) on screen; "Category" and its values are scrolled off to the
  right, requiring a horizontal swipe inside the table to see at all.

## Component
`src/components/AlternativesTable.tsx` — the open-source alternatives `<table>`, both
`<thead>` and the per-row `<td>`.

## Found
2026-09-29, design factory run 10 — this lane's own "look at screenshots before judging"
step, reviewing the real, correctly-fonted `repo-ollama__mobile-*.png` screenshots that
landed right after PR #57 (this same run's major task, the alternatives table) merged.

## Impact
Low — the two more important columns (which project, whether it's active/resolved, how
big it is by stars) were always visible without scrolling; only the least essential
column (primary category) needed a scroll to reach. Still a real, screenshot-verified
gap from a clean mobile-first experience for a component this lane just shipped as the
site's stated "killer feature."

## Fix
`Category`'s `<th>`/`<td>` gained `hidden sm:table-cell` (Tailwind's default `sm`
breakpoint, 640px — the codebase already relies on Tailwind's built-in scale in practice,
e.g. `RepoCard`'s `md:grid-cols-2`, even though `DESIGN-SYSTEM.md`'s own documented
breakpoint numbers, `sm=480`, were never actually wired into the Tailwind theme; not
changed here, out of scope for this fix). At 390px (mobile) this drops the column
entirely — no horizontal scroll needed for the three columns that remain; at 768px
(tablet) and 1440px (desktop) it's unaffected, `sm:min-w-[28rem]` still applies.
`overflow-x-auto` stays as a defensive fallback (e.g. a future longer project name), not
the primary mobile strategy anymore.

## Verification
- `npm run lint` / `npx tsc --noEmit` / `npm test` (135/135, no test changes needed — the
  existing unit tests assert on text content, not CSS visibility) all clean locally.
- `npm run build` reproduces the known ADR-006 sandbox font-fetch gap, left to CI.
- Real-screenshot re-review (`repo-ollama__mobile-*.png` after this fix's own PR merges
  and `commit-screenshots` recommits them) is this lane's next run's first job, same
  pattern as UX-2026-001's own verification.

## Related
Found while reviewing PR #57 (issue-free — picked up directly from
`DESIGN-SYSTEM.md`'s own "next major task" note, design run 9). No GitHub issue filed —
fixed in the same run it was found, before any issue would have outlived its own
existence.
