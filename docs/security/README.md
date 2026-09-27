# Security findings index

Reviewed against OWASP Top 10 and OWASP API Security Top 10. Status legend:
PASS / FINDING / NOT APPLICABLE / NEEDS-VERIFICATION.

## OWASP Top 10 coverage
| Category | Status | Notes |
|---|---|---|
| A01 Broken Access Control | NOT APPLICABLE | No auth/accounts exist yet (MVP has none) |
| A02 Cryptographic Failures | NEEDS-VERIFICATION | No user data handled yet; revisit at newsletter-signup (Phase 3) |
| A03 Injection | NEEDS-VERIFICATION | No API surface exists yet — review when ingestion/API routes land |
| A04 Insecure Design | PASS | Hybrid architecture keeps agent output non-authoritative by construction (ADR-003) |
| A05 Security Misconfiguration | NEEDS-VERIFICATION | Review CI/workflow permissions once `.github/workflows` exist (this bootstrap) |
| A06 Vulnerable Components | NEEDS-VERIFICATION | No dependencies installed yet — review at Phase 1 `npm install` |
| A07 Auth Failures | NOT APPLICABLE | No auth in MVP |
| A08 Data Integrity Failures | NEEDS-VERIFICATION | Review supply-chain (Dependabot, lockfile) once app exists |
| A09 Logging/Monitoring Failures | NEEDS-VERIFICATION | No logging exists yet |
| A10 SSRF | NEEDS-VERIFICATION | Ingestion jobs call the GitHub API with owner/repo values sourced from `/content` frontmatter — review for SSRF once ingestion code exists (Phase 2) |

## OWASP API Security Top 10
Not applicable yet — no API surface exists (Phase 1 has none, Phase 2 adds ingestion
endpoints). Will be reviewed as each endpoint lands.

## Production hardening checklist
See `docs/security/PRODUCTION-HARDENING.md`.

## Findings
None yet — see `docs/security/findings/`. First security-lane run should do the widest
review that fits: repository-controlled CI/CD config (this bootstrap's `.github/`), the
`.gitignore` secret-pattern coverage, and the guard-rail checker itself.

| ID | Severity | Status | Component | Mapping | Issue/PR |
|---|---|---|---|---|---|
| — | — | — | — | — | — |
