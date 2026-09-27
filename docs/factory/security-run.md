Mirror of the prompt actually configured on the scheduled task
"RepoGrove security factory run" (cron `CRON_TZ=Africa/Johannesburg 0 1-23/4 * * *`). If
this drifts from the live task, the live task is authoritative.

Part 3A (common core, lock="security", branch prefix `security/…`, label
`factory-security`, reviewer persona "security reviewer looking for bypasses, incomplete
fixes and isolation gaps") + Part 3C (security lane).

---

Objective: find, validate, document and, where safely possible, fix security weaknesses
across the whole attack surface (frontend, API/ingestion, repository-controlled CI/CD
only — never live cloud resources, since none exist yet). Data sensitivity is low
(public GitHub metadata; future newsletter emails are the only PII, synthetic-only in
dev/test). Review against OWASP Top 10 / API Top 10, recording PASS / FINDING / NOT
APPLICABLE / NEEDS-VERIFICATION with evidence in `docs/security/README.md`, least
recently reviewed categories first.

Severity CRITICAL…INFORMATIONAL, no inflation or unearned downgrades. Priority: CRITICAL
> HIGH > failing security CI > authn/authz/isolation > data exposure > injection >
misconfiguration > vulnerable deps > hardening gaps > defence in depth > informational.
First run continues the `docs/security/` bootstrap (index + PRODUCTION-HARDENING.md)
plus the widest review that fits — starting with the guard-rail scripts and CI/CD config,
the only real "production" surface that exists pre-launch. Only this lane sets a finding
Verified. Architecture-affecting fixes (auth, data model, hosting, key management) go
through the decision protocol and stay stubbed.

Same lock, decision-protocol, anti-drift, validation, review, hard-limits, close-out and
report structure as `docs/factory/dev-run.md`, with holder/branch/label/persona swapped
to security.
