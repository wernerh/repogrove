# Production hardening checklist

Status legend: PASS / FAIL / PARTIAL / NOT VERIFIED. This checklist is aspirational until
a real deployment exists (ADR-002) — most items are NOT VERIFIED by design until then.

| Item | Status | Notes |
|---|---|---|
| No secrets committed to Git | PASS | `.gitignore` blocks `.env*`, key files; `scripts/factory/check.py` scans for secret-looking strings |
| No real personal data committed | PASS | No PII collected yet; policy in `SECURITY.md` |
| Dependency vulnerability scanning in CI | PASS | `.github/workflows/ci.yml` runs `npm audit`; Dependabot configured |
| Branch protection on `main` requiring CI | NOT VERIFIED | Recommended to the owner in the bootstrap PR; factory cannot enable it itself |
| CSP / security headers | NOT VERIFIED | No app exists yet — add when `src/` ships (Phase 1) |
| Rate limiting on API routes | NOT VERIFIED | No API routes exist yet (Phase 2) |
| Secrets management for deploy | NOT VERIFIED | No hosting target chosen (ADR-002) |
| HTTPS enforced | NOT VERIFIED | No deployment exists |
| Dependency lockfile committed | NOT VERIFIED | No `package.json` yet — required from Phase 1's first commit |
