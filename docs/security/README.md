# Security findings index

Reviewed against OWASP Top 10 and OWASP API Security Top 10. Status legend:
PASS / FINDING / NOT APPLICABLE / NEEDS-VERIFICATION.

## OWASP Top 10 coverage
| Category | Status | Notes |
|---|---|---|
| A01 Broken Access Control | NOT APPLICABLE | No auth/accounts exist yet (MVP has none) |
| A02 Cryptographic Failures | NEEDS-VERIFICATION | Phase 3's newsletter signup form landed since the last review (`src/components/NewsletterSignupForm.tsx`, PR #71) but, per its own doc comment and `tests/components/newsletter-signup-form.test.tsx`, deliberately ships with **no working submit path** — no `fetch`, no real `action`/`method`, no PII stored or transmitted anywhere; a submission just flips local UI state to a "coming soon" message. Re-confirmed 2026-10-01 (security run 10) by reading the component directly: still no `fetch`/`action=` targeting anything. Stays NEEDS-VERIFICATION until a real backend exists to collect subscriber emails — this run found no such backend |
| A03 Injection | PASS | Reviewed 2026-09-27 (security run 1): repo/Grove body Markdown is rendered via `react-markdown` (`src/app/repo/[slug]/page.tsx`, `src/app/grove/[slug]/page.tsx`) with no `rehype-raw`/`remark-html`/`dangerouslySetInnerHTML` anywhere in `src/` — raw HTML in content is dropped by default, not executed. No API/DB query surface exists yet (SQLite ingestion writer uses parameterised upserts — see `scripts/ingestion/snapshots-db.mjs`); revisit when Phase 3 adds search/API routes with external input. Re-confirmed 2026-10-01 (security run 10) against the real Phase 3 surface that landed since run 9: `/search` (`src/lib/search-match.ts`) does pure in-memory `.includes()`/`.startsWith()` substring matching over a build-time index — no regex built from user input (no ReDoS vector), no query ever leaves the browser; the new `repository_releases` SQLite table (`scripts/ingestion/snapshots-db.ts`'s `upsertRelease`/`getReleases`, `src/lib/releases.ts`'s `getRecentReleases`) uses parameterised `?`-placeholder queries throughout, same pattern as every existing table — no string-built SQL anywhere |
| A04 Insecure Design | PASS | Hybrid architecture keeps agent output non-authoritative by construction (ADR-003) |
| A05 Security Misconfiguration | FINDING (LOW) — partially fixed; SEC-004/SEC-006 fixed+verified; SEC-005 confirmed this run | SEC-001: CI workflows ran with the default (unverifiable) `GITHUB_TOKEN` permission set rather than an explicit least-privilege grant. Fixed in `ci.yml` this run; `factory-guardrails.yml` has the identical gap but is locked from all-lane edits by CLAUDE.md rule 7 — stays open, needs the owner. `ingestion.yml` was already correctly scoped (`contents: write`, the one job that needs it). See `docs/security/findings/SEC-001-ci-workflow-permissions.md`. Re-checked 2026-09-28 (run 5): `factory-guardrails.yml` still has no `permissions:` block — unchanged, still owner-blocked; the new `design-screenshots.yml` workflow (PR #39) already carries a correct `permissions: contents: read` block, reviewed and confirmed least-privilege. SEC-004 (LOW, FIXED+VERIFIED): the design lane's new local test-harness server (`scripts/design/static-server.mjs`, PR #36/#39) crashed its whole process on a single malformed-percent-encoding request (unhandled rejection from an uncaught `URIError`) — reproduced, fixed (handler now catches and answers 400/500 instead of crashing), regression-tested. See `docs/security/findings/SEC-004-static-server-malformed-uri-dos.md`. Reviewed 2026-09-28 (run 7): `design-screenshots.yml` gained a `commit-screenshots` job with a job-scoped `contents: write` override (RG-6, applied directly by the owner — commit `517c8e4`, not self-granted by any lane). Confirmed the job is unreachable from the workflow's `pull_request` trigger (its `if` requires `github.event_name == 'push'`), every other job in the file keeps `contents: read`, and `download-artifact@v4` can only pull the current run's own artifact — least-privilege, no finding. Re-checked 2026-10-01 (run 10): `ci.yml`/`ingestion.yml`/`design-screenshots.yml` permissions all unchanged; `factory-guardrails.yml` still has none, still owner-blocked. SEC-005 (LOW) — `main` has no branch-protection rule at all, confirmed via a real GitHub `404 "Branch not protected"` (every prior run only got an ambiguous `403`). See `docs/security/findings/SEC-005-branch-protection-not-enabled.md`. New this run (run 11): **SEC-006** (LOW, FIXED partial) — the site is now actually deployed (Azure Static Web Apps, owner-provisioned `c0a5938`/`c6e47df`, `push`-to-`main` deploys confirmed green) with no `staticwebapp.config.json` anywhere, so the live site had zero explicit security-response-headers configuration. Added `public/staticwebapp.config.json` with `X-Content-Type-Options`/`X-Frame-Options`/`Referrer-Policy`/`Permissions-Policy` (headers-only, no routing change, regression-tested). CSP deliberately deferred — see `docs/security/findings/SEC-006-missing-security-headers.md` |
| A06 Vulnerable Components | PASS (defense-in-depth gap noted — SEC-003) | `npm audit` re-run 2026-09-28 (security run 4): **0 vulnerabilities at any level**, unchanged since run 3. CI's `dependency-audit` job gates on `--audit-level=high`; `dependabot.yml` covers both `npm` and `github-actions` ecosystems weekly (version-update PRs #28/#29/#30 open on `main` today). Run 4 additionally checked the repo's GitHub-side Dependabot **alerts** feature (real-time CVE alerts, separate from `dependabot.yml`'s scheduled version-update PRs) — confirmed disabled via the GitHub API itself; the factory can't enable it — the enabling endpoint is blocked by this sandbox's own egress proxy before it reaches GitHub, so whether the installed GitHub App also lacks admin scope for it was never directly tested. See SEC-003 — LOW, owner-actionable, doesn't downgrade this PASS since existing scheduled/CI coverage already catches the same class of issue, just not immediately on CVE publication. Prior note: `main` briefly failed a clean `npm ci` for an unrelated reason (issue #26, `react`/`react-dom` peer mismatch from PR #11 — a build-breaking bug, not a vulnerability); dev lane's PR #27 fixed it same-run as security run 3 |
| A07 Auth Failures | NOT APPLICABLE | No auth in MVP. Re-confirmed 2026-10-01 (run 10) with fresh greps across the full tree, including everything Phase 3 added since run 9 (`search/`, `compare/`, `alternative/`): still no auth/session/cookie/JWT code anywhere in `src/`/`scripts/`; the one `Authorization` grep hit is still the ingestion job's GitHub API token forwarding, not user-facing auth |
| A08 Data Integrity Failures | PASS (defense-in-depth noted) | Dependabot is configured for both ecosystems (weekly); lockfile (`package-lock.json`) is committed and `npm ci` (not `npm install`) is used in every workflow. GitHub Actions are pinned by major-version tag (`@v4`/`@v7`/`@v8`), not by commit SHA — stricter SHA-pinning would be more defensive but isn't a gap given Dependabot's action-update coverage; noted as informational, not a blocking finding |
| A09 Logging/Monitoring Failures | NEEDS-VERIFICATION | No logging/observability infra exists in-repo. Updated 2026-10-02 (run 11): the premise changed — a real deploy pipeline now exists and is live (see SEC-006), so "no live deployment yet" no longer applies; what's still true is there's no server-side API surface generating logs to configure (static export, no `src/app/**/api`/`middleware.ts`), and this lane doesn't inspect the live Azure resource itself to check what platform-level request logging/alerting it may or may not have on by default — stays NEEDS-VERIFICATION, now for a different reason than before |
| A10 SSRF | PASS (fixed a real bypass — SEC-002) | Reviewed 2026-09-27: `scripts/ingestion/fetch-snapshots.mjs` fetches `https://api.github.com/repos/${github}` where `github` is drawn from `/content/repos/*.md` frontmatter. Host is hardcoded (never derived from the value) so this was never a cross-host SSRF vector, but the independent review of this run's own PR (SEC-001) found the `GITHUB_SLUG_PATTERN` allowlist's owner-segment guard was dead code — `../rate_limit` passed validation and resolved (`new URL(...)`) to a same-host path-traversal-shaped request (`/repos/../rate_limit` → `/rate_limit`), letting the ingestion job's token probe arbitrary single-segment `api.github.com` paths. Fixed same run: each segment (owner and name) is now anchored to its own boundary rather than sharing one end-of-string anchor; regression tests added (`tests/ingestion/fetch-snapshots.test.ts`). See SEC-002 for detail. Re-verified 2026-09-28: `GITHUB_SLUG_PATTERN` in `scripts/ingestion/fetch-snapshots.mjs` still carries the fixed pattern, and both regression tests (`rejects a bare-dot-segment OWNER slug`, `still accepts a real owner/name slug that merely contains dots`) are still present in `tests/ingestion/fetch-snapshots.test.ts` |

## OWASP API Security Top 10
Still not applicable — Phase 3 shipped both of the features this section was waiting
on (search, newsletter signup), but neither added a request-driven API: search runs
entirely client-side over a build-time static index (`src/lib/search-match.ts`), and
the newsletter form has no working submit path at all (confirmed 2026-10-01, security
run 10 — see A02 above). No `src/app/**/api` directory or `middleware.ts` exists
anywhere in the tree. Will be reviewed for real the day either gains a server
endpoint, or Phase 4's public API (RG-9, still unscoped) is answered.

## Production hardening checklist
See `docs/security/PRODUCTION-HARDENING.md`.

## Findings
| ID | Severity | Status | Component | Mapping | Issue/PR |
|---|---|---|---|---|---|
| SEC-001 | LOW | PARTIALLY FIXED | `.github/workflows/ci.yml`, `.github/workflows/factory-guardrails.yml` | A05 | PR #24 |
| SEC-002 | LOW | FIXED, VERIFIED | `scripts/ingestion/fetch-snapshots.mjs` (`GITHUB_SLUG_PATTERN`) | A10 | PR #24 |
| SEC-003 | LOW | OPEN, owner-blocked | GitHub repo security settings (Dependabot alerts) | A06 | issue #33 |
| SEC-004 | LOW | FIXED, VERIFIED | `scripts/design/static-server.mjs` | A05 | (this run, no PR yet) |
| SEC-005 | LOW | OPEN, owner-blocked, confirmed 2026-10-01 | GitHub repo security settings (branch protection on `main`) | A05 | issue #33 |
| SEC-006 | LOW | FIXED (partial — CSP deferred, see finding) | `public/staticwebapp.config.json` (new) | A05 | (this run, no PR yet) |

Full detail: `docs/security/findings/SEC-001-ci-workflow-permissions.md`,
`docs/security/findings/SEC-002-ingestion-slug-traversal-regex.md`,
`docs/security/findings/SEC-003-dependabot-alerts-disabled.md`,
`docs/security/findings/SEC-004-static-server-malformed-uri-dos.md`,
`docs/security/findings/SEC-005-branch-protection-not-enabled.md`,
`docs/security/findings/SEC-006-missing-security-headers.md`.

## Review log
- **2026-10-02 (run 11):** first security run since run 10 — a 1-day, ~40-run gap on the
  dev/design side, so reviewed the real surface that shipped (`git diff --stat
  b26eed5..HEAD -- src scripts .github package.json package-lock.json tests`, `b26eed5`
  = run 10's own close-out commit — the prior session's shallow clone had to be
  unshallowed first, `git fetch --unshallow`, to even reach that commit): 58 files,
  ~5,150 insertions. The large majority is dev/design content and component work
  (`TrendBoard`/`TrendHeader`/`GroveHeader`/`GroveRepoList`/`GroveSidebar`/etc., the
  `/trending`/`/rising` redesign, a new `assertNoWrappedListItems` content-validation
  guard) — read directly rather than trusted from PR descriptions, came back clean: no
  `dangerouslySetInnerHTML` outside the pre-reviewed explanatory comment in
  `src/lib/content.ts`, no new `eval`/`new Function`, every new `<Link href=...>` builds
  from build-time-validated slugs, `react-markdown` still has no raw-HTML plugin, the
  one `child_process`-shaped grep hit is `node:sqlite`'s own `Database.exec` on a
  hardcoded DDL string (false positive, not shell exec). One genuinely new, material
  piece of attack surface: `.github/workflows/azure-static-web-apps-orange-sea-032472e10.yml`
  — the owner provisioned a real Azure Static Web App directly (`c0a5938`, Azure's own
  "on-behalf-of: @Azure" portal-integration commit, plus a path fix `c6e47df`) and
  `push`-to-`main` now deploys for real (`GET .../actions/workflows/373247078/runs`
  confirms multiple green `push` runs today; `GET .../commits/main/check-runs` confirms
  "Build and Deploy Job" green on the current head). Reviewed the workflow line by line:
  job-scoped `permissions: {id-token: write, contents: read}`, the deploy token
  referenced only via the `secrets.*` context, `close_pull_request_job` correctly scoped
  to `pull_request: closed` only. Considered and ruled out a fork-PR secret-exfiltration
  concern — this uses `pull_request`, not `pull_request_target`, and GitHub withholds
  repo secrets from fork-triggered `pull_request` runs regardless of repo settings; the
  separate "does a first-time contributor's run need maintainer approval" setting
  couldn't be read (`GET .../actions/permissions*` blocked by this sandbox's proxy, same
  as every prior run's adjacent attempts) — left NEEDS-VERIFICATION, not claimed either
  way. With the pipeline itself clean, the real finding was what it unblocks: this is
  the site's first real live deployment, and `docs/security/PRODUCTION-HARDENING.md`'s
  "CSP / security headers" row had been `NOT VERIFIED` specifically because it was
  "genuinely blocked on a live deployment target" — checked for `staticwebapp.config.json`
  (Azure Static Web Apps' mechanism for response headers on a static-export app with no
  server/middleware available) and found none anywhere in the repo. New finding:
  **SEC-006** (LOW) — fixed the headers-only part this run (`X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, all confirmed safe against
  this site's actual code — no `next/image`, no `<script>`/analytics, no
  camera/mic/geolocation use anywhere in `src/`), written test-first (confirmed failing
  pre-fix, passing post-fix), scoped to `globalHeaders` only so it can't silently change
  routing. Deliberately deferred `Content-Security-Policy` rather than guess at one — see
  the finding for the specific reasons (no server/middleware for nonces on a static
  export, two files with inline `style={{ width }}` needing `style-src 'unsafe-inline'`
  either way, and no way to inspect a real `out/` build this run: `npm run build`
  reproduced the known ADR-006 `fonts.googleapis.com` proxy gap again, and this lane
  doesn't inspect the live deployment directly). Flagged the ADR-002-vs-actual-deployed-product
  discrepancy (owner answered RG-2 as "Azure Storage static-website hosting"; what's
  live is Azure *Static Web Apps*, a related but distinct product ADR-002's own text had
  already flagged as a risk) to the dev lane via one `PROJECT_STATE.md` Blockers line
  (CLAUDE.md §5) — not this lane's ADR/decision to adjudicate. Re-verified all 5 existing
  findings by reading the code/API responses directly: SEC-001 (`ci.yml`/`ingestion.yml`/
  `design-screenshots.yml` permissions unchanged; `factory-guardrails.yml` still has
  none, still owner-blocked), SEC-002 (`GITHUB_SLUG_PATTERN` and both regression tests
  unmodified), SEC-003 (`dependabot/alerts` still returns GitHub's real disabled
  message), SEC-004 (`static-server.mjs`'s try/catch and its regression test
  unmodified), SEC-005 (`branches/main/protection` still a real `404`, main still
  unprotected). Checked the RG-7/8/9 Gmail thread (`get_thread`, `1a0f26990ebc1e9c`) per
  the decision protocol — still exactly the one original message, no owner reply; not
  this lane's decision either way. `npm ci` (0 vulnerabilities), `npm run lint` (clean),
  `npm test` (463/463, up from 457 — SEC-006's 6 new tests), `tsc --noEmit` (clean),
  `npm audit --audit-level=high` (0 vulnerabilities) all run locally; `npm run build`
  reproduced the known ADR-006 sandbox font-fetch gap (confirmed it compiles past
  content loading first), left to CI's real GitHub-hosted runner.
- **2026-10-01 (run 10):** first security run since run 9 (2026-09-29) — a 15-run gap on
  the dev/design side, so the biggest task this run was reviewing the real Phase 3+
  attack surface that landed in that window rather than another "nothing changed" quiet
  run: `git diff --stat bc8aa60..HEAD -- src scripts .github package.json
  package-lock.json` (`bc8aa60` = run 9's own close-out commit) showed 33 files, ~2,860
  new lines — `/search`, `/compare/[a]/[b]`, `/alternative/[slug]`, `/trending`,
  `/rising`, `sitemap.ts`/`robots.ts`, the newsletter signup form, and a new
  `repository_releases` ingestion path (issue #72's "Latest" section), plus dozens of
  content-only PRs already covered by the dev lane's own editorial review. Read every
  file in that diff line by line rather than trusting PR descriptions: `SearchBox.tsx`/
  `search-match.ts` do pure in-memory substring matching with no regex built from user
  input (no ReDoS, no request ever leaves the browser — ADR-008's own design);
  `NewsletterSignupForm.tsx` confirmed to have no working submit path at all (no
  `fetch`, no real `action`) per its own doc comment, so A02 (PII handling) stays
  NEEDS-VERIFICATION rather than becoming a live finding; the new
  `repository_releases` table (`snapshots-db.ts`'s `upsertRelease`/`getReleases`,
  `src/lib/releases.ts`'s `getRecentReleases`) uses parameterised queries throughout,
  same pattern as every existing table; `fetch-snapshots.ts`'s new `fetchRepoReleases`/
  `parseReleases` reuse the same `GITHUB_SLUG_PATTERN`-validated `github` value SEC-002
  already fixed, and independently constrain `html_url` to `https://github.com/...`
  before it's ever rendered as a link `href` on `/repo/[slug]` (confirmed in the repo
  page's own JSX: `rel="noopener noreferrer"`, JSX auto-escaping, no
  `dangerouslySetInnerHTML`); `sitemap.ts`/`robots.ts` are build-time-only, no secrets,
  intentionally public. No findings in any of this new surface — it came back clean.
  Re-verified all 4 existing findings with fresh evidence: SEC-001 (`ci.yml`/
  `ingestion.yml`/`design-screenshots.yml` permissions unchanged; `factory-guardrails.yml`
  still has none, still owner-blocked), SEC-002 (`GITHUB_SLUG_PATTERN` and both
  regression tests unmodified), SEC-004 (`static-server.mjs`'s try/catch and its
  regression test unmodified). SEC-003 re-run: `GET .../dependabot/alerts` still returns
  GitHub's real "Dependabot alerts are disabled for this repository" — unchanged, still
  owner-blocked, issue #33 still open with no owner reply. New finding this run:
  **SEC-005** — re-ran the branch-protection check every prior run (4, 6, 7, 8, 9) logged
  as an ambiguous `403` ("Resource not accessible by integration") and got a decisively
  different answer: a clean `404 "Branch not protected"`, GitHub's own documented
  response for a genuinely unprotected branch, not a scope-rejection or proxy artifact
  (re-ran twice to rule out a fluke; `secret-scanning/alerts` was checked in the same
  pass and is still proxy-blocked, unchanged, confirming this wasn't a general proxy
  change). `main` has no branch-protection rule at all — no required status checks, no
  required review, nothing stopping a force-push — which matters because `CLAUDE.md`
  §3.7's "never bypass branch protection" currently has no technical backstop, only each
  lane's own discipline. Owner-blocked (repo-admin action); added to the existing issue
  #33 (commented with the confirmed status, not a new issue — #33 already covered this
  exact recommendation as unverified) and `docs/security/PRODUCTION-HARDENING.md`'s
  existing row, rather than opening a new owner-decision question — recommending a
  concrete fix is not a `.factory/decisions.yaml`-style choice between options. Checked
  RG-7/8/9's Gmail thread (`get_thread`, `1a0f26990ebc1e9c`) per the decision protocol —
  still exactly the one original message, no owner reply; not this lane's decision to
  act on either way. Fresh greps re-confirmed A01/A07 (still no auth/session/cookie/JWT
  code anywhere, including the new Phase 3 routes) and A09 (still no logging/
  observability infra, no deploy job). `npm ci` (0 vulnerabilities), `npm run lint`
  (clean), `npm test` (330/330), `npm audit --audit-level=high` (0 vulnerabilities) all
  run locally; `npm run build` reproduced the known ADR-006 sandbox font-fetch gap,
  confirmed green on CI's real GitHub-hosted runner instead (current `main` head,
  `bdec5b9`, all checks green).
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
- **2026-09-28 (run 4):** re-verified SEC-001 (`factory-guardrails.yml` still has no
  `permissions:` block, unchanged, still owner-blocked) and SEC-002 (regex and both
  regression tests unmodified). Reviewed the two PRs that landed since run 3 for new
  attack surface: dev lane's PR #31 (star-growth chart, `src/lib/snapshots.ts` +
  `src/components/StarGrowthChart.tsx`) — read-only, parameterised `node:sqlite` query
  (`WHERE github = ?`), values rendered through JSX (auto-escaped, no
  `dangerouslySetInnerHTML`), graceful degradation on missing/corrupt DB confirmed by
  the PR's own testing notes; no injection or XSS surface. Dev lane's PR #32
  (self-hosted fonts via `next/font/google`) — confirmed the font files are fetched and
  self-hosted at `next build` time only (no runtime CDN request), consistent with the
  static export target; reproduced the expected local build failure (this sandbox's
  proxy blocks `fonts.googleapis.com`, same class of gap already noted for
  Postgres/deploy secrets) and confirmed via the GitHub API that CI's build job — which
  has real network access — passed on `main`. Ran `npm ci`, `npm run lint`, `npm test`
  (58/58), `npm audit --audit-level=high` (0 vulnerabilities) locally; `npm run build`
  left to CI for the reason above. Broadened this run's secret-pattern scan beyond
  `check.py`'s committed-tree check to the diff of every commit since run 3 (`git log
  -p`) — no hits. Reviewed all three GitHub Actions workflows for script-injection via
  untrusted `${{ github.event.* }}` context interpolated into `run:` steps (the classic
  Actions vulnerability class) — none use `pull_request_target`, none interpolate
  event-supplied text into shell commands; unchanged from prior reviews. New finding:
  SEC-003 (LOW) — GitHub's Dependabot **alerts** feature (real-time CVE alerts, distinct
  from `dependabot.yml`'s scheduled version-update PRs) is disabled on the repo,
  confirmed via the GitHub API itself, not fixable by this lane (normally a repo-admin
  setting; the enabling endpoint is blocked by this sandbox's own proxy before it
  reaches GitHub, so whether the installed GitHub App also lacks admin scope for it was
  never directly tested — either way, no path to enable it from here). Also checked branch-protection and
  secret-scanning-alert state while at it — both still return 403 through this
  sandbox's proxy, unchanged from prior runs, NOT VERIFIED (not confirmed either way).
  Opened issue #33 (`needs-human`) covering SEC-003 and the pre-existing
  branch-protection recommendation together (same class of ask). Least-recently-reviewed
  categories A01/A02/A07/A09 re-confirmed unchanged.
- **2026-09-28 (run 5):** re-verified SEC-001 (`factory-guardrails.yml` still has no
  `permissions:` block, unchanged, still owner-blocked) and SEC-002 (regex and both
  regression tests in `tests/ingestion/fetch-snapshots.test.ts` unmodified — confirmed
  by reading the file directly, not by trusting the prior write-up). SEC-003 unchanged
  (issue #33 still open, no comments from the owner). Reviewed every PR merged since
  the last security run (#35 ingestion scripts converted `.mjs`→`.ts`, #37 contributor
  counts, #38 `subscribers_count` fix, #39 wiring the design lane's screenshot harness
  into CI) for new attack surface: the `.mjs`→`.ts` conversion carried SEC-002's fixed
  `GITHUB_SLUG_PATTERN` regex over unmodified (confirmed byte-for-byte in
  `scripts/ingestion/fetch-snapshots.ts`); the new `fetchContributorCount` function
  reuses the same validated `github` string interpolated into the same hardcoded-host
  URL — no new injection/SSRF surface; both `snapshots-db.ts` and `src/lib/snapshots.ts`
  use parameterised `?`-placeholder queries throughout, no string-built SQL; the new
  `design-screenshots.yml` workflow already carries a correct least-privilege
  `permissions: contents: read` block (no finding). New finding: SEC-004 (LOW) — the
  design lane's new local static-file test server (`scripts/design/static-server.mjs`,
  introduced by #36/#39) crashed its entire process on a single malformed
  percent-encoded request (`decodeURIComponent` throwing inside an unawaited `async`
  request handler → unhandled rejection → fatal). Reproduced directly with `curl`
  before fixing. Fixed same run: the handler now catches `URIError` (→ 400) and any
  other unexpected error (→ 500) instead of crashing; wrote a failing regression test
  first (`tests/scripts/design-static-server.test.ts`, using a raw TCP socket since normal HTTP
  clients won't send a malformed `%` on their own), confirmed it failed against the
  pre-fix code, then applied the fix and confirmed it passes. Ran `npm ci` (0
  vulnerabilities), `npm run lint` (clean), `npm test` (75/75, up from 73 — the 2 new
  SEC-004 regression tests), `npm audit --audit-level=high` (0 vulnerabilities)
  locally; `npm run build` left to CI as usual (known sandbox font-fetch gap,
  ADR-006 — unchanged, reproduced and confirmed still the same failure mode).
  Least-recently-reviewed categories A01/A02/A07/A09 re-confirmed unchanged (still no
  auth, no API routes, no PII collection, no logging infra — all still Phase 3+).
- **2026-09-28 (run 7):** the only workflow/dependency change since run 6 was new,
  material attack surface: the design lane's `commit-screenshots` job (RG-6,
  `.github/workflows/design-screenshots.yml`), which grants a `contents: write`
  override to one job in a workflow that otherwise runs on `pull_request` too.
  Confirmed via `git log` that this exact job was applied directly by the owner
  (`Werner <whurter5@gmail.com>`, commit `517c8e4`, "infra(design): commit real
  screenshots to main on push (RG-6)") — not self-granted by any factory lane, which
  matches CLAUDE.md rule 6's human gate on this class of change and closes out
  ADR-007 addendum 3/design run 6's finding that this environment's own
  action-approval layer structurally blocks a lane from granting `contents: write`
  to itself. Reviewed the job itself line by line: it only runs when
  `github.event_name == 'push'` (the workflow's `pull_request` trigger, which does
  fire on untrusted fork PRs, hits only the pre-existing read-only `screenshots`
  job — `commit-screenshots`'s `if` excludes it entirely, so a fork PR can never
  reach the write path); `contents: write` is scoped at job level, not workflow
  level, so every other job (including `screenshots` itself) keeps the workflow's
  `contents: read` default; `actions/download-artifact@v4` is called with no
  `run-id`, so it can only pull the artifact produced earlier in the *same* run, not
  an artifact from another (potentially attacker-controlled) run; the commit identity
  (`repogrove-factory[bot]` / `repogrove-factory@users.noreply.github.com`) and the
  fetch/rebase/retry push loop both match the already-reviewed precedent in
  `ingestion.yml` (SEC-001/A05 reviewed that pattern previously) byte-for-byte in
  approach. No `pull_request_target` anywhere in the file. Verdict: PASS, least
  privilege, no new finding. Re-verified all 4 existing findings with fresh evidence
  rather than trusting the prior write-up: SEC-001 — `factory-guardrails.yml` still
  has no `permissions:` block (unchanged, still owner-blocked); `ci.yml`
  (`contents: read`) and `ingestion.yml` (`contents: write`, its one job that needs
  it) both still correctly scoped. SEC-002 — `GITHUB_SLUG_PATTERN` in
  `scripts/ingestion/fetch-snapshots.ts` and both regression tests in
  `tests/ingestion/fetch-snapshots.test.ts` confirmed present and byte-for-byte
  unmodified. SEC-003 — re-ran all three GitHub-side checks: `dependabot/alerts`
  still returns GitHub's own "Dependabot alerts are disabled" (403, real);
  `branches/main/protection` still 403 "Resource not accessible by integration" (no
  admin scope, unchanged, NOT VERIFIED either way); `secret-scanning/alerts` still
  blocked at this sandbox's own egress proxy, unchanged, NOT VERIFIED. SEC-004 — the
  `static-server.mjs` `try/catch`/`URIError`→400/500 fix and both regression tests
  confirmed present and unmodified. Re-confirmed the least-recently-reviewed
  categories with fresh greps rather than assumption: no `src/app/**/api` or
  `middleware.ts` exists, no auth/session/cookie/JWT code anywhere in
  `src/`/`scripts/`, no `dangerouslySetInnerHTML`/`eval(`/`new Function(` usage (the
  one `dangerouslySetInnerHTML` grep hit is still the explanatory code comment in
  `src/lib/content.ts`, not a usage) — A01/A02/A07/A09 stay
  NOT APPLICABLE/NEEDS-VERIFICATION on the same grounds as every prior run (no auth,
  no API routes, no PII collection, no logging infra — all still Phase 3+). Diffed
  every file that changed since run 6 (`git diff --stat f2b7f1f..HEAD`, excluding the
  now-reviewed screenshots + docs/dashboard/decisions/changelog churn): `package.json`
  ended byte-identical (the dev lane's typescript 7→5 revert, PR #45, round-tripped
  back to the same pinned version); `package-lock.json`'s 512-line diff is entirely
  the resulting `typescript`/`typescript-eslint` transitive-dependency regeneration —
  confirmed no unexpected package names or registries in the diff, all
  `registry.npmjs.org`; `.github/dependabot.yml` gained a behavior-only `ignore` rule
  (no secrets, no new permissions); `.gitignore` gained two local-IDE-artifact lines.
  No `content/`, `src/`, or `scripts/` changes at all since run 6. Ran `npm ci` (0
  vulnerabilities), `npm run lint` (clean), `npm test` (75/75), `npm audit
  --audit-level=high` (0 vulnerabilities) locally; `npm run build` reproduced the
  known sandbox font-fetch gap (ADR-006, `fonts.googleapis.com` blocked by this
  sandbox's proxy) — confirmed CI's real build job green on the current `main` head
  instead (GitHub-hosted runner, real fonts). No new findings. Quiet run per CLAUDE.md
  rule 8 — the one new attack surface this run reviewed came out clean, and nothing
  regressed.
- **2026-09-29 (run 8):** only change since run 7 was the design lane's UX-2026-001 fix
  (`src/app/layout.tsx`, `src/app/page.tsx`) — removing literal leaf/tree emoji from the
  header logo and two homepage headings, plus the resulting screenshot refresh
  (`docs/design/screenshots/*.png`, binary-only diff). Diffed both files directly: pure
  JSX text-node edits (`🌱 RepoGrove` → `RepoGrove`, `🌳 Groves` → `Groves`, `📦
  Repositories` → `Repositories`), no new rendering path, no `dangerouslySetInnerHTML`,
  nothing user-input-derived — no new attack surface, no finding. No `.github/workflows/*`,
  `scripts/`, or `package.json`/lockfile changes at all since run 7 (confirmed via `git
  diff --stat 46ba348..HEAD`). Re-verified all 4 findings by reading the code directly
  rather than trusting the prior write-up: SEC-001 (`ci.yml`/`ingestion.yml`/
  `design-screenshots.yml` all still carry correct `permissions:` blocks;
  `factory-guardrails.yml` still has none — unchanged, still owner-blocked, confirmed via
  `grep -n permissions .github/workflows/factory-guardrails.yml` returning nothing);
  SEC-002 (`GITHUB_SLUG_PATTERN` in `scripts/ingestion/fetch-snapshots.ts` and both
  regression tests in `tests/ingestion/fetch-snapshots.test.ts` present, byte-for-byte
  unmodified); SEC-004 (`static-server.mjs`'s `URIError`→400/other→500 `try/catch` and its
  regression test present, unmodified). SEC-003 — re-ran the same three GitHub-side
  checks this run: `GET .../vulnerability-alerts` and `GET .../secret-scanning/alerts`
  both came back as this sandbox's own egress-proxy rejection this time ("Access to this
  GitHub API path is not permitted through this proxy"), not GitHub's own disabled-alerts
  message as in earlier runs; `GET .../branches/main/protection` still a real GitHub `403`
  ("Resource not accessible by integration", no admin scope). Noting the discrepancy
  rather than glossing over it: whether the proxy allowlist tightened or the earlier
  runs' "GitHub's own disabled message" framing was itself an artifact of the same
  proxy-vs-GitHub ambiguity, this run can't tell which from here — either way the status
  doesn't change (still can't confirm or enable Dependabot alerts from this sandbox, issue
  #33 stays open, owner-actionable). Re-confirmed the least-recently-reviewed categories
  with fresh greps: no `src/app/**/api` or `middleware.ts`, no auth/session/cookie/JWT
  code anywhere in `src/`/`scripts/`, no `dangerouslySetInnerHTML`/`eval(`/`new Function(`
  usage (the one `dangerouslySetInnerHTML` hit is still the explanatory comment in
  `src/lib/content.ts`) — A01/A02/A07/A09 stay NOT APPLICABLE/NEEDS-VERIFICATION, still no
  auth, no API routes, no PII collection, no logging infra (all Phase 3+). Checked all 5
  open dependabot PRs (`#29`, `#46`-`#49`) — unchanged since run 7, none touched by any
  lane. Checked the RG-4 owner-decision Gmail thread (`get_thread`) — still exactly 3
  messages, no new reply since 2026-09-27T17:32:04Z; not this lane's decision to default.
  Ran `npm ci` (0 vulnerabilities), `npm run lint` (clean), `npm test` (75/75), `npm audit
  --audit-level=high` (0 vulnerabilities) locally; `npm run build` reproduced the known
  ADR-006 sandbox font-fetch gap, confirmed green on CI's real GitHub-hosted runner
  instead (all 3 checks — Factory guardrails, Lint/test/build, Dependency vulnerability
  scan — green on `main`'s current head). No new findings — genuinely quiet run.
- **2026-09-29 (run 9):** no code, workflow, dependency, or content changes landed on
  `main` since run 8 (`git diff --stat 7f39e3e..HEAD`, excluding
  `docs/dashboard`/`docs/design/screenshots` churn: only `.factory/state.yaml`,
  `CHANGELOG.md`, `DECISIONS.md`, `PROJECT_STATE.md` — all from dev run 20's quiet
  close-out, no `src/`/`scripts/`/`.github/workflows/`/`package.json` diff at all) — the
  quietest run yet, nothing new to review. Re-verified all 4 findings by reading the code
  directly rather than trusting the prior write-up: SEC-001 (`ci.yml`/`ingestion.yml`/
  `design-screenshots.yml` all still carry correct `permissions:` blocks — `ci.yml`
  `contents: read`, `ingestion.yml` `contents: write`, `design-screenshots.yml`
  `contents: read` at workflow level with the `commit-screenshots` job's `contents: write`
  override still scoped to that one job; `factory-guardrails.yml` still has no
  `permissions:` block at all — unchanged, still owner-blocked); SEC-002
  (`GITHUB_SLUG_PATTERN` in `scripts/ingestion/fetch-snapshots.ts` and both regression
  tests in `tests/ingestion/fetch-snapshots.test.ts` present, byte-for-byte unmodified);
  SEC-004 (`static-server.mjs`'s `URIError`→400/other→500 `try/catch` and its regression
  test present, unmodified). SEC-003 — re-ran the same three GitHub-side checks:
  `vulnerability-alerts` and `secret-scanning/alerts` both came back as this sandbox's own
  egress-proxy rejection again ("Access to this GitHub API path is not permitted through
  this proxy") — consistent with run 8's noted discrepancy, not GitHub's own
  disabled-alerts message this time either; `branches/main/protection` still a real GitHub
  `403` ("Resource not accessible by integration", no admin scope). Status unchanged
  either way — issue #33 stays open, owner-actionable. Reviewed the two open GitHub
  Actions dependabot PRs touching the one workflow (`design-screenshots.yml`) with a
  reviewed write-scoped job — `#46` (`actions/download-artifact` 4→8) and `#47`
  (`actions/upload-artifact` 4→7): both are outside this lane's merge gate (dependabot-
  authored, no `factory-security` label) so not actioned, but read their release notes for
  any change relevant to the job-scoped `contents: write` review from run 7 — none found;
  if anything, v8's new default (`digest-mismatch: error`, failing the run on a hash
  mismatch instead of only warning) is a secure-by-default improvement over v4's behavior,
  not a new risk. Secret-pattern scan of every commit since run 8 (`git log -p
  7f39e3e..HEAD`) — no hits. Fresh greps for the least-recently-reviewed categories: no
  `src/app/**/api` or `middleware.ts` (A01/API surface — still none), no
  `dangerouslySetInnerHTML`/`eval(`/`new Function(` usage (the one hit is still the
  explanatory comment in `src/lib/content.ts`), and the one real `auth`-pattern grep hit
  (`Authorization` header in `scripts/ingestion/fetch-snapshots.ts`'s `githubHeaders`) is
  the pre-reviewed GitHub API token forwarding, not user-facing auth — A01/A02/A07/A09
  stay NOT APPLICABLE/NEEDS-VERIFICATION on the same grounds as every prior run (no auth,
  no API routes, no PII collection, no logging infra — all still Phase 3+). Ran `npm ci`
  (0 vulnerabilities), `npm run lint` (clean), `npm test` (79/79), `npm audit
  --audit-level=high` (0 vulnerabilities) locally; `npm run build` reproduced the known
  ADR-006 sandbox font-fetch gap, confirmed green on CI's real GitHub-hosted runner
  instead (`main`'s current head, all checks green). No new findings — genuinely quiet
  run per CLAUDE.md rule 8.
- **2026-09-28 (run 6):** no code or workflow changes landed on `main` since run 5
  (`git log --since` shows only lock-acquire/close-out commits plus PR #42, which is
  docs/decisions-only — confirmed via `git diff --stat` across the full range: 10 files,
  all `.md`/`.yaml`/`dashboard`, zero `src/`/`scripts/`/`.github/workflows/` changes).
  Re-verified every open/fixed finding with fresh evidence rather than trusting the
  prior write-up: SEC-001 — `factory-guardrails.yml` still has no `permissions:` block
  (`grep -n permissions .github/workflows/factory-guardrails.yml` empty), still
  owner-blocked, unchanged; `ci.yml`'s `permissions: contents: read` and
  `ingestion.yml`'s job-scoped `permissions: contents: write` both still correct.
  SEC-002 — `GITHUB_SLUG_PATTERN` in `scripts/ingestion/fetch-snapshots.ts` and both
  regression tests in `tests/ingestion/fetch-snapshots.test.ts` confirmed present and
  unmodified. SEC-003 — re-ran the same two API checks: `GET .../dependabot/alerts`
  still returns GitHub's own "Dependabot alerts are disabled" (real, not a proxy
  artifact); `GET .../branches/main/protection` still 403 "Resource not accessible by
  integration" (also a real GitHub answer — no repo-admin scope, unchanged);
  `GET .../secret-scanning/alerts` still blocked at this sandbox's own egress proxy
  ("Access to this GitHub API path is not permitted through this proxy"), so that one
  stays NOT VERIFIED as before, not confirmed either way. SEC-004 — the `static-server.mjs`
  handler's `try/catch`/`URIError`→400/`500` fix and both regression tests confirmed
  still present and unmodified. Re-confirmed the least-recently-reviewed categories with
  fresh greps rather than assumption: no `src/app/**/api` or `middleware.ts` directory
  exists (`find`/`grep` came back empty), no auth/session/cookie/JWT code anywhere in
  `src/`/`scripts/`, and the one `dangerouslySetInnerHTML` grep hit is a code *comment*
  in `src/lib/content.ts` explaining why the codebase avoids it, not a usage — A01/A02/A07/A09
  stay NOT APPLICABLE/NEEDS-VERIFICATION on the same grounds as every prior run (no
  auth, no API routes, no PII collection, no logging infra — all still Phase 3+). Also
  re-read `ci.yml`, `ingestion.yml`, `design-screenshots.yml`, and `dependabot.yml` in
  full for script-injection via untrusted `${{ github.event.* }}` context in `run:`
  steps and for `pull_request_target` usage — none found, unchanged from prior reviews.
  Ran `npm ci` (0 vulnerabilities), `npm run lint` (clean), `npm test` (75/75),
  `npm audit --audit-level=high` (0 vulnerabilities) locally; `npm run build` left to CI
  as usual (known sandbox font-fetch gap, ADR-006 — reproduced, unchanged). No new
  findings. Quiet run per CLAUDE.md rule 8 — nothing unverified, nothing regressed,
  nothing new to fix.
