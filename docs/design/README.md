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

## Findings
| ID | Severity | Status | Component | Mapping | Issue/PR |
|---|---|---|---|---|---|
| — | — | — | — | — | — |
