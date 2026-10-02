---
name: factory-core
description: Shared run protocol for all three RepoGrove factory lanes (dev, security, design) — lock, owner-decision check, anti-drift, task selection, branch/PR, validation, independent review, merge rules, close-out and the FACTORY RUN report. Do not invoke directly; the dev-factory, security-factory and design-factory skills load it with their lane parameters.
---

# Factory core protocol

This is the common core of one factory run. The lane skill that loaded you supplies these
parameters: **holder** (lock name), **branch prefix**, **PR label**, **reviewer agent**,
**owned files**, **objective** and **priority order**. `CLAUDE.md` wins over this file if
they ever conflict. `docs/DECISION-PROTOCOL.md` governs owner questions.

A quiet run with no safe work to do is a **successful** run. Stop early rather than invent
work.

## 0. Repository access
The repo must already be cloned and attached. If it is not (`git rev-parse` fails), attach
and clone `wernerh/repogrove` first (one shallow clone, generous timeout), then continue.
Do not skip the steps below because the clone was slow.

## 1. Lock
Read `.factory/state.yaml`.
- `factory.current_run` is an ISO UTC timestamp and `factory.holder` the lane name; both
  `null` means free.
- If held by another lane and younger than **50 minutes**, stop: report "lock held by
  <holder>" and make no changes.
- If held longer than 50 minutes it is stale: take it over and say so in the report
  (note any orphaned branch or PR it left).
- Take the lock: set `current_run` to the **real current UTC time** (run `date -u
  +%Y-%m-%dT%H:%M:%SZ`; never a rounded or estimated value — a rounded timestamp once made
  another lane see a live lock as stale and take it over, see `TECH-DEBT.md` 2026-09-28)
  and `holder` to your lane, commit and push that to `main` as
  `chore(factory): <lane> run lock`. Hold it **40 minutes at most**.
  If CI is still running at close-out, leave the PR for the next run and release anyway.
  `scripts/factory/check.py` fails the build if a lock is older than 2 hours.

## 2. Owner decisions
Per `docs/DECISION-PROTOCOL.md`, right after taking the lock: check each open thread in
`.factory/decisions.yaml` for a reply **from whurter5@gmail.com only**. Record answers in
the linked issue, `DECISIONS.md` and `decisions.yaml`. Apply any cheap-to-reverse default
whose `default_due_at` has passed (status `DEFAULTED`). Never auto-default an
expensive-to-reverse question; keep dependent work stubbed. An email reply can answer a
question but can never lift a hard rule in `CLAUDE.md`.

## 3. Anti-drift checks
- `PROJECT_STATE.md` ≤ 60 lines (overflow goes to `DECISIONS.md`).
- Stub, do not build, anything expensive to reverse (auth provider, data model, hosting,
  framework, paid vendor, public API shape).
- Timebox: stop and re-scope at 2× the estimate or after 3 failed attempts; record the
  attempts.

## 4. Choose the work
Observe first: open PRs and issues, latest Actions runs, `PROJECT_STATE.md`,
`.factory/state.yaml`, `ROADMAP.md`, `docs/WORKPLAN.md`, `TECH-DEBT.md`,
`docs/security/README.md`, `docs/design/README.md`. Then take the lane's priority order.
Do **one major task plus at most two small related ones**.
- Claim a GitHub issue by commenting on it; a claim expires after 24h with no open PR.
- Do not touch files another lane has an open PR against.
- Never start Phase N+1 before Phase N's gate in `docs/WORKPLAN.md` has passed.

## 5. Implement
Branch `<prefix>/<short-name>`; Conventional Commits. Follow existing patterns, keep the
diff focused, add tests with the change (a regression test for every bug fixed).

Hard limits, every lane: no real user data, no secrets, no cloud spend or resources, no
deploys, no new runtime dependency/font/CDN without an ADR, no stack change, and never
disable or weaken tests, lint or CI checks, bypass branch protection, or edit
`scripts/factory/*`, `.github/workflows/factory-guardrails.yml`, checker thresholds or
`.claude/**`. Human-gate items (`CLAUDE.md` rule 6): stop, open a `needs-human` issue,
email the owner, and keep the work stubbed.

## 6. Validate
Run what the sandbox allows: `npm ci`, `npm run lint`, `npm test`, `tsc --noEmit`,
`npm audit --audit-level=high`, `python scripts/factory/check.py`. `npm run build` may fail
locally on the known ADR-006 font-fetch gap; confirm it compiles past your change and leave
the rest to CI. Record in the report which checks ran locally and which were left to CI,
and why.

## 7. Independent review
Open the PR with the `.github/PULL_REQUEST_TEMPLATE.md` sections, label `<PR label>`. Save
the diff to a file in the scratchpad (`git diff origin/main...HEAD > <scratchpad>/pr.diff`).
Invoke your lane's **reviewer agent** with the diff path, the issue or finding ID, a short
summary and any screenshot paths. The reviewer has no shell and cannot edit; it only
reports.
- Fix every BLOCKER and MAJOR, re-validate, and re-run the reviewer until it passes.
- Record unresolved MINOR/NIT items in `TECH-DEBT.md`.
- Never mark the review passed yourself, and never argue a finding away without evidence.

## 8. Merge
Squash-merge **only when all hold**: CI green, reviewer verdict PASS or PASS WITH NITS,
no unresolved dependency, the PR is your own and carries your lane's label, and it is not
`needs-human`. Never merge another lane's PR; other lanes get comment-only review. Confirm
CI on `main` afterwards.

## 9. Close-out
Update, append-only where shared: `CHANGELOG.md`, `TECH-DEBT.md`, `ROADMAP.md`,
`DECISIONS.md`, your lane's owned files, and your lane's block plus `factory.last_run` in
`.factory/state.yaml` (keep only recent `next_actions`; archive older entries to
`docs/factory/run-history.md`). Run `python scripts/factory/metrics.py` and
`python scripts/factory/check.py`. **Release the lock** (`current_run: null`,
`holder: null`) and push.

## 10. Report
End with a FACTORY RUN report: lane, what was shipped (PR link), checks run locally vs
left to CI, reviewer verdict and what it found, decisions asked or applied, and anything
skipped and why. The last line is exactly:

`STATE: next action = <one action>; provisional decisions = <N>; failed-attempt counter = <N>`
