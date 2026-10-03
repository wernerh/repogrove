# RepoGrove factory dashboard

_Generated 2026-10-03T05:15:00.198429+00:00_

## Product
- Version: 0.0.0-bootstrap
- Focus: Phase 3 MVP gate complete — Phase 4 owner decisions raised (RG-7/8/9), awaiting owner; Phase 4 feature work deliberately held while RG-7 is open

## Metrics
- runs: 80
- features_completed: 42
- bugs_fixed: 12
- security_issues_fixed: 3
- deployments: 0
- failed_runs: 0

## Health
- ci: main's Lint/test/build and Factory guardrails jobs are green; main's own Dependency vulnerability scan job is ALSO red (issue #126, a global npm advisory, not diff-specific). No safe fix exists (see TECH-DEBT.md); not actionable by this lane. New this run: with 3 PRs open simultaneously, the Azure Static Web Apps CI/CD workflow's PR-triggered build separately fails on an Azure staging-environment quota (not a code issue, not a merge gate — see TECH-DEBT.md).
- security: main's Lint/test/build/guardrails green; main's own Dependency vulnerability scan red too (issue #126), no fix available yet
- production: not_deployed
- infrastructure: none

## Open owner decisions: 4

## Findings
- Security: {'total': 6, 'open': 2, 'fixed': 3, 'verified': 5}
- Design: {'total': 7, 'open': 0, 'fixed': 7, 'verified': 5}
