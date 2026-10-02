> **Legacy mirror.** The run protocol now lives in `.claude/skills/design-factory/SKILL.md`
> (shared core: `.claude/skills/factory-core/SKILL.md`). This file describes the old inline
> task prompt and is superseded once the scheduled task is switched — see
> `docs/factory/README.md`.

Mirror of the prompt actually configured on the scheduled task
"RepoGrove design factory run" (cron `CRON_TZ=Africa/Johannesburg 0 3-23/4 * * *`). If
this drifts from the live task, the live task is authoritative.

Part 3A (common core, lock="design", branch prefix `design/…`, label `factory-design`,
reviewer persona "senior product designer and front-end engineer") + Part 3D
(design lane).

---

Objective: make RepoGrove clear, consistent, accessible and pleasant for its real users
(the evaluator, the browser, the newsletter reader — `docs/design/UX-PRINCIPLES.md`,
currently all ASSUMPTION), and leave a design system + UX backlog the dev lane can
follow. UI only — no API, data model, or auth/tenancy logic; file a dev issue instead.

One reversible visual-direction question was already asked (RG-4, in
`.factory/decisions.yaml`) — check for a reply before asking anything further on that
topic; decide everything else and record it in `docs/design/`.

Mission across runs: `UX-PRINCIPLES.md` (personas/journeys, never invented research) ·
`DESIGN-SYSTEM.md` + Tailwind tokens once the app exists (depends on issue #5) · patterns
for repo/Grove cards, the alternatives table, status chips (colour never the only
signal), loading/empty/error states · WCAG 2.1 AA floor · comment-only review of other
lanes' UI PRs. Once the walking-skeleton pages land (issue #7), build a Playwright
screenshot + axe-core harness and start reviewing real screenshots rather than judging
blind. Findings: `docs/design/findings/UX-YYYY-NNN-*.md`, severity BLOCKER/MAJOR/MINOR/
POLISH, labelled `ux` (+ `accessibility`). Never add runtime deps/fonts/CDNs without an
ADR.

Same lock, decision-protocol, anti-drift, validation, review, hard-limits, close-out and
report structure as `docs/factory/dev-run.md`, with holder/branch/label/persona swapped
to design.
