# UX-2026-003 — StatusChip and MomentumChip rendered as visually indistinguishable

- **Status: FIXED** (same run it was found in). **Verified: yes** — re-ran
  `npm run lint` / `npx tsc --noEmit` / `npm test` (161/161) after the fix; real-screenshot
  re-review is next run's job once this PR's `commit-screenshots` job recommits
  `repo-ollama__*.png` (same pattern as UX-2026-002's own verification note).
- **Severity:** MAJOR — not a WCAG failure (axe-core's prior scans already passed; icon
  is decorative and paired with a distinct text label per SC 1.4.1), but this is
  RepoGrove's stated "killer feature" territory going the other way: momentum (spec §7,
  §23) exists specifically to tell a browsing user something the plain repo metadata
  doesn't. A repo page that visually renders two different claims as the same badge
  actively undermines that, for the single most common case (an actively-maintained,
  steadily-growing repo) rather than an edge case.
- **Summary:** `content/repos/*.md`'s hand-authored `status` field (active/maintained/
  inactive) and the newly-shipped, computed Grove Heat/momentum label (rising/active/
  slowing/dormant, issue #21/ADR-004, PR #59) are genuinely different claims about a
  repo — one editorial ("is this still maintained"), one a growth signal ("is interest
  accelerating"). Both `StatusChip` and `MomentumChip` rendered their "active" state as
  an identical 🟢 dot plus the word "Active," in visually identical pill chips, sitting
  directly next to each other in `/repo/[slug]`'s metadata row. Every one of today's 5
  real repos is `status: active`, and ollama — the one repo with enough snapshot history
  for `computeHeat` to produce a label — reads `momentum: active` too, so this collision
  is not a hypothetical: the real, committed `repo-ollama__desktop-light.png` screenshot
  (from this run, on `main` before the fix) shows "Status: 🟢 Active  Momentum: 🟢
  Active" — two chips that read as a duplicated claim, not two distinct signals.
  Pre-flagged by design run 8 as issue #52 before momentum shipped; nobody had done the
  "deliberate pass together" issue #52 asked for before PR #59 wired the momentum chip
  in reusing the same icon set.

## Component
`src/components/StatusChip.tsx` (fixed) and `src/components/MomentumChip.tsx`
(unchanged — its 🔥/🟢/🟡/⚪ icon set is spec-locked, see Fix below). Both render on
`src/app/repo/[slug]/page.tsx`; `StatusChip` also renders in
`src/components/AlternativesTable.tsx`'s Status column.

## Found
2026-09-29, design factory run 11 — reviewed the real, correctly-fonted
`repo-ollama__*.png` screenshots recommitted after dev run 24 shipped Grove Heat v1
(PR #59), per this lane's "look at screenshots before judging" step. Confirmed by
reading both components' source directly alongside the screenshot.

## Impact
Medium-high reach, low severity-per-view: every repo page with a computed momentum
label shows both chips (today: just `/repo/ollama`, but this is issue #21's whole
point — the count only grows as ingestion history accrues for the other 4 repos).
Doesn't block any task (both labels are still individually legible and correct), but
actively works against the product's own differentiation between "maintained" and
"trending" — the exact distinction spec §7's Grove Heat concept exists to draw out.

## Fix
Changed `StatusChip`'s icon from an emoji dot (🟢/🟡/⚪) to a plain square swatch
rendered via `bg-current` (ties to the chip's own text-color class, no separate color
prop) — shape differs from MomentumChip's circular dot regardless of which color pair
happens to match. `MomentumChip` was **not** changed: its icon set is explicitly
spec-locked in `DESIGN-SYSTEM.md`'s Open questions ("the momentum chip icons —
🔥/🟢/🟡/⚪ — are the one place emoji-as-icon is already spec'd and stays as-is"), so
the fix had to move on the other chip.

**First attempt didn't actually work, caught before merge.** The first version used
`rounded-sm` (this codebase's 4px radius token) on a 10px swatch box. An independent
reviewer subagent, asked to critique the fix as a designer rather than just read the
diff, rendered both versions with real Playwright screenshots at real chip size and
found 4px rounding on a 10px box (40% of the box, close to `rounded-full`'s 50%) reads
as a circle at a glance — the exact same shape as MomentumChip's dot, just a slightly
squarer one. The fix would have passed its own unit tests (which only asserted the
Tailwind class string, not the rendered shape) and shipped without solving the
collision it exists for. Re-rendered several alternatives directly
(`/tmp/.../swatch-test/`, not committed — a one-off comparison, not a reusable asset)
before picking the fix that actually reads as unambiguously square next to a filled
circle: `rounded-none` (a true 0-radius square) at a slightly larger 12px box. The
regression test now asserts `rounded-none` specifically, not just "isn't
`rounded-full`" — the broken first version also passed that weaker assertion.

A square vs. a circular dot is a real shape distinction, not just a color one — it
survives a colorblind or low-contrast viewing condition the same way the icon+label
pairing already does for WCAG 1.4.1, and needs no new emoji or icon asset, *provided
the radius is small enough relative to the box that it still reads as a corner and not
a curve* — the lesson this finding's own fix attempt needed to learn once instead of
shipping a false positive. `DESIGN-SYSTEM.md`'s Status chips component-pattern spec and
Open questions section updated to record the resolution, including this correction;
issue #52 closed.

## Verification
- `npm run lint` / `npx tsc --noEmit` / `npm test` (161/161, 5 updated in
  `tests/components/status-chip.test.tsx` plus 1 in `tests/app/repo-page.test.tsx`) all
  clean locally, against the corrected (`rounded-none`) version.
- A real Playwright render comparing the emoji dot, the rejected `rounded-sm`/10px
  attempt, and the shipped `rounded-none`/12px square side by side confirmed the shape
  difference is actually perceptible before this PR was opened — not deferred to
  post-merge screenshot review this time, precisely because that's what let the first
  attempt look fine in isolation.
- `npm run build` reproduces the known ADR-006 sandbox font-fetch gap, left to CI.
- Real-screenshot re-review of the actual page (`repo-ollama__*.png` after this fix's PR
  merges and `commit-screenshots` recommits them, real fonts/chrome/pill styling, not
  the isolated comparison above) is this lane's next job this same run, once CI produces
  them — same pattern as UX-2026-001/002's own verification notes.

## Related
Issue #52 (filed design run 8, closed by this fix). `docs/adr/ADR-004` (Grove Heat v1,
dev run 24, PR #59 — the change that made this collision real rather than theoretical).
