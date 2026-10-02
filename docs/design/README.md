# Design lane — index

Owns `docs/design/`, the `design:` block in `.factory/state.yaml`, UI/UX/accessibility
findings (`docs/design/findings/UX-YYYY-NNN-*.md`), and `docs/design/DESIGN-SYSTEM.md`.
No API, data model, auth, or feature work — file a dev-lane issue instead.

## Status
Run 1 (2026-09-27) wrote v1 of both `UX-PRINCIPLES.md` (personas + journeys + design
principles, derived from `PRODUCT.md`/spec, clearly labelled ASSUMPTION) and
`DESIGN-SYSTEM.md` (color/type/spacing/radius/elevation/motion tokens, WCAG-validated,
plus component pattern specs for cards, the alternatives table, status/momentum chips,
dates, loading/empty/error states, page headers).

Run 2 (2026-09-28) wired those tokens into code (`src/app/globals.css`'s Tailwind v4
`@theme`/`@theme inline` blocks, now that Phase 1 pages exist) and restyled the four
existing pages to consume them instead of raw Tailwind defaults. Verified with
Playwright screenshots (light/dark × desktop/tablet/mobile); an independent review
caught and fixed a CSS cascade-layer bug and a spec-drifted `<h1>` size before merging
as PR #25 (briefly blocked by an unrelated main-CI break, issue #26, fixed by the dev
lane's PR #27).

Run 3 (2026-09-28) built the reusable screenshot + axe-core harness this lane's mission
calls for: `@playwright/test` + `@axe-core/playwright` as devDependencies,
`playwright.config.ts` (6 projects: desktop/tablet/mobile × light/dark),
`tests/design/screenshots.spec.ts` (screenshots + a WCAG 2.1 A/AA axe-core scan per
route), `scripts/design/static-server.mjs` to serve the static export locally, and
`npm run design:screenshots` to run it — see
`docs/adr/ADR-007-design-screenshot-a11y-harness.md`. Verified the harness's mechanics
end-to-end this run (18/18 checks passed, 0 axe violations) against a temporary,
uncommitted local build; this sandbox can't fetch the Google Fonts the real build now
needs (ADR-006), so real screenshots with the actual typefaces are the next run's or
CI's job once that network access is available. RG-4 still unanswered as of this run
(two days from its 2026-09-30 default).

Run 4 (2026-09-28) wired the harness into CI: `.github/workflows/design-screenshots.yml`
(new, separate, path-filtered, non-required workflow — see ADR-007's addendum). Its
first real run, on PR #39 itself, built the real production build (fonts fetched
successfully on the GitHub-hosted runner) and ran all 18 checks for real: **18/18
passed, 0 axe-core WCAG 2.1 A/AA violations** across `/`, `/grove/ai`, `/repo/ollama` ×
desktop/tablet/mobile × light/dark. This is the first automated accessibility signal
against the actual typeface stack, and it's clean. The 18 real screenshots exist as a
GitHub Actions artifact but could not be downloaded into this sandbox this run (its
network allowlist blocks GitHub's artifact-storage backend, confirmed via a direct
`curl` 403 — see `TECH-DEBT.md`), so they have not yet been visually reviewed — the
"look at screenshots before judging" step is still outstanding for the real build.
RG-4 still unanswered (`.factory/decisions.yaml`; due 2026-09-30).

