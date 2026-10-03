# RepoGrove factory dashboard

_Generated 2026-10-03T03:23:02.927512+00:00_

## Product
- Version: 0.0.0-bootstrap
- Focus: Phase 3 MVP gate complete — Phase 4 owner decisions raised (RG-7/8/9), awaiting owner; Phase 4 feature work deliberately held while RG-7 is open

## Metrics
- runs: 79
- features_completed: 41
- bugs_fixed: 12
- security_issues_fixed: 3
- deployments: 0
- failed_runs: 0

## Health
- ci: main's Lint/test/build and Factory guardrails jobs are green; main's own Dependency vulnerability scan job is ALSO red (issue #126 is a global npm advisory, not diff-specific — confirmed on main's own last two pushes, f7d329e/4cd70cf, not just on PRs #125/#127). This run's own prior close-out (run 60, commit 62d2f30) said 'main green' without checking main's own CI run for this job — corrected here. No safe fix exists (see TECH-DEBT.md); not actionable by this lane.
- security: main's Lint/test/build/guardrails green; main's own Dependency vulnerability scan red too (issue #126), no fix available yet
- production: not_deployed
- infrastructure: none

## Open owner decisions: 4

## Findings
- Security: {'total': 6, 'open': 2, 'fixed': 3, 'verified': 5}
- Design: {'total': 7, 'open': 0, 'fixed': 7, 'verified': 5}
