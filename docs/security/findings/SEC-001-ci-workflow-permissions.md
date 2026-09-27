# SEC-001 — CI workflows missing explicit least-privilege `permissions:`

- **Status: PARTIALLY FIXED** (see Notes — one workflow can't be touched by any factory
  lane)
- **Severity:** LOW
- **Summary:** `.github/workflows/ci.yml` and `.github/workflows/factory-guardrails.yml`
  ran every job with the repository's *default* `GITHUB_TOKEN` permission set, rather
  than declaring the minimal `permissions:` each job actually needs. None of those jobs
  write to the repo, open issues/PRs, or touch packages — they only check out code, run
  `check.py`, and run `npm ci`/lint/test/build/`npm audit`. Relying on the org/repo
  default (which this factory cannot read — see Verification below) is a security
  misconfiguration under OWASP A05: if that default is ever set to
  read-and-write (or already is, for repos created before the platform's
  read-only-by-default change), a compromised dependency or transitive script running
  inside one of these jobs would have a writable token for no functional reason.

## Component
- `.github/workflows/ci.yml` (`guardrails`, `app`, `dependency-audit` jobs)
- `.github/workflows/factory-guardrails.yml` (`check` job)

## OWASP mapping
A05:2021 – Security Misconfiguration

## Evidence
- Read both workflow files in full (2026-09-27): neither had a top-level or per-job
  `permissions:` block before this run.
- Compare `.github/workflows/ingestion.yml`, which already does this correctly —
  `permissions: { contents: write }` at the workflow level, because it's the one
  workflow that actually needs to push a commit.
- Attempted to read the repo's actual default workflow-token permission setting via
  `GET /repos/wernerh/repogrove/actions/permissions/workflow` — blocked by the session's
  proxy allowlist ("Access to this GitHub Actions path is not permitted through this
  proxy"). Also attempted `GET /repos/wernerh/repogrove/branches/main/protection` to
  check branch-protection status while in the area — `403 Resource not accessible by
  integration` (the GitHub App installation isn't granted admin:repo-hook /
  administration read). Both are consistent with `docs/security/PRODUCTION-HARDENING.md`
  already carrying "Branch protection on `main`" as NOT VERIFIED — the factory has no way
  to confirm either setting from here, which is itself the reason to declare permissions
  explicitly per workflow rather than depend on an unverifiable default.

## Fix applied this run
Added an explicit workflow-level `permissions: { contents: read }` to
`.github/workflows/ci.yml`. All three of its jobs (`guardrails`, `app`,
`dependency-audit`) are read-only (checkout + local checks), so this doesn't change
behaviour, only removes the reliance on an unverifiable default. Re-validated locally
after the change: lint/test/build/`npm run` all still pass (workflow syntax only, no
job logic touched) — see the factory run report for exact commands.

## Notes — `factory-guardrails.yml` not fixed
`.github/workflows/factory-guardrails.yml` has the identical gap (no `permissions:`
block on its `check` job, which only runs `check.py` — also read-only) but
**CLAUDE.md rule 7 ("Hard rules") explicitly forbids any lane from editing this exact
file**, with no carve-out for security-hardening additions. This finding stays **open**
for that one file. Recommended fix (for the owner, or via an ADR that revises the
edit-lock list to allow additive `permissions:` blocks specifically):

```yaml
permissions:
  contents: read
```

added at the workflow level, identical to the change made to `ci.yml` in this run.

## Related
- `docs/security/README.md` — A05 row
- `docs/security/PRODUCTION-HARDENING.md` — "Branch protection" and a new "Least-privilege
  GITHUB_TOKEN permissions" row
