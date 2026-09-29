# CHANGELOG

All notable changes to RepoGrove are recorded here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/). Append-only; each lane appends its own
entries.

## [Unreleased]

### Added
- 2026-09-27 — Factory bootstrap: repo scaffold, operating docs (CLAUDE.md,
  PROJECT_STATE.md, PRODUCT.md, ARCHITECTURE.md, ADRs), CI + guardrail workflows,
  factory state/decision files, initial roadmap issues. (dev)
- 2026-09-27 — `docs/design/DESIGN-SYSTEM.md` v1: WCAG 2.1 AA-validated color/type/
  spacing/radius/elevation/motion tokens (light + dark theme) and component pattern
  specs (repo/Grove card, alternatives table, status/momentum chips, dates,
  loading/empty/error states, page headers); `docs/design/tokens/generate_palette.py`,
  the reproducible generator behind every quoted color value; `docs/design/
  UX-PRINCIPLES.md` journeys per persona. Documentation only — not yet wired into a
  Tailwind config (no app scaffolded yet, issue #5). PR #9. (design)
- 2026-09-27 — Phase 1 walking skeleton: Next.js 16 App Router + TypeScript + Tailwind
  scaffold under `/src`, statically exported (`output: "export"`, per ADR-002/RG-2 —
  Azure Storage static-website hosting has no server runtime); `/content` loader
  (`src/lib/content.ts`, `gray-matter`) that validates frontmatter and fails the build
  loudly on a missing/invalid field or a duplicate `github` value; homepage plus
  `/grove/[slug]` and `/repo/[slug]` pages, statically generated for every Grove/repo
  currently in `/content` (`ai`, `self-hosted`, `ollama`, `supabase`) via
  `generateStaticParams` — no hardcoded routes. Markdown bodies render through
  `react-markdown` (no `dangerouslySetInnerHTML`). 23 Vitest unit/render tests; `npm run
  lint`/`test`/`build` all green locally. Closes #5, #6, #7. (dev)
- 2026-09-27 — Phase 2 kickoff: `RepositorySnapshot` ingestion. ADR-005 resolves
  `docs/WORKPLAN.md`'s open storage question (committed SQLite, not build-time
  regeneration — reconciles ADR-002/ADR-003 given Azure Storage static hosting has no
  server to query live). `scripts/ingestion/fetch-snapshots.mjs` reads every repo in
  `/content` frontmatter, fetches stars/forks/open_issues/watchers from the GitHub API,
  and idempotently upserts into the now-committed `data/repogrove.db`
  (`.gitignore` carries one explicit exception for it); a repo whose fetch fails is
  skipped with a warning rather than failing the run. `.github/workflows/ingestion.yml`
  runs it daily and commits snapshot changes directly (no PR — mechanical, non-editorial
  data per `CLAUDE.md` rule 4). 15 new Vitest tests (schema round-trip, upsert
  idempotency, per-repo isolation, graceful degradation on fetch failure, `github`-slug
  shape validation against `docs/security/README.md`'s open SSRF item). Closes #16, #17.
  (dev)
- 2026-09-27 — Expanded tracked repos from 2 to 5 (LangChain, vLLM, Coolify added
  alongside Ollama, Supabase) to reach `docs/WORKPLAN.md`'s Phase 2 gate minimum. Each
  new `content/repos/*.md` page is hand-drafted (What it does / Why people use it /
  Pros / Cons), not a scraped GitHub description; licenses verified against each repo's
  actual `LICENSE` file rather than assumed. Open WebUI deliberately excluded — its 2025
  license change (v0.6.6+) moved it off an OSI-approved license. PR #23. Manually
  triggered `ingestion.yml` afterward so day-1 snapshot history exists for all 5 repos
  immediately rather than waiting for the next daily cron. (dev)
- 2026-09-27 — First real security-lane OWASP pass (bootstrap run had only populated the
  table as NEEDS-VERIFICATION). Reviewed CI/CD workflow config, the content-rendering
  path, the ingestion job's SSRF surface, `npm audit`, `.gitignore` secret-pattern
  coverage, and the static-export build output; moved A03/A05/A06/A08/A10 to PASS with
  evidence. Two findings fixed: SEC-001 (LOW) — `ci.yml` now declares an explicit
  least-privilege `permissions: { contents: read }` instead of relying on an
  unverifiable default (`factory-guardrails.yml` has the same gap but is locked from
  all-lane edits by `CLAUDE.md` rule 7 — left open for the owner); SEC-002 (LOW,
  surfaced by this PR's own independent review) — `scripts/ingestion/
  fetch-snapshots.mjs`'s `GITHUB_SLUG_PATTERN` had a dead owner-segment guard that let
  `../rate_limit`-shaped values past validation into a same-host path-traversal-shaped
  request; fixed with a TDD regression test. PR #24. (security)
- 2026-09-28 — Quiet run, no code change: the Phase 2 data-maturity gate (#18/#19/#20/#21
  all need 3+ consecutive days of real `RepositorySnapshot` history) isn't met yet — only
  day-1 (2026-09-27) exists; the daily `ingestion.yml` cron (`17 4 * * *` UTC) hadn't
  fired a second time yet as of this run (00:49 UTC). Housekeeping instead: issue #19
  (`/trending`) was found incorrectly auto-closed by PR #23's merge — its body's
  disclaimer sentence "does **not** close #19/#20" still matched GitHub's `close #N`
  keyword regex despite the negation — reopened with an explanation, no work was
  actually lost. Issue #17 (`RepositorySnapshot` schema) was fully implemented and
  merged in PR #22 but never auto-closed (a GitHub inconsistency with the
  comma-separated `Closes #16, #17` syntax — #16 closed, #17 didn't); closed manually to
  match reality. `npm ci`/`lint`/`test` (43/43)/`build` all re-verified green locally.
  (dev)
- 2026-09-28 — Wired `docs/design/DESIGN-SYSTEM.md`'s v1 tokens into code, now that
  Phase 1 pages exist (issues #5/#7 closed): `src/app/globals.css` gained a full
  primitive → semantic token layer (neutral/brand color scales, the 1.25-ratio type
  scale, radius/elevation/motion) in Tailwind v4's CSS-first `@theme`/`@theme inline`
  config, with light/dark redefined per `prefers-color-scheme` — the same pattern the
  scaffold already used for `--background`/`--foreground`, generalized. All four Phase 1
  pages (`layout.tsx`, `page.tsx`, `repo/[slug]/page.tsx`, `grove/[slug]/page.tsx`)
  restyled onto the semantic classes (sans UI chrome, serif long-form prose, mono
  stats/slugs, brand-teal links) in place of raw `zinc-*`/`emerald-700` Tailwind
  defaults, plus a global `prefers-reduced-motion` baseline (WCAG 2.3.3 floor). Verified
  with Playwright screenshots — light/dark × desktop/tablet/mobile, all 6 pages/viewports
  — before merging; font *files* (Inter/Source Serif 4/IBM Plex Mono via `next/font`)
  intentionally left for the dev lane per this doc's own Typography section (needs an
  ADR note), fallback stacks are live now. An independent review subagent caught two
  real defects before merge, both fixed: (1) the `article :where(a)`/`body` base styles
  were unlayered CSS, which always beats Tailwind's own `@layer utilities` regardless of
  specificity — silently overriding any text-color utility on a link inside `<article>`
  (visible in the repo page's GitHub link, rendered teal instead of the intended muted
  gray); moved into `@layer base` to fix. (2) the repo/Grove page `<h1>` used `text-3xl`,
  which the new type scale sizes at 39px/hero — DESIGN-SYSTEM.md's own "Page headers"
  spec calls for `text-2xl` (31px), reserving `text-3xl` for the homepage hero only;
  fixed on both pages. Also caught in review: the `--duration-fast`/`--duration-base`
  tokens, if placed inside `@theme` as first drafted, compile away entirely (Tailwind v4
  doesn't recognize a `--duration-*` theme namespace) — moved to plain `:root` custom
  properties instead, usable via `duration-[var(--duration-fast)]`. Re-verified
  `npm ci`/`lint`/`test` (43/43)/`build` and re-screenshotted after every fix. (design)
- 2026-09-28 — Fixed CI red on `main` (issue #26): dependabot PR #11 bumped `react-dom`
  to `19.3.0` without a matching `react` bump, so `npm ci` failed with an ERESOLVE peer
  error from a clean checkout, blocking CI for every PR (including the design lane's
  PR #25). Bumped `react` to `19.3.0` to match and regenerated `package-lock.json`.
  While validating, found a second CI-breaking regression from the same dependabot
  batch: `@vitejs/plugin-react` 6.1.1 / `vitest` 5.0.1 (PRs #14/#15) made Vite refuse to
  bundle the Node built-in `node:sqlite` under the default jsdom test environment,
  failing `tests/ingestion/{fetch-snapshots,snapshots-db}.test.ts`; fixed by pinning
  those two Node-only suites to `// @vitest-environment node`. Also grouped
  `react`/`react-dom`/`@types/react`/`@types/react-dom` in `.github/dependabot.yml` so
  future bumps can't split them again. `npm ci && npm run lint && npm test` (43/43)
  `&& npm run build && npm audit --audit-level=high` all verified clean on a fresh
  install. (dev)
- 2026-09-28 — Security re-verification pass, no new findings: re-checked both prior
  FIXED findings with evidence rather than on faith. SEC-001 (`factory-guardrails.yml`
  permissions gap) confirmed still open/owner-blocked, unchanged. SEC-002 (ingestion
  slug-traversal regex) confirmed still fixed — regex and both regression tests
  unmodified. Found and fixed a gap in `docs/security/README.md`'s own Findings table:
  SEC-002 had never been added to it despite being FIXED and VERIFIED since 2026-09-27.
  Re-ran `npm audit` fresh: 0 vulnerabilities (the 2 moderate findings noted 2026-09-27
  are resolved via dependabot's vitest 5.0.1 bump, PR #15). Re-checked `out/` for
  leaked source maps/env values (clean) and re-attempted the branch-protection /
  workflow-permissions API reads from SEC-001 (both still 403, unchanged). Reviewed
  design lane's merged PR #25 (CSS token wiring, 4 pages restyled) and dev lane's PR #27
  (opened and merged during this same run — fixes issue #26's CI-breaking
  `react`/`react-dom` peer mismatch, and incidentally the `@vitejs/plugin-react`/`vite`
  peer conflict that was separately breaking `npm test` on a clean `main` checkout at
  the time this review started) for new attack surface — neither introduces a security
  issue; PR #27 only adds a `// @vitest-environment node` docblock to the two ingestion
  test files, doesn't touch SEC-002's fix or weaken its tests. `lint`/`build`/`npm audit`
  verified clean via `--legacy-peer-deps` install before PR #27 merged (`npm ci` failed
  cleanly until then, issue #26); re-verified `npm ci && npm test` (43/43) clean after
  PR #27 landed. Also found the shared factory lock (`holder: dev`,
  `current_run: 2026-09-28T02:00:00Z`) was 65+ minutes old with no dev section update at
  run start — reclaimed for this run per the lock-staleness rule; dev's session was in
  fact still active and opened/merged PR #27 moments later against this run's
  lock-acquisition commit, so no work was lost, but flagging the timing overlap for
  visibility. (security)
- 2026-09-28 — Phase 2: star-growth chart on `/repo/[slug]` (#18, PR #31).
  `src/lib/snapshots.ts` reads `data/repogrove.db` at `next build` time
  (`process.getBuiltinModule("node:sqlite")`, not a static import, so the module stays
  importable from `tests/app/repo-page.test.tsx`'s jsdom environment — see that file's
  doc comment); `getGrowthSummary` computes a "+N stars / M days" figure over whatever
  history exists (baseline = oldest snapshot within the last 30 days), not a fixed
  minimum. `src/components/StarGrowthChart.tsx` renders three states — no history yet,
  a single snapshot (count + tracking-start date, no delta), or 2+ snapshots (sparkline
  + growth figure) — closing #18's "degrade gracefully, never crash the build"
  acceptance criteria. Also manually dispatched `ingestion.yml` mid-run (its daily cron
  hadn't self-fired in 2 days), bringing `data/repogrove.db` to 2/3 days of history for
  all 5 repos. 12 new/updated tests; `npm ci && lint && tsc --noEmit && test (58/58) &&
  build && audit --audit-level=high` all clean locally. (dev)
- 2026-09-28 — Real self-hosted fonts (Inter/Source Serif 4/IBM Plex Mono) via
  `next/font/google` in `src/app/layout.tsx`, replacing the system-fallback-only
  stacks `src/app/globals.css` used since PR #25; `--font-sans`/`--font-serif`/
  `--font-mono` now resolve `var(--font-x, fallback)` with the fallback passed inside
  the `var()` call (an independent review subagent caught that a fallback appended
  after a comma outside `var()` would invalidate the whole declaration, not just that
  entry, if the loaded variable were ever unset — fixed before merge). `next/font`
  self-hosts at `next build` time, no runtime Google CDN request, compatible with
  `output: "export"`. `docs/adr/ADR-006-font-loading.md` records the decision per
  CLAUDE.md rule 7. `npm run build`'s font fetch can't be verified in this sandbox
  (network allowlisted to npm/GitHub only) — verified green on CI before merging.
  PR #32. (dev)
- 2026-09-28 — Security re-verification pass; one new finding. Re-checked SEC-001/
  SEC-002 with evidence (both unchanged: `factory-guardrails.yml` still owner-blocked,
  SEC-002's regex/tests still intact). Reviewed dev lane's PR #31 (star-growth chart)
  and PR #32 (self-hosted fonts) for new attack surface — both clean: PR #31's
  `node:sqlite` reads are parameterised and rendered through JSX (no injection/XSS
  surface); PR #32's fonts are fetched and self-hosted at `next build` time only, no
  runtime CDN call, confirmed by reproducing the expected local build failure (sandbox
  proxy blocks `fonts.googleapis.com`) and confirming CI's build job (real network
  access) passed on `main`. `npm ci`, `lint`, `test` (58/58), `npm audit
  --audit-level=high` (0 vulnerabilities) verified clean locally; broadened the
  secret-pattern scan to every commit's diff since the last security run (none found);
  re-reviewed all three GitHub Actions workflows for script-injection via untrusted
  `${{ github.event.* }}` in `run:` steps (none present, unchanged). New finding:
  SEC-003 (LOW) — GitHub's Dependabot security-alerts feature (distinct from
  `dependabot.yml`'s scheduled version-update PRs) is disabled on the repo, confirmed
  via the GitHub API; not fixable by this lane (normally repo-admin, and the enabling
  endpoint is separately blocked by this sandbox's proxy). Opened issue #33
  (`needs-human`) covering SEC-003 and the pre-existing branch-protection
  recommendation together. PR #34. (security)
- 2026-09-28 — `.github/workflows/design-screenshots.yml`: wires the Playwright +
  axe-core screenshot/accessibility harness (ADR-007) into CI on GitHub-hosted
  runners, so it can finally run against the real, correctly-fonted production build
  (this factory's sandbox network can't reach `fonts.googleapis.com`, which `next
  build` needs per ADR-006). A separate workflow, not a job inside `ci.yml`, and not a
  required/blocking check — see ADR-007's addendum. First real run (PR #39, triggered
  by the PR that added the workflow itself): 18/18 checks passed, 0 axe-core WCAG 2.1
  A/AA violations across `/`, `/grove/ai`, `/repo/ollama` × desktop/tablet/mobile ×
  light/dark. The 18 real screenshots exist as a workflow artifact but couldn't be
  downloaded into this sandbox (blocked network path to GitHub's artifact-storage
  backend) — visual review is still outstanding. PR #39. (design)
- 2026-09-29 — `src/components/StatusChip.tsx`: the first real "status chip" component
  per `DESIGN-SYSTEM.md`'s Component patterns spec, replacing `/repo/[slug]`'s
  plain-text `STATUS_LABEL` map ("🟢 Active" as one unstyled string) with a real
  icon+label pill using the `success`/`warning`/`text.secondary` semantic tokens (not
  the `momentum-*` tokens, reserved for the future computed Momentum/Heat chip —
  issue #21). Icon `aria-hidden`, text label is what's announced. Verified against real
  CI screenshots post-merge (light/dark × desktop/tablet/mobile). Flagged a future
  icon-collision risk with the momentum chip (both use 🟢/🟡/⚪ for different concepts)
  as issue #52. PR #53. (design)
- 2026-09-29 — `src/components/RepoCard.tsx`/`GroveCard.tsx`: the first real "Repo/Grove
  card" component per `DESIGN-SYSTEM.md`'s Component patterns spec, replacing the
  homepage's plain `<ul>` of text links with `bg.elevated`/`radius-md`/`elevation-1`
  cards (name, one-line description, stars/category footer for repos; repo count for
  Groves). Entire card is a single focus stop via the "stretched link" pattern (one
  `<a>`, concise accessible name, no nested interactives). Momentum chip, `language`,
  and the "why interesting" one-liner are honestly omitted (no fabricated data — see
  `DESIGN-SYSTEM.md`'s built-note for the full reasoning). 10 new component tests. PR
  #54. (design)

### Changed
- 2026-09-28 — `scripts/ingestion/fetch-snapshots.mjs`/`snapshots-db.mjs` converted to
  TypeScript (`.ts`) now that `@types/node` (`^26`) ships `node:sqlite`'s types;
  behavior unchanged (same SQL, upsert logic, fetch/skip-on-failure loop). `.github/
  workflows/ingestion.yml` now runs `node scripts/ingestion/fetch-snapshots.ts`
  directly (Node 22 strips TS syntax at runtime, no build step). `/trending`/`/rising`/
  Heat (#19-21) remain data-gated (2/3 days of real snapshot history; `ingestion.yml`'s
  daily cron still hasn't self-fired even 4.5h past its scheduled time today — worked
  around via `workflow_dispatch` both prior calendar days), so this run picked up this
  bounded, unblocked tech-debt item instead — closes the TECH-DEBT.md row flagged
  "partially stale" by a prior run. Also fully diagnosed (not fixed — see TECH-DEBT.md)
  why dependabot PRs #28 (typescript 7.0.2) and #29 (eslint 10.11.0) fail their own CI:
  both are genuine upstream incompatibilities (`typescript-eslint` doesn't support TS
  7.0 yet; `eslint-plugin-react` breaks under ESLint 10's changed rule-context API),
  not fixable from this repo. PR #35. (dev)
- 2026-09-28: design lane — added a reusable Playwright + axe-core screenshot/
  accessibility harness (`@playwright/test`, `@axe-core/playwright` as devDependencies;
  `playwright.config.ts`, `tests/design/screenshots.spec.ts`,
  `scripts/design/static-server.mjs`, `npm run design:screenshots`) so future runs and
  contributors can check every route × viewport × color-scheme for WCAG 2.1 AA
  violations without a one-off, globally-installed script. See ADR-007. Verified
  mechanically this run (18/18 checks passed against a temporary local build); real
  screenshots with the production font stack are left to a future run/CI with network
  access to Google Fonts (ADR-006's existing constraint). (design)
- 2026-09-28 — Ingestion now captures total contributor counts alongside
  stars/forks/open_issues/watchers, resolving the item ADR-005 deferred. A second,
  independent GitHub API call per repo (`GET /repos/{owner}/{repo}/contributors?
  per_page=1&anon=true`) reads the total off the `Link` header's `rel="last"` page
  number rather than paging through every contributor; `repository_snapshots` gained a
  nullable `contributors` column via an additive migration, applied to the real
  committed `data/repogrove.db` as part of this change. A contributor-fetch failure is
  isolated from the main metrics fetch (stores `contributors: null`, keeps the day's
  star/fork/issue snapshot; a same-day re-run's failure doesn't clobber an
  already-known value). Independent review caught and fixed a real bug pre-merge: the
  single-page fallback could silently under-count when a `Link` header lacked
  `rel="last"`. See ADR-005's addendum. PR #37. (dev)
- 2026-09-29 — `/trending` and `/rising`'s previously near-duplicated ~40-line
  list-row block extracted into a shared `src/components/RankedList.tsx`
  (`RankedList` + an internal `RankingRow`) — markup-for-markup identical to what
  both pages inlined before, so no visible or behavioral change; each page still
  computes its own ranking math and `reason()` string, passing only pre-formatted
  entries. Flagged as this lane's carried-over "next major task" since design run 10
  (see `TECH-DEBT.md`, `docs/design/DESIGN-SYSTEM.md`). New
  `tests/components/ranked-list.test.tsx`; both pages' existing tests pass
  unmodified. Independent reviewer subagent: no findings. (design)

### Fixed
- 2026-09-28 — Ingestion's `watchers` metric now captures the real, distinct GitHub
  "watch" count (`subscribers_count`) instead of `watchers_count`, which the modern
  GitHub REST API deliberately keeps identical to `stargazers_count` — every
  `repository_snapshots.watchers` value captured so far was actually a duplicate of
  `stars`. `subscribers_count` is already present on the same `GET /repos/{owner}/{repo}`
  response `fetchRepoMetrics` already fetches, so this needed no new API call or schema
  change — only the value written to the existing `watchers` column changes going
  forward; existing rows are left as captured (volatile, ingestion-owned data, not
  backfilled). Resolves the item deferred at ADR-005 and tracked in TECH-DEBT.md since
  2026-09-27. `/trending`/`/rising`/Heat (#19-21) remain data-gated (still 2/3 days of
  snapshot history), so this run picked up this bounded, unblocked correctness fix
  instead. PR #38. (dev)
- 2026-09-28 — SEC-004: the design lane's local Playwright screenshot-harness server
  (`scripts/design/static-server.mjs`, 127.0.0.1-only, CI/contributor-machine-only)
  crashed its entire Node process on a single malformed-percent-encoding HTTP request
  (`decodeURIComponent` throwing an uncaught `URIError` inside an unawaited `async`
  request handler — an unhandled promise rejection, fatal in Node). Reproduced
  directly with `curl` before fixing. Fixed: the handler now catches `URIError` (→
  400) and any other unexpected error (→ 500) instead of crashing. Regression test
  (`tests/scripts/design-static-server.test.ts`) uses a raw TCP socket, the only way
  to send a genuinely malformed `%` (normal HTTP clients like `fetch()` reject/
  normalize it client-side) — confirmed it failed against the pre-fix code first
  (TDD). Independent reviewer subagent found no blocking issues. Severity LOW: never
  internet-facing, CI/local-dev only. See
  `docs/security/findings/SEC-004-static-server-malformed-uri-dos.md`. PR #40.
  (security)
- 2026-09-28 — Re-confirmed GitHub's artifact-storage backend is still unreachable
  from this sandbox, so the real Playwright screenshots `design-screenshots.yml` has
  produced since PR #39 still haven't been visually reviewed. Drafted the fix
  (`commit-screenshots` job, `push:[main]`-only, its own scoped
  `permissions: { contents: write }`) but did not ship it — this environment's own
  action-approval layer declined the attempt to commit a workflow requesting write
  access as a self-authorized "Permission Grant." Filed as owner decision RG-6
  (`.factory/decisions.yaml`, issue #41, emailed the owner) with the full job design
  in `docs/adr/ADR-007-design-screenshot-a11y-harness.md`'s addendum 2, ready to
  implement once answered. PR #42 (docs/decisions only). (design)
- 2026-09-28 — With the owner's RG-6 approval ("1 go ahead") recorded, attempted to add
  the drafted `commit-screenshots` job (ADR-007 addendum 2) to
  `.github/workflows/design-screenshots.yml` — a `push:[main]`-only job with its own
  scoped `permissions: { contents: write }`, downloading the `screenshots` job's
  Playwright artifact and committing changed PNGs to `docs/design/screenshots/`
  directly, with two deviations from addendum 2's core design: gated on
  `needs.screenshots.result != 'cancelled'` rather than `== 'success'` (so a red
  axe-core run still gets its screenshots committed for review), and a
  fetch-rebase-retry push loop mirroring `ingestion.yml`'s (addendum 2 had explicitly
  decided against a retry loop). **Staging the change was declined again** by this
  environment's own action-approval layer, tagged "Permission Grant" — the same
  category run 5 hit, but this time after recorded owner approval, showing the block is
  structural (independent of `.factory/decisions.yaml`'s answered/open state, which
  this environment's approval layer has no visibility into) rather than a "try again
  once answered" situation. Reverted rather than routed around through another tool or
  a smaller diff. The exact, still-correct job YAML is left in
  `docs/adr/ADR-007-design-screenshot-a11y-harness.md`'s addendum 3 for the owner (or a
  human-supervised session) to apply directly — no future unattended factory run looks
  likely to get a different answer from this class of action. Docs-only, no code/
  workflow diff shipped this run. (design)
- 2026-09-28 — Dependabot PR #28 (`typescript` 5.9.3→7.0.2), already diagnosed across
  several runs as breaking `npm run lint` (`typescript-eslint` doesn't support TS 7.0
  yet — bundled transitively via `eslint-config-next`; upstream
  typescript-eslint/typescript-eslint#10940), was merged directly by the owner outside
  the factory's CI-gated flow, putting `main` red. Reverted `typescript` to `^5`
  (regenerated `package-lock.json`) and added a `.github/dependabot.yml` ignore rule
  for `typescript` semver-major bumps so the same breaking proposal doesn't keep
  recurring until that upstream gap closes. Independent reviewer subagent found no
  issues; CI green for real (including a real `next build` on the GitHub-hosted
  runner). PR #45. (dev)
- 2026-09-28 — Security review of the design lane's `commit-screenshots` job
  (`.github/workflows/design-screenshots.yml`, RG-6), which the owner applied directly
  to `main` (commit `517c8e4`) after this class of change was previously blocked from
  being self-granted by any factory lane. Confirmed job-level `contents: write` is
  correctly scoped (unreachable from the workflow's `pull_request` trigger, every
  other job stays `contents: read`, the artifact download is limited to the triggering
  run) — least-privilege, no finding. Re-verified all 4 open/fixed security findings
  (SEC-001 through SEC-004) with fresh evidence — all unchanged. Re-ran `npm ci` (0
  vulnerabilities), `npm run lint` (clean), `npm test` (75/75), `npm audit
  --audit-level=high` (0 vulnerabilities); `npm run build` confirmed green on CI's
  GitHub-hosted runner (this sandbox still can't reach `fonts.googleapis.com`, unrelated
  ADR-006 gap). Docs-only, no code/workflow diff shipped this run. (security)
- 2026-09-29 — Dev run 17: quiet run, no code/content changed. `/trending` (#19) still
  data-gated (2/3 calendar days; today's 04:17 UTC ingestion hadn't fired yet at run
  start). Confirmed `main` CI green (3/3 checks), 0 open dev-lane PRs, 4 new dependabot
  PRs (#46 `actions/download-artifact` 4→8, #47 `actions/upload-artifact` 4→7, #48
  `vitest` 5.0.1→5.0.2, #49 `@types/node` 26.6.2→26.6.3) all green on their own CI — not
  merged (dependabot PRs carry no `factory` label and aren't opened by this lane, so
  they're outside this lane's merge gate; the owner has merged these directly every
  time so far). Checked all open owner-decision Gmail threads: RG-4 re-read in full via
  `get_thread` — still exactly 3 messages, no new reply since 2026-09-27T17:32:04Z, due
  2026-09-30 (tomorrow). Confirmed RG-6 is now fully resolved, not just answered: the
  owner applied the drafted `commit-screenshots` job directly to `main` (commit
  `517c8e4`, found by security run 7) and it's working — real screenshots are committing
  under `docs/design/screenshots/*.png`. Updated `PROJECT_STATE.md`'s stale "owner must
  apply it" blocker line to reflect this. Ran `npm ci` (0 vulnerabilities), `npm run
  lint` (clean), `npm test` (75/75), `npm audit --audit-level=high` (0 vulnerabilities)
  locally; `npm run build` reproduced the known ADR-006 sandbox font-fetch gap, confirmed
  green on CI's GitHub-hosted runner instead. No unclaimed security/design findings, no
  TODO/FIXME in src/scripts/tests. Quiet run per CLAUDE.md rule 8. (dev)
- 2026-09-29 — UX-2026-001: the header logo (`🌱 RepoGrove`) and the homepage's `🌳
  Groves` heading used literal leaf/tree emoji, contradicting `DESIGN-SYSTEM.md`'s own
  Brand scale rationale ("a quiet nod to 'Grove' without an illustrated leaf anywhere") —
  found during this lane's first real review of the correctly-fonted screenshots RG-6
  landed. The homepage's `📦 Repositories` heading isn't foliage but was removed
  alongside it for heading-to-heading consistency (no spec calls for an icon on either).
  Fixed: both files now rely on typography alone. 2-file, content-only change; no
  token/layout change needed. See
  `docs/design/findings/UX-2026-001-brand-mark-leaf-emoji.md`, issue #50, PR #51.
  (design)
- 2026-09-29 — Dev run 18: quiet run, no code/content changed. `/trending` (#19) still
  data-gated (2/3 calendar days; today's 04:17 UTC ingestion cron still ~1.5h away at run
  start ~02:50 UTC). Confirmed `main` CI green (3/3 checks at head `40113c4` before this
  run's lock commit), 0 open dev-lane PRs, 0 new dependabot PRs since run 17 (`#29`,
  `#46`-`#49` unchanged, all outside this lane's merge gate). Checked the RG-4 owner-
  decision Gmail thread in full via `get_thread` — still exactly 3 messages, no new reply
  since 2026-09-27T17:32:04Z, due 2026-09-30 (tomorrow, design lane's call to default);
  searched recent owner mail for anything else RepoGrove-related — nothing new. Ran `npm
  ci` (0 vulnerabilities), `npm run lint` (clean), `npm test` (75/75), `npm audit
  --audit-level=high` (0 vulnerabilities) locally; `npm run build` reproduced the known
  ADR-006 sandbox font-fetch gap, left to CI's GitHub-hosted runner as in every prior run.
  No unclaimed security/design findings, no TODO/FIXME in src/scripts/tests. Quiet run
  per CLAUDE.md rule 8. (dev)
- 2026-09-29 — Security run 8: quiet run, no new findings. Only change since run 7 was
  the design lane's UX-2026-001 emoji-removal fix (`src/app/layout.tsx`,
  `src/app/page.tsx`) — reviewed as pure JSX text edits, no new attack surface. Re-verified
  all 4 existing findings by reading the code directly: SEC-001 (`factory-guardrails.yml`
  still missing a `permissions:` block, still owner-blocked, unchanged), SEC-002
  (`GITHUB_SLUG_PATTERN` + both regression tests unmodified), SEC-004 (`static-server.mjs`
  fix + regression test unmodified). SEC-003 unchanged (still can't confirm/enable
  Dependabot alerts from this sandbox — this run's proxy responses differed in wording
  from earlier runs' but the practical status is the same; noted in
  `docs/security/README.md`). A01/A02/A07/A09 re-confirmed unchanged (no auth, no API
  routes, no PII collection, no logging infra — all Phase 3+). `main`'s 3 CI checks
  (Factory guardrails, Lint/test/build, Dependency vulnerability scan) all green at the
  current head. Ran `npm ci` (0 vulnerabilities), `npm run lint` (clean), `npm test`
  (75/75), `npm audit --audit-level=high` (0 vulnerabilities) locally; `npm run build`
  reproduced the known ADR-006 sandbox font-fetch gap, confirmed green on CI's real
  GitHub-hosted runner instead. Quiet run per CLAUDE.md rule 8. (security)
- 2026-09-29 — Dev run 20: quiet run, no code/content changed. `/trending` (#19) still
  data-gated (2/3 calendar days, re-verified against a freshly git-fetched `main` via
  `node:sqlite`; today's 04:17 UTC ingestion cron still hadn't fired as of run start
  ~06:50 UTC, ~2h33m late — within past lateness range, e.g. run 10's 6h37m delay).
  Re-read issue #21's own body this run: it explicitly lists "needs several days of real
  `RepositorySnapshot` history to validate against" as a dependency, so drafting ADR-004
  (Grove Heat methodology) ahead of data isn't a safe substitute task either. Confirmed
  `main` CI green (at head `7f39e3e` before this run's lock commit, and `fa7c915` after),
  0 open dev-lane PRs, 0 new dependabot PRs since run 19. Checked the RG-4 owner-decision
  Gmail thread — still exactly 3 messages, no new reply since 2026-09-27T17:32:04Z, due
  2026-09-30 (design lane's call to default); nothing else RepoGrove-related in recent
  mail. Ran `npm ci` (0 vulnerabilities), `npm run lint` (clean), `npm test` (79/79),
  `npm audit --audit-level=high` (0 vulnerabilities) locally; `npm run build` reproduced
  the known ADR-006 sandbox font-fetch gap, confirmed green on CI's GitHub-hosted runner
  instead. No unclaimed security/design findings. Quiet run per CLAUDE.md rule 8. (dev)
- 2026-09-29 — Security run 9: the quietest run yet — no code, workflow, dependency, or
  content changes landed on `main` at all since run 8 (only dev run 20's docs/state
  close-out). Re-verified all 4 existing findings by reading the code directly: SEC-001
  (`factory-guardrails.yml` still no `permissions:` block, unchanged, owner-blocked;
  `ci.yml`/`ingestion.yml`/`design-screenshots.yml` all still correctly scoped), SEC-002
  (`GITHUB_SLUG_PATTERN` + both regression tests unmodified), SEC-004
  (`static-server.mjs`'s malformed-URI fix + regression test unmodified). SEC-003:
  re-ran the same 3 GitHub-side checks, status unchanged (issue #33 stays open,
  owner-actionable). Reviewed the 2 open dependabot GitHub Actions PRs bumping
  `actions/download-artifact` (4→8) and `actions/upload-artifact` (4→7), the two actions
  used by the run-7-reviewed `commit-screenshots` job — outside this lane's merge gate,
  no new finding (v8's `digest-mismatch: error` default is a secure-by-default
  improvement, not a risk). Secret-pattern scan of every commit since run 8 — no hits.
  Re-confirmed A01/A02/A07/A09 with fresh greps. `main`'s CI green at the current head.
  Ran `npm ci` (0 vulnerabilities), `npm run lint` (clean), `npm test` (79/79), `npm
  audit --audit-level=high` (0 vulnerabilities) locally; `npm run build` reproduced the
  known ADR-006 sandbox font-fetch gap, confirmed green on CI's real GitHub-hosted
  runner instead. No new findings. Quiet run per CLAUDE.md rule 8. (security)
- 2026-09-29 — Dev run 22: `/trending` (issue #19), the Phase 2 gate met for the first time
  (5 real repos, 3+ calendar days of snapshot history in `data/repogrove.db`). New page ranks
  tracked repos by absolute star growth (spec §8 "Hot Right Now"), with a real, computed
  "+N stars in the last M days" reason line rather than a fabricated one — no Grove Heat/
  momentum score exists yet (issue #21/ADR-004, separately data-gated). New
  `getGrowthSummaries(githubSlugs, dbPath?)` in `src/lib/snapshots.ts` batches the read (opens
  `data/repogrove.db` once, parameterized `WHERE github IN (...)`) rather than looping the
  existing single-repo helper — also resolves the 2026-09-29 homepage-card N+1 tech-debt row
  (`src/app/page.tsx` now uses the same batched call). New pure `rankByAbsoluteGrowth` in
  `src/lib/trending.ts` (filters out repos with no history or only one snapshot; keeps a repo
  with negative growth, sorted last, rather than hiding a real decline). Trending rows reuse
  RepoCard/GroveCard's "stretched link" single-focus-stop pattern. Header nav gained a
  "Trending" link. Independent review before push found no MAJOR issues; fixed the 4 MINOR/
  POLISH items it raised (this TECH-DEBT.md row, a test assertion that didn't mirror
  `formatDelta`'s exact three-way branching, a missing empty-state test, a stale doc comment).
  105/105 tests pass (14 new/updated), lint clean, `tsc --noEmit` clean, `npm audit
  --audit-level=high` 0 vulnerabilities, all run locally; `next build` reproduces the known
  ADR-006 sandbox font-fetch gap, left to CI's GitHub-hosted runner as in every prior run. (dev)
- 2026-09-29 — Dev run 23: `/rising` (issue #20), sharing the same Phase 2 data-maturity
  gate `/trending` already met. New page ranks tracked repos by *relative* star growth
  (percent change against each repo's own baseline, not raw stars gained — spec §6/§8
  "Rising Repositories," surfacing a smaller repo growing unusually fast rather than
  favoring already-large repos) with a real, computed "+N.N% star growth in the last M
  days" reason line — no Grove Heat/momentum score exists yet (issue #21/ADR-004,
  separately data-gated), matching `/trending`'s own non-goal. New pure
  `rankByRelativeGrowth` in `src/lib/rising.ts` (`percentGrowth = deltaStars /
  (currentStars - deltaStars) * 100`; excludes a repo with no history, only one snapshot,
  or a zero/negative baseline star count — dividing by that would produce
  Infinity/NaN, not a real percentage; keeps a repo with negative growth, sorted last,
  same convention as `/trending`). Rising rows reuse the same "stretched link"
  single-focus-stop pattern. Header nav gained a "Rising" link. Independent review
  before push found no MAJOR issues; fixed the MINOR items it raised: `formatPercent`
  now signs off the *rounded* value so a genuinely tiny but nonzero percentage (e.g.
  0.02%) displays as "±0.0%" rather than a stray-looking "+0.0%"/"-0.0%" (float
  percentages can hit this in a way `/trending`'s integer star deltas never do); the
  reason line reads "star growth", not bare "stars" (a percentage in front of "stars"
  read as a fraction of one star); `/trending`'s own doc comment, which called `/rising`
  "not yet built," updated; a new TECH-DEBT.md row for the ~40-line row-rendering block
  now duplicated between the two pages; an added negative-baseline test case alongside
  the existing zero-baseline one. 120/120 tests pass (15 new), lint clean, `tsc --noEmit`
  clean, `npm audit --audit-level=high` 0 vulnerabilities, all run locally; `next build`
  reproduces the known ADR-006 sandbox font-fetch gap, left to CI's GitHub-hosted runner
  as in every prior run. (dev)
- 2026-09-29 — Design run 10: the alternatives comparison table (spec §3-4, the site's
  stated "killer feature"), `src/components/AlternativesTable.tsx`, wired into
  `/repo/[slug]` (PR #57). `repo.alternatives` frontmatter (open-source/commercial slugs)
  had existed since Phase 1 but was never rendered — repo pages only had a hand-authored,
  explicitly-placeholder "## Alternatives" Markdown sentence. Resolves each open-source
  alternative slug against `/content/repos`: a repo with its own content file links with
  live status (`StatusChip`) and stars (batched via the existing `getGrowthSummaries`,
  no N+1); a slug with no content file yet (most of today's data) renders honestly as
  its raw slug, unlinked, labeled "Not yet profiled" rather than linking to a 404 or
  fabricating a display name. Commercial alternatives render as a plain unlinked chip
  list. One deliberate v1 reduction from the original spec line, recorded rather than
  dropped: not interactively sortable (`aria-sort`) — `language`/`hosting`/activity
  aren't in the content model yet, leaving one real numeric column (`stars`), so rows
  are pre-sorted server-side instead of needing a client component (new `TECH-DEBT.md`
  row, design-owned, to revisit once a second sortable column exists). New
  `src/lib/content.ts` helpers: `splitOutSection()` swaps the old placeholder prose for
  the computed table at render time without touching the source Markdown; a build-time
  throw catches "## Alternatives" heading drift so the two can't silently duplicate;
  `assertValidAlternatives()` fails the build loudly on a duplicate or self-referencing
  alternative slug (both flagged by independent review as previously-silent failure
  modes this same change introduced the surface for). Real post-merge screenshot review
  (`/repo/ollama`, has both a resolved and two unresolved alternatives) caught one more
  rough edge same-run: the table's fixed `min-w-[28rem]` pushed wider than the 390px
  mobile viewport, cutting the `Category` column off-screen — not a WCAG failure
  (axe-core's 18/18 passed either way) but a real gap, fixed in a same-run follow-up
  (PR #58, `UX-2026-002`) by hiding `Category` below Tailwind's default `sm` breakpoint
  instead of forcing a scroll for it. 135/135 tests pass (15 new), lint clean, `tsc
  --noEmit` clean, `npm audit --audit-level=high` 0 vulnerabilities, all run locally;
  `next build` reproduces the known ADR-006 sandbox font-fetch gap, left to CI's
  GitHub-hosted runner. Both PRs' CI confirmed green post-merge (18/18 axe-core checks,
  0 WCAG 2.1 A/AA violations). (design)
- 2026-09-29 — Grove Heat v1 (spec §7/§23, issue #21, `docs/adr/ADR-004-grove-heat-v1.md`,
  PR #59) — Phase 2's last item, now complete. `data/repogrove.db` only has enough real
  history for one of issue #21's proposed inputs (star growth rate); commit recency,
  release frequency, GitHub-trending appearances and external mentions all need new
  ingestion, explicitly out of scope per the issue's own non-goals, and contributor
  counts only gained a non-null reading on each repo's *most recent* snapshot so far —
  no real delta computable yet. New `src/lib/heat.ts`: `computeHeat(history)` labels one
  of the four states `docs/design/DESIGN-SYSTEM.md` already specified (Rising/Active/
  Slowing/Dormant) from relative, per-day star growth against provisional thresholds
  checked against the 5 tracked repos' real growth rates; returns `null` (no chip, never
  a fabricated label) when there isn't enough history yet, matching the "omit, don't
  fabricate" convention `AlternativesTable`/`RepoCard` already use. Open-issues and
  contributor-growth ship as supplementary, non-gating, inspectable signals rather than
  being folded into the label. New `src/components/MomentumChip.tsx` mirrors
  `StatusChip`'s pattern using the already-wired `momentum-*` design tokens; wired into
  `/repo/[slug]` next to `StatusChip`, reusing the page's existing snapshot-history call.
  Independent review before push caught a real bug: the star-growth rate used
  `getGrowthSummary`'s 30-day-windowed baseline while the supplementary signals defaulted
  to the absolute-earliest snapshot ever — invisible today (every repo has ≤3 days of
  history) but would silently diverge past 30 days. Fixed pre-push by extracting
  `getGrowthBaseline(history)` out of `src/lib/snapshots.ts` so every signal on the chip
  shares one baseline row, with a regression test. 160/160 tests pass (25 new/updated),
  lint clean, `tsc --noEmit` clean, `npm audit --audit-level=high` 0 vulnerabilities, all
  run locally; `next build` reproduces the known ADR-006 sandbox font-fetch gap, left to
  CI's GitHub-hosted runner — confirmed green there (`ci.yml`, `factory-guardrails.yml`,
  and the non-gating `design-screenshots.yml`, real screenshots reviewed post-merge).
  Issue #21 auto-closed by the merge; ROADMAP.md's Phase 2 checklist is now fully
  checked. (dev)
- 2026-09-29 — UX-2026-003: `StatusChip` and `MomentumChip` (issue #21/ADR-004, PR #59,
  shipped same day) rendered their "active" state as an identical 🟢 dot + "Active" text
  — every one of today's 5 repos is `status: active`, and ollama's real momentum reads
  `active` too, so the real `repo-ollama__*.png` screenshots showed two visually
  identical pills next to each other for two genuinely different claims (editorial
  maintenance vs. computed growth signal), exactly the collision issue #52 (design run
  8) had pre-flagged before momentum existed to compare against. Fixed by giving
  `StatusChip` a distinct icon shape — a plain, hard-edged square swatch via
  `bg-current`, not a dot — rather than touching `MomentumChip`, whose 🔥/🟢/🟡/⚪ icon
  set is spec-locked in `DESIGN-SYSTEM.md`. An independent reviewer subagent caught a
  real bug before merge: the first attempt used `rounded-sm` (4px) on the swatch's
  10px box, which a real Playwright render showed reads as a circle, not a square, at
  that size — the fix would have shipped, tests green, without solving the collision.
  Revised to `rounded-none` at a 12px box and re-rendered to confirm the shapes are now
  genuinely distinct; tightened the regression test to assert the specific class.
  Issue #52 closed. See
  `docs/design/findings/UX-2026-003-status-momentum-chip-icon-collision.md`. 161/161
  tests pass (5 updated: `tests/components/status-chip.test.tsx`,
  `tests/app/repo-page.test.tsx`), lint clean, `tsc --noEmit` clean, `npm audit
  --audit-level=high` 0 vulnerabilities, all run locally; `next build` reproduces the
  known ADR-006 sandbox font-fetch gap, left to CI. (design)
- 2026-09-29 — Phase 3 issues filed (#61-65, mirroring how #5-7/#16-21 mirrored Phase
  1/2's ROADMAP rows): alternatives pages, comparison pages, full-text search,
  sitemap/OpenGraph/SEO, newsletter signup. (dev)
- 2026-09-29 — `/alternative/:slug` (#61, PR #66): spec §4's "paid product →
  free/open-source alternative" pages — distinct from the already-shipped
  `/repo/[slug]` `AlternativesTable`, which answers "what else instead of *this*
  repo" for a repo that already has its own page. New `src/lib/content.ts` support
  (`parseAlternative`/`getAllAlternatives`/`getAlternative`, reading
  `content/alternatives/*.md`'s frontmatter `product`/`category` and body sections
  `Open source`/`Free`/`Commercial`/`Best fit` — same fail-loudly-on-malformed-content
  convention as `parseRepo`/`parseGrove`). New `src/app/alternative/[slug]/page.tsx`
  resolves each "Open source" display name against `content/repos/*.md` (link + stars
  when resolved, plain text + "Not yet profiled" otherwise — the same convention
  `AlternativesTable` already established). `content/alternatives/notion.md`'s
  bootstrap-era placeholder Free/Commercial sections filled in with real,
  uncontroversial facts. Independent review before push found no MAJOR issues; fixed
  two MINOR items (missing test coverage for the resolved-item render path through
  the actual page component; `assertNoDuplicateListItems` not applied to "Best fit")
  and two POLISH items (an unrendered process note moved out of the content file; the
  `-`-only bullet convention documented) pre-push. 178/178 tests pass (17 new), lint
  clean, `tsc --noEmit` clean, `npm audit --audit-level=high` 0 vulnerabilities, all
  run locally; `next build` reproduces the known ADR-006 sandbox font-fetch gap,
  confirmed green on CI's GitHub-hosted runner (6/6 checks) before squash-merging.
  Issue #61 auto-closed by the merge. (dev)
- 2026-09-29 — Phase 3: `/compare/:a/:b` comparison pages (#62, PR #67) — spec §10's
  "Comparison — how does it differ?" perspective, distinct from `/repo/[slug]`'s
  `AlternativesTable` and `/alternative/:slug`. New content type
  `content/comparisons/<a>-vs-<b>.md` (`ARCHITECTURE.md` schema'd this run):
  frontmatter `repos: [<a>, <b>]`, exactly two `content/repos/*.md` slugs; body has
  one required `## How they differ` section (hand-written prose — the one thing that
  can't be computed). New `src/lib/content.ts` support (`parseComparison`/
  `getAllComparisons`/`getComparison`/`getComparisonsForRepo`, plus
  `assertComparisonReposExist`/`assertNoDuplicateComparisonPairs` cross-file
  validators — same fail-loudly convention as every other content type; unlike
  `/alternative/:slug`'s tolerant resolved-or-plain-text rendering, both repos in a
  comparison must already have their own page or the build fails). New
  `src/app/compare/[a]/[b]/page.tsx`: an at-a-glance table (stars, license, status,
  momentum, category — reused from `getRepo`/`getGrowthSummaries`/`computeHeat`, never
  re-derived) plus each repo's Pros/Cons extracted straight from its own
  `content/repos/*.md` body (`extractListItems`, now exported for this reuse) rather
  than re-authored in the comparison file; `getComparison` resolves both URL orders
  (`/compare/ollama/vllm` and `/compare/vllm/ollama`) to the same content, always
  rendered in the file's own canonical order. `src/app/repo/[slug]/page.tsx` gained a
  small "Compared with" cross-link section (`getComparisonsForRepo`) so a reader lands
  on a comparison without knowing the route exists. First real comparison:
  `content/comparisons/ollama-vs-vllm.md` (both already had pages and already listed
  each other as alternatives). `numberFormatter` (TECH-DEBT.md, 2026-09-29 — duplicated
  in `AlternativesTable.tsx`/`alternative/[slug]/page.tsx`) extracted to new
  `src/lib/format.ts` rather than duplicated a third time; both existing call sites
  switched over. Independent review before push found no MAJOR issues; fixed two
  MINOR items pre-push — Grove Heat's two-repo lookup called `getSnapshotHistory` once
  per repo (2 db opens where 1 would do), so added a batched `getSnapshotHistories`
  to `src/lib/snapshots.ts` (mirroring `getGrowthSummaries`'s existing batching,
  refactored to share one query helper) and switched the compare page to it; and the
  `numberFormatter`/ROADMAP.md/CHANGELOG.md close-out updates this entry itself is
  part of. One POLISH item addressed (the comparison content file's own unrendered
  leading title got a comment explaining the convention, matching
  `stripLeadingTitle`'s doc comment for repos/groves). 208/208 tests pass (30 new),
  lint clean, `tsc --noEmit` clean, `npm audit --audit-level=high` 0 vulnerabilities,
  all run locally; `next build` reproduces the known ADR-006 sandbox font-fetch gap,
  left to CI's GitHub-hosted runner. (dev)
- 2026-09-29 — Phase 3: `sitemap.xml` + `robots.txt` (issue #64, PR #69), spec §14's
  SEO strategy. New `src/app/sitemap.ts`/`src/app/robots.ts` (Next's static
  `MetadataRoute` convention, compatible with `output: "export"`), enumerating every
  repo/Grove/alternative/comparison route from the same content-loader functions
  every page already calls — no second source of truth for "what pages exist." New
  `src/lib/site.ts` (`SITE_URL` constant). `/trending`/`/rising` already had real
  per-page metadata since #19/#20 shipped — issue #64's problem statement was stale
  on that point; added a regression test instead of redoing done work. Independent
  review before push found a real MAJOR: omitting the reversed `/compare/:b/:a` URL
  from the sitemap doesn't stop it being indexed separately, since it's still
  pre-rendered and internally linked — fixed with `alternates.canonical` on the
  compare page (both URL orders now point at the file's own canonical order) plus
  `metadataBase` on the root layout. One MINOR (content.ts has no slug-format
  validation) filed as a TECH-DEBT.md row rather than fixed, to keep the PR scoped.
  CI caught a real build error this sandbox's own local build can't reach (blocked
  earlier by the known ADR-006 font-fetch gap): Next 16's `output: "export"` needs
  metadata-route files to declare `export const dynamic = "force-static"` explicitly,
  without which `next build` fails page-data collection for `/robots.txt` outright —
  fixed and re-pushed, confirmed green on CI's real runner before squash-merging.
  226/226 tests pass (18 new/updated), lint clean, `tsc --noEmit` clean, `npm audit
  --audit-level=high` 0 vulnerabilities, all run locally; all 6 CI checks green on
  PR #69 (including a real `next build`); post-merge CI on `main` also green. Issue
  #64 auto-closed by the merge. OG image generation and JSON-LD structured data stay
  out per the issue's own non-goals. (dev)