Run 5 (2026-09-28) re-checked whether this sandbox can reach GitHub's artifact-storage
backend to download the real screenshots from PR #39's run — still blocked (`403` at
the egress proxy, same as run 4). Drafted the auto-commit path `TECH-DEBT.md` named as
the third option (a `commit-screenshots` job in `design-screenshots.yml`, scoped to
`push: [main]` only, with its own `permissions: { contents: write }`, downloading the
`screenshots` job's artifact and committing changed PNGs straight to
`docs/design/screenshots/` — see ADR-007's addendum 2), but did **not** ship it: this
environment declined the attempt to commit a workflow file requesting write access as
a "Permission Grant" this factory can't self-authorize, even scoped to one job and even
for something as low-risk as committing screenshots. Filed as a new owner decision
(`.factory/decisions.yaml` RG-6) and emailed the owner instead — the job itself is
fully drafted and ready to implement once that's answered. RG-4 still unanswered
(checked the email thread again this run — no new reply since the
2026-09-27T17:32:04Z message; due 2026-09-30).

Run 6 (2026-09-28): RG-6 was answered ("1 go ahead", found by dev run 14, re-verified
directly against the email thread this run with no newer reply), so this run drafted
and attempted to add `commit-screenshots` (a second job in
`.github/workflows/design-screenshots.yml`, matching ADR-007's addendum 2's core
design plus two deviations — gated on the upstream job not being cancelled (not only
on a clean success, so a red axe-core run still gets its images committed for review),
and a fetch-rebase-retry push loop mirroring `ingestion.yml`'s (addendum 2 had
explicitly decided against one; see addendum 3 for why this run added one anyway).
**The
attempt to stage it was declined again**, tagged "Permission Grant" — the same
category run 5 hit, but this time *after* the owner's recorded approval, which is the
new finding: this environment's own safety layer blocks a self-granted `contents:
write` workflow permission regardless of whether `.factory/decisions.yaml` shows it
answered, because it has no way to see that state. Reverted rather than routed around
(retrying via another tool or a smaller diff would be pursuing the same denied
outcome, not a different one). See ADR-007's addendum 3, which carries the exact,
still-correct job YAML for the owner (or a human-supervised session) to paste in
directly — this no longer looks like something a future unattended factory run can
complete on its own. RG-4 re-checked again this run (`get_thread` on the same thread)
— still no new reply since 2026-09-27T17:32:04Z; due 2026-09-30, ~2 days off.

Run 7 (2026-09-29): RG-6's real, correctly-fonted screenshots (committed under
`docs/design/screenshots/*.png` since security run 7) got their first actual visual
review — this lane's stated "look at screenshots before judging" step, finally possible
for real. Reviewed all three routes × both themes × all three viewports (18 images).
Found one real, screenshot-verified defect: the header logo (`🌱 RepoGrove`) and the
homepage's `🌳 Groves` heading used literal leaf/tree emoji, directly contradicting
`DESIGN-SYSTEM.md`'s own documented brand rationale ("a quiet nod to 'Grove' without an
illustrated leaf anywhere"); the homepage's `📦 Repositories` heading isn't foliage but
was removed alongside it for heading-to-heading consistency — see
`docs/design/findings/UX-2026-001-brand-mark-leaf-emoji.md`. Everything else held up:
type hierarchy (sans chrome / serif prose / mono stats/dates/slugs) renders correctly
with real fonts, dark-mode brand-teal contrast reads as intended (not a bug —
`text.link`'s brand-70 is a deliberately dark, high-contrast teal, easy to mistake for
near-black at small serif sizes, checked against the token value directly), the
star-growth chart and momentum status label (🟢 Active) match their specs, and
mobile/tablet layouts reflow cleanly with no overflow. Fixed the emoji finding (2-file,
content-only change, issue #50), independent-reviewed pre-commit, verified locally
(lint/tsc/test 75/75/audit clean; build reproduces the known ADR-006 sandbox font-fetch
gap, left to CI). RG-4 re-checked again this run (`get_thread`) — still no new reply
since the 2026-09-27T17:32:04Z message; due 2026-09-30, one day off. PR #51 merged
(squash, 6/6 CI checks green); the `commit-screenshots` job fired on the resulting push
and recommitted refreshed screenshots (`376fe6a`) — reviewed the refreshed homepage
screenshot directly and confirmed the fix end to end, no layout/spacing artifact from the
emoji removal.

Run 8 (2026-09-29): closed out issue #41 (RG-6) — it had been left open as `needs-human`
even though the owner applied the drafted `commit-screenshots` job directly to `main`
himself (commit `517c8e4`) and it's been working since (confirmed again this run).
Then built the first real **status chip** component (`src/components/StatusChip.tsx`)
against `DESIGN-SYSTEM.md`'s Component patterns spec, replacing `/repo/[slug]`'s
plain-text `STATUS_LABEL` map ("🟢 Active" as one unstyled string, no color token) with a
real icon+label pill using the `success`/`warning`/`text.secondary` semantic tokens.
Flagged (in `DESIGN-SYSTEM.md`'s Open questions) a real icon-collision risk for whoever
builds the future Momentum/Heat chip (issue #21/ADR-004): it shares the exact 🟢/🟡/⚪
icon set with this status chip for a different concept (computed growth signal vs.
hand-authored editorial classification), so a repo could show contradictory-looking
same-color chips once momentum lands — not blocking now since momentum doesn't exist yet
to compare against, but worth a deliberate pass when it does. Added component test
coverage (`tests/components/status-chip.test.tsx`) and updated the repo-page test for the
new icon/label DOM split. RG-4 re-checked (`get_thread`) — still no new reply since
2026-09-27T17:32:04Z; due 2026-09-30 (tomorrow) — next run applies the recommended default
if still unanswered. Validated locally: lint clean, `tsc --noEmit` clean, tests 79/79
(4 new), `npm audit --audit-level=high` 0 vulns; build reproduces the known ADR-006
sandbox font-fetch gap, left to CI. Real-screenshot review of the rendered chip is next
run's job once CI's build lands this PR's screenshots. **Next major task:** the repo/Grove
card pattern — homepage still renders a plain `<ul>` of links instead of the specced card,
and there's now enough content (5 repos, 2 Groves) to make a real grid worth reviewing.
PR #53 merged (squash, 6/6 CI checks green, including a real `next build` on CI's
GitHub-hosted runner); the `commit-screenshots` job fired on the resulting push and
recommitted refreshed `repo-ollama__*` screenshots — reviewed all 6 (light/dark ×
desktop/tablet/mobile) directly and confirmed the chip end to end: clean pill shape,
readable green text in both themes, no layout shift, reflows correctly on mobile.

Run 10 (2026-09-29) built the alternatives comparison table — the site's stated "killer
feature" (spec §3-4) and this lane's own next-major-task pick from run 9 —
`src/components/AlternativesTable.tsx`, wired into `/repo/[slug]`. `repo.alternatives`
(frontmatter, already structured) had never been rendered anywhere before; the repo
page's own "## Alternatives" Markdown section was explicitly placeholder prose ("until
Phase 3 builds alternative pages"). Resolves each open-source alternative slug against
`/content/repos` (most don't have a page yet — real repos link with live status/stars,
unresolved ones show their raw slug in mono, unlinked, labeled "Not yet profiled" —
never a link that 404s); commercial alternatives render as a plain unlinked chip list.
One deliberate, recorded v1 reduction from the original spec line: not interactively
sortable (`aria-sort`) — `language`/`hosting`/activity aren't in the content model yet,
leaving one real sortable column (`stars`), so rows are pre-sorted server-side instead of
needing a client component. Independent review before merge found no BLOCKER/MAJOR bugs
but flagged two real silent-failure-mode gaps in `src/lib/content.ts`, both fixed this
run: no validation against a duplicate or self-referencing `alternatives` slug (added
`assertValidAlternatives`, fails the build loudly like the existing
`assertNoGithubCollisions`), and no signal if a repo declares `alternatives` but its body
loses the "## Alternatives" heading `splitOutSection` needs (added a build-time throw —
otherwise the old placeholder prose would silently render duplicated alongside the new
table). Validated locally: lint clean, `tsc --noEmit` clean, tests 135/135 (15 new),
`npm audit --audit-level=high` 0 vulns; build reproduces the known ADR-006 sandbox
font-fetch gap, left to CI. PR #57 merged (squash, 5/5 gating CI checks green plus the
non-gating axe-core job — 18/18 checks, 0 WCAG 2.1 A/AA violations); `commit-screenshots`
fired on the resulting push and recommitted refreshed `repo-ollama__*` screenshots,
reviewed directly this same run (`/repo/ollama` has both a resolved alternative, vLLM,
and two unresolved ones, LM Studio/LocalAI — the mixed case this component needed to
prove out). Desktop/tablet held up exactly as specced in both themes; mobile did not —
`Category` was pushed off-screen by the table's fixed `min-w-[28rem]`, needing a
horizontal scroll to reach at the project's own 390px mobile viewport. Filed and fixed in
the same run as UX-2026-002 (MINOR — not a WCAG failure, axe-core's 18/18 already passed
against the unfixed version, but a real rough edge on a component this lane just shipped
as the site's stated "killer feature"): `Category` now hides below Tailwind's default
`sm` breakpoint instead of forcing a scroll for it. Re-validated (lint/tsc/tests 135/135
all clean; no test changes needed) and pushed as a same-run follow-up PR. RG-4
re-checked (`get_thread`) — still no new reply since 2026-09-27T17:32:04Z; due
2026-09-30 (tomorrow).

Run 11 (2026-09-29) fixed a real, screenshot-confirmed defect: dev run 24's new
`MomentumChip` (Grove Heat v1, PR #59) reused `StatusChip`'s exact 🟢/🟡/⚪ icon set,
exactly the collision issue #52 (design run 8) had flagged in advance — the real
`repo-ollama__*.png` screenshots showed "Status: 🟢 Active" and "Momentum: 🟢 Active"
rendering as visually identical pills. Fixed by giving `StatusChip` a distinct icon
shape (a plain, hard-edged square swatch via `bg-current`, not a dot) rather than
touching `MomentumChip`, whose 🔥/🟢/🟡/⚪ set is spec-locked in `DESIGN-SYSTEM.md`. An
independent reviewer subagent caught a real problem with the first attempt before
merge: `rounded-sm` (4px) on the swatch's small 10px box rendered as a circle, not a
square, at a real size — verified by actually rendering both versions side by side with
Playwright, not just reading the diff — so the fix would have shipped without solving
the collision it was for. Revised to `rounded-none` at a 12px box, re-rendered to
confirm the shape is now genuinely distinct from MomentumChip's dot, and tightened the
regression test to assert the specific class rather than only ruling out
`rounded-full`. See
`docs/design/findings/UX-2026-003-status-momentum-chip-icon-collision.md`. Issue #52
closed. Validated locally: lint clean, `tsc --noEmit` clean, tests 161/161 (5 updated),
`npm audit --audit-level=high` 0 vulns; build reproduces the known ADR-006 sandbox
font-fetch gap, left to CI. PR #60 merged (squash, 4/4 gating CI checks green plus the
non-gating axe-core job); `commit-screenshots` recommitted refreshed `repo-ollama__*.png`
screenshots, reviewed all 6 (light/dark × desktop/tablet/mobile) directly this same
run — the square swatch reads clearly distinct from the round momentum dot everywhere,
no layout regression, `AlternativesTable`'s Status column unaffected. RG-4 re-checked
(`get_thread`) — still no new reply since 2026-09-27T17:32:04Z; due 2026-09-30
(tomorrow).

Run 13 (2026-09-30): RG-4 re-checked (`get_thread`) — still exactly 3 messages, no new
reply since 2026-09-27T17:32:04Z. `default_due_at` (2026-09-30T00:00:00Z) has now
passed, so this run applied the recommended default for real — status moved
OPEN -> DEFAULTED in `.factory/decisions.yaml`, "Editorial/content-forward" is now the
recorded answer (formalizing what every run has already been building against since
run 1), and issue #8 (which tracked RG-2/3/4 together) was closed. This run's major
task: the screenshot + axe-core harness (`tests/design/screenshots.spec.ts`) had only
ever covered the 3 Phase 1 routes since design run 9 last touched it — six shipped
pages (`/trending` #19, `/rising` #20, `/alternative/[slug]` #61, `/compare/[a]/[b]`
#62, `/search` #63, plus the newsletter section #71 added to the homepage) had never
been screenshotted or WCAG-scanned by this lane. Extended `ROUTES` with one entry per
still-uncovered page family (`/trending`, `/rising`, `/alternative/notion`,
`/compare/ollama/vllm`, `/search`; `/` re-captures the newsletter section under its
existing entry) — see PR #73. Independent reviewer subagent (skeptical senior product
designer/front-end engineer): verified every new route resolves to a real page and a
real content slug, `/compare/ollama/vllm` is a validly pre-rendered URL order, no
shipped route family was missed, no filename collisions — no findings. 253/253 tests
pass (unchanged — test-only harness file, not part of the Vitest suite), lint/tsc
clean, `npm audit --audit-level=high` 0 vulns, all run locally; `next build` reproduces
the known ADR-006 sandbox font-fetch gap, confirmed it compiles past this change first.
PR #73 merged (squash, 6/6 CI checks green — including the real, correctly-fonted
Playwright run: 48/48 checks passed, 0 axe-core WCAG 2.1 A/AA violations across all 8
routes × 6 viewport/color-scheme projects); `commit-screenshots` fired on the resulting
push and committed all 48 real screenshots. Reviewed a representative sample directly
(home light/dark desktop + mobile, trending, rising, search, alternative-notion,
compare-ollama-vllm desktop + mobile light): everything held up — type hierarchy,
spacing, and both themes consistent with `DESIGN-SYSTEM.md`; the newsletter section's
teal "Notify me" button and input match existing tokens; `RankedList`/`RankingRow`
renders identically on `/trending` and `/rising` as expected from a shared component;
the compare page's `StatusChip`/`MomentumChip` pair reads clearly distinct (square vs.
dot vs. flame — no repeat of UX-2026-003's collision) and its table reflows cleanly on
mobile with no horizontal scroll, unlike `AlternativesTable`'s original mobile bug
(UX-2026-002) — a different component, doesn't need the same fix but is reassuring it
wasn't inherited. No new findings this run — a genuinely clean catch-up pass. **Next
major task:** TECH-DEBT.md's two still-open design-owned rows — `MomentumChip`'s
tooltip-only signal exposure (not reliably reachable by screen reader/keyboard/touch)
first, then `AlternativesTable`'s non-interactive sort — unless a higher-priority
finding or a new dev-lane page needing a pattern lands first.

Run 14 (2026-09-30) reviewed the real, CI-committed `docs/design/screenshots/`
refreshed since run 13 — dev runs 30/31 shipped the basic news widget (#72, PR #74) and
two TECH-DEBT.md fixes (PR #75) in between, so this was the first design look at the
news widget's real rendering, per this lane's own stated priority ("a new dev-lane page
needing a pattern" ranks above the existing backlog). Found UX-2026-004 (MINOR): the
"Latest" section, inserted directly after the star-growth chart, buried the repo page's
one-sentence tagline (the first line of the Markdown body) underneath its own "No
recent releases." empty state, with no visual separation — the tagline now read as a
trailing continuation of the news section instead of the page's lead sentence
(PRODUCT.md §5). Fixed same run: pure JSX reorder (no content/data changes) moving
"Latest" to the very end of the page, after "Compared with" — matching PRODUCT.md §10's
documented Overview → Alternatives → Comparison → Momentum → News order and restoring
the tagline's prominence right after the chart. Independent reviewer subagent confirmed
the new placement, ruled out a landmark/heading-order accessibility regression (DOM
order now matches visual order), and caught a dangling doc reference in this fix's own
first-draft code comment before it shipped (fixed — this finding doc is that reference).
295/295 tests pass (no test changes needed — existing tests assert headings/text by
role and content, not DOM order), lint clean, `tsc --noEmit` clean; `npm run build`
reproduces the known ADR-006 sandbox font-fetch gap, confirmed it compiles past this
change first. PR #79 merged (squash, 6/6 CI checks green — 5 success + 1 skipped
push-only job, including a real, correctly-fonted Playwright/axe-core run); post-merge
CI on `main` also green, and `commit-screenshots` recommitted real
`repo-ollama__*.png` screenshots on the resulting push — reviewed `desktop-light` and
`mobile-dark` directly this same run: the tagline now reads immediately after the
chart with nothing above it, "Latest" sits cleanly at the bottom below "Compared with,"
`mt-6` spacing rhythm holds in both themes/viewports — fix confirmed. No open
design-lane owner decisions this run (RG-4 was DEFAULTED for real at design run 13; no
further re-checks needed per its own note). **Next major task (unchanged from run 13,
still not started):** TECH-DEBT.md's two open design-owned rows — `MomentumChip`'s
tooltip-only signal exposure first, then `AlternativesTable`'s non-interactive sort.

## Findings
| ID | Severity | Status | Component | Mapping | Issue/PR |
|---|---|---|---|---|---|
| UX-2026-001 | MAJOR | Verified (fixed) | Header logo + homepage section headings | `layout.tsx`, `page.tsx` | #50, PR #51 |
| UX-2026-002 | MINOR | Fixed (same run) | Alternatives table mobile Category column | `AlternativesTable.tsx` | PR #57 follow-up |
| UX-2026-003 | MAJOR | Verified (fixed) | StatusChip/MomentumChip icon collision | `StatusChip.tsx` | #52, PR #60 |
| UX-2026-004 | MINOR | Verified (fixed) | Repo page "Latest" section placement | `src/app/repo/[slug]/page.tsx` | PR #79 |

**Owner-directed refresh (2026-10-02):** applied the owner's "Precision Editorial" board and
page mockups as DESIGN-SYSTEM.md v2.0 (tokens, serif retired, new header/hero/card/repo-page
layouts) — see that doc's "Precision Editorial refresh" section for scope, what was
deliberately not built (mock-only data), and verification. The screenshot harness caught a
real mobile overflow regression in this work and it was fixed before the PR.
