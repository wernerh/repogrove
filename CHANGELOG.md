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
