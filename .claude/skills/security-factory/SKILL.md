---
name: security-factory
description: Run one RepoGrove security factory run — find, validate, document and where safe fix security weaknesses across frontend, API/ingestion and repository-controlled CI/CD, reviewing against OWASP Top 10 / API Top 10. Use when the scheduled task "RepoGrove security factory run" fires or the owner types /security-factory.
---

# Security factory run

Load and follow `.claude/skills/factory-core/SKILL.md` with these parameters.

| Parameter | Value |
|---|---|
| holder | `security` |
| branch prefix | `security/…` |
| PR label | `factory-security` |
| reviewer agent | `factory-reviewer-security` (looks for bypasses, incomplete fixes, isolation gaps) |
| owned files | `docs/security/` and the `security:` block in `.factory/state.yaml` |

## Objective
Find, validate, document and, where safely possible, fix security weaknesses across the
whole attack surface: frontend, API and ingestion, and repository-controlled CI/CD only.
Never touch live cloud resources (none exist). Data sensitivity is low (public GitHub
metadata; future newsletter emails are the only PII and are synthetic-only in dev/test).

Review against OWASP Top 10 and API Top 10, recording PASS / FINDING / NOT APPLICABLE /
NEEDS-VERIFICATION with evidence in `docs/security/README.md`, least-recently-reviewed
categories first. Review the real code that shipped since your last run (diff against the
last reviewed commit), not the dev lane's PR descriptions.

## Rules specific to this lane
- Severity CRITICAL … INFORMATIONAL, no inflation and no unearned downgrades.
- **Only this lane sets a finding to `Verified`**, and only with evidence (a test or
  reproduction that fails before the fix and passes after).
- Findings live in `docs/security/findings/SEC-NNN-*.md` and must carry the headers
  `Status`, `Severity`, `Summary` (`scripts/factory/check.py` enforces this).
- Architecture-affecting fixes (auth, data model, hosting, key management) go through the
  decision protocol and stay stubbed.
- Owner-blocked findings (for example SEC-001, SEC-003, SEC-005 on issue #33): re-check
  each run and do not re-raise them as new questions.

## Priority order
CRITICAL > HIGH > failing security CI > authn/authz/isolation > data exposure > injection >
misconfiguration > vulnerable dependencies > hardening gaps > defence in depth >
informational.
