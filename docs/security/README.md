# Security findings index

Reviewed against OWASP Top 10 and OWASP API Security Top 10. Status legend:
PASS / FINDING / NOT APPLICABLE / NEEDS-VERIFICATION.

## OWASP Top 10 coverage
| Category | Status | Notes |
|---|---|---|
| A01 Broken Access Control | NOT APPLICABLE | No auth/accounts exist yet (MVP has none) |
| A02 Cryptographic Failures | NEEDS-VERIFICATION | No user data handled yet; revisit at newsletter-signup (Phase 3), the first feature to collect PII (subscriber emails). Re-confirmed 2026-09-28 (security run 3): still no `/api/*` routes, no signup form, no PII-handling code anywhere in `src/` |
| A03 Injection | PASS | Reviewed 2026-09-27 (security run 1): repo/Grove body Markdown is rendered via `react-markdown` (`src/app/repo/[slug]/page.tsx`, `src/app/grove/[slug]/page.tsx`) with no `rehype-raw`/`remark-html`/`dangerouslySetInnerHTML` anywhere in `src/` — raw HTML in content is dropped by default, not executed. No API/DB query surface exists yet (SQLite ingestion writer uses parameterised upserts — see `scripts/ingestion/snapshots-db.mjs`); revisit when Phase 3 adds search/API routes with external input. Re-confirmed 2026-09-28: design lane's PR #25 (token/CSS restyle, `globals.css`/4 pages) added no new rendering paths; grepped `src/`/`scripts/` for `dangerouslySetInnerHTML`/`rehype-raw`/`remark-html`/`eval(`/`new Function(` — none found |
| A04 Insecure Design | PASS | Hybrid architecture keeps agent output non-authoritative by construction (ADR-003) |
| A05 Security Misconfiguration | FINDING (LOW) — partially fixed | SEC-001: CI workflows ran with the default (unverifiable) `GITHUB_TOKEN` permission set rather than an explicit least-privilege grant. Fixed in `ci.yml` this run; `factory-guardrails.yml` has the identical gap but is locked from all-lane edits by CLAUDE.md rule 7 — stays open, needs the owner. `ingestion.yml` was already correctly scoped (`contents: write`, the one job that needs it). See `docs/security/findings/SEC-001-ci-workflow-permissions.md`. Re-checked 2026-09-28: `factory-guardrails.yml` still has no `permissions:` block — unchanged, still owner-blocked |
| A06 Vulnerable Components | PASS | `npm audit` re-run 2026-09-28 (security run 3): **0 vulnerabilities at any level** — the 2 moderate `@vitest/mocker`/`vitest` findings noted 2026-09-27 are gone now that `vitest` sits at 5.0.1 (dependabot PR #15, merged to `main`). CI's `dependency-audit` job gates on `--audit-level=high`; Dependabot covers both `npm` and `github-actions` ecosystems weekly. Note: `main` briefly failed a clean `npm ci` for an unrelated reason (issue #26, `react`/`react-dom` peer mismatch from PR #11 — a build-breaking bug, not a vulnerability); dev lane's PR #27 fixed it during this same run — re-ran `npm ci && npm audit` clean on the real install afterward, confirming the finding (0 vulnerabilities) holds either way |
| A07 Auth Failures | NOT APPLICABLE | No auth in MVP. Re-confirmed 2026-09-28: still no auth/session code anywhere in `src/` |
| A08 Data Integrity Failures | PASS (defense-in-depth noted) | Dependabot is configured for both ecosystems (weekly); lockfile (`package-lock.json`) is committed and `npm ci` (not `npm install`) is used in every workflow. GitHub Actions are pinned by major-version tag (`@v4`/`@v7`), not by commit SHA — stricter SHA-pinning would be more defensive but isn't a gap given Dependabot's action-update coverage; noted as informational, not a blocking finding |
| A09 Logging/Monitoring Failures | NEEDS-VERIFICATION | No logging/observability infra exists yet — nothing to configure until there's a live deployment (ADR-002) or a server-side API surface (Phase 3). Re-confirmed 2026-09-28: ADR-002/RG-2 hosting still undecided, no deploy job enabled |
| A10 SSRF | PASS (fixed a real bypass — SEC-002) | Reviewed 2026-09-27: `scripts/ingestion/fetch-snapshots.mjs` fetches `https://api.github.com/repos/${github}` where `github` is drawn from `/content/repos/*.md` frontmatter. Host is hardcoded (never derived from the value) so this was never a cross-host SSRF vector, but the independent review of this run's own PR (SEC-001) found the `GITHUB_SLUG_PATTERN` allowlist's owner-segment guard was dead code — `../rate_limit` passed validation and resolved (`new URL(...)`) to a same-host path-traversal-shaped request (`/repos/../rate_limit` → `/rate_limit`), letting the ingestion job's token probe arbitrary single-segment `api.github.com` paths. Fixed same run: each segment (owner and name) is now anchored to its own boundary rather than sharing one end-of-string anchor; regression tests added (`tests/ingestion/fetch-snapshots.test.ts`). See SEC-002 for detail. Re-verified 2026-09-28: `GITHUB_SLUG_PATTERN` in `scripts/ingestion/fetch-snapshots.mjs` still carries the fixed pattern, and both regression tests (`rejects a bare-dot-segment OWNER slug`, `still accepts a real owner/name slug that merely contains dots`) are still present in `tests/ingestion/fetch-snapshots.test.ts` |

## OWASP API Security Top 10
Not applicable yet — no API surface exists (Phase 1 has none, Phase 2 adds ingestion
endpoints, both file-based/scheduled rather than a request-driven API). Will be
reviewed as each endpoint lands (Phase 3: search, newsletter signup).

## Production hardening checklist
See `docs/security/PRODUCTION-HARDENING.md`.

## Findings
| ID | Severity | Status | Component | Mapping | Issue/PR |
|---|---|---|---|---|---|
| SEC-001 | LOW | PARTIALLY FIXED | `.github/workflows/ci.yml`, `.github/workflows/factory-guardrails.yml` | A05 | PR #24 |
| SEC-002 | LOW | FIXED, VERIFIED | `scripts/ingestion/fetch-snapshots.mjs` (`GITHUB_SLUG_PATTERN`) | A10 | PR #24 |

Full detail: `docs/security/findings/SEC-001-ci-workflow-permissions.md`,
`docs/security/findings/SEC-002-ingestion-slug-traversal-regex.md`.

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
- **2026-09-28 (run 3):** re-checked all FIXED findings with evidence rather than taking
  the last run's write-up on faith: SEC-001 still partially fixed (`factory-guardrails.yml`
  confirmed still missing a `permissions:` block, still owner-blocked — no change);
  SEC-002's regex fix and both regression tests confirmed still present and unmodified.
  Also found and fixed a documentation gap in this file: SEC-002 was never added to the
  Findings table above despite being FIXED and VERIFIED since 2026-09-27 — added it.
  Re-ran `npm audit` fresh (0 vulnerabilities now — the 2 moderate findings noted
  2026-09-27 are gone via dependabot's vitest 5.0.1 bump, PR #15) and re-checked source
  maps/env leakage in `npm run build`'s `out/` (still clean). Re-attempted the
  branch-protection and workflow-permissions API reads from SEC-001 — both still 403,
  unchanged, still NOT VERIFIED. Reviewed the two PRs that landed/opened since the last
  security run for new attack surface: design lane's PR #25 (CSS token wiring + JSX
  restyle across 4 pages, merged) — no new rendering paths, no `dangerouslySetInnerHTML`
  introduced, `target="_blank"` links already carry `rel="noopener noreferrer"`; dev
  lane's PR #27 (open, fixes issue #26's `react`/`react-dom` CI-breaking peer mismatch)
  — a build-tooling fix, not a security change, diff-reviewed and confirmed it doesn't
  touch SEC-002's regex or weaken its regression tests (only adds a
  `// @vitest-environment node` docblock to run them under Node instead of jsdom).
  Least-recently-reviewed categories A01/A02/A07/A09 re-confirmed unchanged (still no
  auth, no API routes, no PII collection, no logging infra — all still Phase 3+).
  No new findings this run.
