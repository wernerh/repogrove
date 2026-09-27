# SECURITY.md — Policy & Data Classification

## Data classification
- **Public, non-sensitive:** GitHub repo metadata (stars, forks, description, language,
  license) — this is the bulk of RepoGrove's data and it is already public.
- **Low-sensitivity PII:** newsletter subscriber email addresses (Phase 2+, not yet
  built). Never committed to Git; lives only in the database with access controls once
  that database is provisioned in a real environment. No real subscriber data is ever
  used in development, tests, or fixtures — synthetic addresses only
  (`example@example.com` style).
- **No other PII is collected.** No accounts, no payment data, no government IDs are in
  scope for the MVP or Phase 2.

## Reporting a vulnerability
Open a GitHub issue labelled `security`, or if it's sensitive, email the owner directly
(whurter5@gmail.com). Do not open a public issue for an active exploit against a live
deployment (none exists yet — this is a placeholder for when one does).

## Scope for the security factory lane
Frontend (XSS/sanitiser bypasses, secrets in bundles, CSP/headers), ingestion
API/jobs (SSRF via user-controlled GitHub URLs, injection, rate limiting, error
leakage), repository-controlled CI/CD (workflow permissions, supply chain, secret
scanning). Live cloud resources are out of scope until hosting exists (ADR-002) — see
`docs/security/README.md` for the full methodology and OWASP coverage table.

## Principles
- No secrets, no real personal data, ever, in this repository.
- Every dependency addition is deliberate — this is a public-facing content site; keep
  the attack surface small.
- Security findings are tracked as `docs/security/findings/SEC-YYYY-NNN-*.md` with a
  GitHub issue each — see `docs/security/README.md`.
