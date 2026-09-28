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
Playwright screenshots (light/dark × desktop/tablet/mobile) before merging — see PR
history. Next design-lane run: build the reusable screenshot + axe-core harness (a
dev-dependency-only Playwright addition, with an ADR line) so this becomes a checked-in
step instead of a one-off script; revisit RG-4 if the owner replies, or apply the
2026-09-30 default.

## Findings
| ID | Severity | Status | Component | Mapping | Issue/PR |
|---|---|---|---|---|---|
| — | — | — | — | — | — |
