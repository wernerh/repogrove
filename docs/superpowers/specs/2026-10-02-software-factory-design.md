# software-factory — Design Spec

**Date:** 2026-10-02
**Status:** Draft, awaiting owner review
**Owner:** Werner Hurter

## 1. Purpose

Extract the autonomous software-factory pattern proven on RepoGrove into a standalone,
reusable repo. Apply it to any new project to get: a design entry point (idea → plan →
technical docs), then autonomous, gated implementation by scheduled lanes.

**Success criteria**
- A new project goes from empty repo to "design approved, Phase 1 issues open" using
  only `/factory:init` and `/factory:new`.
- Scheduled lane runs (dev, security, design) behave exactly as in RepoGrove: lock,
  observe, one major task, validate, PR, report.
- Nothing RepoGrove-specific (stack, hosting, domain rules, product copy) lives in the
  engine. It lives in per-project config and `CLAUDE.md`.
- Human gates are enforced mechanically (CI guardrail + lane prompts), not by policy alone.

## 2. Architecture: plugin engine + project scaffold

One repo, two roles.

1. **Engine (Claude Code plugin):** skills, agents, commands. Updated centrally; projects
   pick up improvements by updating the plugin.
2. **Scaffold (`templates/`):** project-owned files copied into a new repo by
   `/factory:init`. After init, the project owns them (state, decisions, workplan,
   CLAUDE.md, lane prompts, CI guardrail).

**Rule:** engine files are never copied into projects. Project files are never edited by
the engine except through lane runs that follow the manual.

## 3. Repo layout

```
software-factory/
├── .claude-plugin/plugin.json
├── README.md
├── skills/
│   ├── intake/SKILL.md          # idea -> brief (purpose, constraints, success test)
│   ├── spec/SKILL.md            # brief -> PRODUCT/ARCHITECTURE/ADRs
│   ├── plan/SKILL.md            # spec -> WORKPLAN with phase gates + roadmap issues
│   ├── factory-core/SKILL.md    # shared run protocol (mirrors live RepoGrove factory-core):
│   │                            #   lock, owner decisions, anti-drift, choose work, implement,
│   │                            #   validate, independent review, merge rules, close-out, report
│   ├── dev-factory/SKILL.md     # lane params: holder, branch prefix, PR label, reviewer,
│   ├── security-factory/SKILL.md#   owned files, objective, priority order
│   └── design-factory/SKILL.md
├── agents/                      # read-only reviewer subagents, one per lane
│   ├── factory-reviewer-dev.md  factory-reviewer-security.md  factory-reviewer-design.md
│   └── planner.md  architect.md # design-pipeline agents
├── commands/
│   ├── new.md  init.md  run.md  status.md
├── templates/
│   ├── CLAUDE.md.tmpl  PROJECT_STATE.md.tmpl  ROADMAP.md.tmpl
│   ├── factory/state.yaml.tmpl  factory/decisions.yaml.tmpl  factory/config.yaml.tmpl
│   ├── docs/WORKPLAN.md.tmpl  docs/adr/ADR-TEMPLATE.md  docs/factory/lane-*.md.tmpl
│   ├── scripts/factory/check-guardrails.sh
│   └── .github/workflows/{ci.yml.tmpl,factory-guardrails.yml}
├── scripts/init.sh              # non-interactive scaffold used by /factory:init
└── docs/superpowers/specs/
```

## 4. Commands (entry points)

| Command | Does | Gate |
|---|---|---|
| `/factory:init` | Scaffold templates into current repo, fill placeholders from `config.yaml` | none |
| `/factory:new "<idea>"` | Run design pipeline: intake → spec → plan. Writes docs, opens roadmap issues | owner approves brief, spec, then plan |
| `/factory:run <lane>` | One run of a lane (dev, security, design, or custom) | none |
| `/factory:status` | Summarise state.yaml, open decisions, open PRs, last runs | none |

Scheduled tasks call `/factory:run <lane>`; the prompt is a one-liner, so no prompt drift.

## 5. Design pipeline (`/factory:new`)

1. **Intake** — discover intent, write back understanding, owner corrects. Output: `docs/BRIEF.md`.
2. **Spec** — 2-3 approaches with recommendation; ADRs for expensive-to-reverse choices
   (stack, hosting, data model, auth). Output: `PRODUCT.md`, `ARCHITECTURE.md`, `docs/adr/*`.
3. **Plan** — phased `docs/WORKPLAN.md`, each phase with a gate; Phase 1 is a walking
   skeleton. Output: `ROADMAP.md` and GitHub issues for the next phase only.
