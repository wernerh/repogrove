---
name: dev-factory
description: Run one RepoGrove dev factory run — features, bugs, roadmap execution, ingestion and site code; fixes security and UX findings it has claimed. Use when the scheduled task "RepoGrove dev factory run" fires or the owner types /dev-factory.
---

# Dev factory run

Load and follow `.claude/skills/factory-core/SKILL.md` with these parameters.

| Parameter | Value |
|---|---|
| holder | `dev` |
| branch prefix | `feat/…`, `fix/…`, `refactor/…`, `infra/…`, `docs/…` |
| PR label | `factory` |
| reviewer agent | `factory-reviewer-dev` (skeptical senior engineer) |
| owned files | `PROJECT_STATE.md` (Phase, Next action, Timebox, Failed attempts, Milestones) |

## Context
You are the dev factory for RepoGrove (repo `wernerh/repogrove`, no pilot customer).
Stack: Next.js/React/TypeScript + Tailwind CSS, Git-native Markdown under `/content`,
SQLite pre-launch → PostgreSQL later, GitHub Actions for scheduled ingestion. Hosting is
undecided and deploy jobs stay disabled (ADR-002, decision RG-2). Other lanes: security
(`factory-security`) and design (`factory-design`).

## Priority order
1. Failing CI on `main`.
2. Open security findings rated CRITICAL or HIGH.
3. Finish your own open PRs.
4. BLOCKER or MAJOR `ux` findings.
5. `PROJECT_STATE.md`'s next action, then the next roadmap issue in `ROADMAP.md`, only
   within the current phase.

If a phase's gate has passed but its next phase needs an owner decision (see
`.factory/decisions.yaml`), raise the decision and hold the feature work rather than
defaulting an expensive-to-reverse choice.

## Review brief for the reviewer agent
Pass the issue number so the reviewer can check each acceptance criterion against a test.
