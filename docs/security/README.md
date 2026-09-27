# Security findings index

Reviewed against OWASP Top 10 and OWASP API Security Top 10. Status legend:
PASS / FINDING / NOT APPLICABLE / NEEDS-VERIFICATION.

## OWASP Top 10 coverage
| Category | Status | Notes |
|---|---|---|
| A01 Broken Access Control | NOT APPLICABLE | No auth/accounts exist yet (MVP has none) |
| A02 Cryptographic Failures | NEEDS-VERIFICATION | No user data handled yet; revisit at newsletter-signup (Phase 3), the first feature to collect PII (subscriber emails) |
| A03 Injection | PASS | Reviewed 2026-09-27 (security run 1): repo/Grove body Markdown is rendered via `react-markdown` (`src/app/repo/[slug]/page.tsx`, `src/app/grove/[slug]/page.tsx`) with no `rehype-raw`/`remark-html`/`dangerouslySetInnerHTML` anywhere in `src/` — raw HTML in content is dropped by default, not executed. No API/DB query surface exists yet (SQLite ingestion writer uses parameterised upserts — see `scripts/ingestion/snapshots-db.mjs`); revisit when Phase 3 adds search/API routes with external input |
| A04 Insecure Design | PASS | Hybrid architecture keeps agent output non-authoritative by construction (ADR-003) |
| A05 Security Misconfiguration | FINDING (LOW) — partially fixed | SEC-001: CI workflows ran with the default (unverifiable) `GITHUB_TOKEN` permission set rather than an explicit least-privilege grant. Fixed in `ci.yml` this run; `factory-guardrails.yml` has the identical gap but is locked from all-lane edits by CLAUDE.md rule 7 — stays open, needs the owner. `ingestion.yml` was already correctly scoped (`contents: write`, the one job that needs it). See `docs/security/findings/SEC-001-ci-workflow-permissions.md` |
| A06 Vulnerable Components | PASS (with tracked exception) | `npm audit` (2026-09-27): 2 moderate, 0 high/critical (`@vitest/mocker`/`vitest`, dev-only test runner, not shipped in the static-exported site — already tracked in `TECH-DEBT.md`). CI's `dependency-audit` job gates on `--audit-level=high`, so this doesn't block; Dependabot covers both `npm` and `github-actions` ecosystems weekly |
| A07 Auth Failures | NOT APPLICABLE | No auth in MVP |
| A08 Data Integrity Failures | PASS (defense-in-depth noted) | Dependabot is configured for both ecosystems (weekly); lockfile (`package-lock.json`) is committed and `npm ci` (not `npm install`) is used in every workflow. GitHub Actions are pinned by major-version tag (`@v4`/`@v7`), not by commit SHA — stricter SHA-pinning would be more defensive but isn't a gap given Dependabot's action-update coverage; noted as informational, not a blocking finding |
| A09 Logging/Monitoring Failures | NEEDS-VERIFICATION | No logging/observability infra exists yet — nothing to configure until there's a live deployment (ADR-002) or a server-side API surface (Phase 3) |
| A10 SSRF | PASS | Reviewed 2026-09-27: `scripts/ingestion/fetch-snapshots.mjs` fetches `https://api.github.com/repos/${github}` where `github` is drawn from `/content/repos/*.md` frontmatter, but the value is validated against `GITHUB_SLUG_PATTERN` (an `owner/name` allowlist that rejects bare `.`/`..` segments) before use, the host is hardcoded (never derived from the value), and every request has a 15s timeout (`fetchRepoMetrics`). Not a true SSRF vector (no way to redirect off `api.github.com`), and the allowlist is real, not cosmetic — code comment in that file documents the same reasoning |

## OWASP API Security Top 10
Not applicable yet — no API surface exists (Phase 1 has none, Phase 2 adds ingestion
endpoints, both file-based/scheduled rather than a request-driven API). Will be
reviewed as each endpoint lands (Phase 3: search, newsletter signup).

## Production hardening checklist
See `docs/security/PRODUCTION-HARDENING.md`.

## Findings
| ID | Severity | Status | Component | Mapping | Issue/PR |
|---|---|---|---|---|---|
| SEC-001 | LOW | PARTIALLY FIXED | `.github/workflows/ci.yml`, `.github/workflows/factory-guardrails.yml` | A05 | see PR for this run |

Full detail: `docs/security/findings/SEC-001-ci-workflow-permissions.md`.

## Review log
- **2026-09-27 (run 1, bootstrap):** initial OWASP table populated as NEEDS-VERIFICATION
  across the board — nothing existed yet to review.
- **2026-09-27 (run 2, first real pass):** Phase 1 app + Phase 2 ingestion job now exist.
  Reviewed the repo's full attack surface top to bottom: CI/CD workflow config
  (`.github/workflows/*.yml`), the guard-rail checker (`scripts/factory/check.py`,
  read-only — can't be edited by any lane), `.gitignore` secret-pattern coverage,
  content-rendering path (`react-markdown` usage, no raw-HTML plugins), the ingestion
  job's SSRF surface, `npm audit`, and the built static-export output (`out/`) for
  leaked source maps or env values — none found. One finding opened (SEC-001, LOW,
  partially fixed same run). Least-recently-reviewed categories (A03, A05, A06, A08,
  A10) all got a real look this run; A01/A02/A07/A09 remain NOT APPLICABLE /
  NEEDS-VERIFICATION for the stated reasons (no auth, no user data, no logging infra —
  all Phase 3+).
