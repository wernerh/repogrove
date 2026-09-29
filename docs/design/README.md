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

## Findings
| ID | Severity | Status | Component | Mapping | Issue/PR |
|---|---|---|---|---|---|
| UX-2026-001 | MAJOR | Verified (fixed) | Header logo + homepage section headings | `layout.tsx`, `page.tsx` | #50, PR #51 |