4. **Handoff** — sets `PROJECT_STATE.md` next action; dev lane takes over.

Each stage ends with an explicit owner approval. Later phases' issues open only when the
prior gate passes (RepoGrove rule 8).

## 6. Run loop (all lanes)

lock → observe → diagnose/prioritise → plan → implement → validate → independent review
(read-only reviewer subagent) → PR → merge → update memory → report.

- Shared lock in `.factory/state.yaml` (`current_run`, `holder`, 40 min max hold; lock
  held by another lane and younger than 50 min means stop; older is stale and taken over).
- One major task (+ up to 2 small related) per run.
- Lane merges only its own labelled PRs; never `needs-human` PRs.
- Issue claims by comment, expire after 24h without a PR.
- Reports record which checks ran locally vs left to CI.
- A quiet run is a successful run.

## 7. Lanes (configurable)

Defaults: **dev**, **security**, **design**. Defined in `.factory/config.yaml`:

```yaml
lanes:
  dev:      { label: factory,          schedule: "every 2h", owns: [PROJECT_STATE.md] }
  security: { label: factory-security, schedule: "every 4h", owns: [docs/security/] }
  design:   { label: factory-design,   schedule: "every 4h", owns: [docs/design/] }
```

Adding a lane = a config entry + an agent file + a lane prompt. Lane disable = remove entry.

## 8. Human gates (universal, from RepoGrove)

Stop, open a `needs-human` issue, notify owner for: spending money, cloud resources,
identity-provider apps or secrets, production deploys, contacting anyone but the owner,
publishing externally, destructive/irreversible actions, expensive-to-reverse
architecture. Per-project config can add gates, never remove them.

## 9. Guardrails (mechanical)

- Mirrors live RepoGrove: `scripts/factory/check.py` (and `metrics.py`) run in
  `.github/workflows/factory-guardrails.yml`; `CODEOWNERS` routes protected paths to the owner.
- Protected list (a lane must not weaken its own protocol or reviewer):
  `scripts/factory/*`, `factory-guardrails.yml`, checker thresholds, and `.claude/**`
  (lane skills and reviewer agents). Only the owner changes these, via a `needs-human` PR.
- Checker fails the build if the lock is older than 2 hours; lock timestamps must be the
  real UTC time (a rounded timestamp once caused a live lock to be taken over).
- Lane skills are the authority for *how* a run behaves; `CLAUDE.md` for the rules that never
  change. Scheduled tasks are thin wrappers that invoke the lane skill, so no prompt drift.
- Owner questions follow a decision protocol (`docs/DECISION-PROTOCOL.md`): replies count only
  from the owner's address; cheap-to-reverse defaults apply after `default_due_at`;
  expensive-to-reverse questions stay stubbed. An email reply never lifts a hard rule.
- Run history is appended to `docs/factory/run-history.md`.
- Original design (superseded by the above where they differ):
  `scripts/factory/check-guardrails.sh` in CI fails a PR that edits the protected list
  (`scripts/factory/*`, `factory-guardrails.yml`, checker thresholds) unless authored by
  the owner.
- Detects disabled tests/lint, bypassed branch protection, committed secrets patterns.
- Protected list is project-configurable (additive only).

## 10. Per-project config (`.factory/config.yaml`)

Project name, owner, repo, lanes, extra gates, locked-stack ADR reference, hard domain
rules (free text copied into CLAUDE.md §3), validation commands (lint/test/build).

## 11. Error handling

- Stale lock (>40 min): next run takes over and logs it.
- CI red at close-out: leave PR, release lock, note in report.
- Unclear requirement: open decision in `decisions.yaml`, work on something else.
- Engine/project drift: `/factory:status` reports plugin version vs project scaffold version.

## 12. Testing

- `scripts/init.sh` tested against a scratch repo: all placeholders replaced, no `{{` left.
- `check-guardrails.sh` tested with fixtures: protected-file edit fails, clean diff passes.
- Skills validated by dry-running `/factory:new` on a toy idea (spec, plan produced; no
  code written without approval).

## 13. Non-goals (YAGNI)

No web UI, no hosted service, no multi-repo orchestration, no non-GitHub forges, no
vendor lock beyond Claude Code and GitHub.

## 14. Open questions for owner

- Plugin distribution: private GitHub repo as marketplace (recommended) vs public.
- Notification channel for gates: email (as RepoGrove) vs GitHub issue only.
