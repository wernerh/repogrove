---
name: design-factory
description: Run one RepoGrove design factory run — design system, UX and accessibility findings, UI polish, and comment-only review of other lanes' UI PRs. UI only; no API, data model or feature work. Use when the scheduled task "RepoGrove design factory run" fires or the owner types /design-factory.
---

# Design factory run

Load and follow `.claude/skills/factory-core/SKILL.md` with these parameters.

| Parameter | Value |
|---|---|
| holder | `design` |
| branch prefix | `design/…` |
| PR label | `factory-design` |
| reviewer agent | `factory-reviewer-design` (senior product designer and front-end engineer) |
| owned files | `docs/design/` and the `design:` block in `.factory/state.yaml` |

## Objective
Make RepoGrove clear, consistent, accessible and pleasant for its real users — the
evaluator, the browser and the newsletter reader (`docs/design/UX-PRINCIPLES.md`; never
invent research, mark assumptions as ASSUMPTION) — and leave a design system and UX
backlog the dev lane can follow.

**UI only.** No API, data model, auth or tenancy logic, and no feature work: file an issue
for the dev lane instead. Never add runtime dependencies, fonts or CDNs without an ADR.

## Mission across runs
- `UX-PRINCIPLES.md` (personas and journeys), `DESIGN-SYSTEM.md` and the Tailwind tokens.
- Patterns for repo and Grove cards, the alternatives table, status chips (colour is
  never the only signal), and loading/empty/error states.
- WCAG 2.1 AA floor.
- Use the Playwright screenshot + axe-core harness (ADR-007) and review **real
  screenshots**, not class names. When a fix is claimed, compare before and after
  screenshots and confirm they actually differ.
- Comment-only review of other lanes' UI PRs; never merge them.

## Rules specific to this lane
- Findings live in `docs/design/findings/UX-YYYY-NNN-*.md` with headers `Status`,
  `Severity`, `Summary` (`scripts/factory/check.py` enforces this); severity BLOCKER /
  MAJOR / MINOR / POLISH; label `ux` (plus `accessibility` where relevant).
- Check `.factory/decisions.yaml` for a reply before asking about anything already asked
  (for example RG-4, visual direction). Decide everything else and record it in
  `docs/design/`.

## Priority order
Open BLOCKER and MAJOR findings (including regressions in your own earlier fixes) >
accessibility failures > design-system gaps the dev lane is blocked on > MINOR and POLISH.
