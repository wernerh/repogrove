# CHANGELOG

All notable changes to RepoGrove are recorded here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/). Append-only; each lane appends its own
entries.

## [Unreleased]

### Added
- 2026-10-02 — Factory run protocol moved into the repo: shared `factory-core` skill plus
  `dev-factory`, `security-factory` and `design-factory` lane skills under `.claude/skills/`,
  and three read-only reviewer subagents (`factory-reviewer-dev`, `-security`, `-design`)
  under `.claude/agents/`, replacing prompts that existed only in scheduled-task config.
  `.claude/**` added to `CLAUDE.md` rule 7's protected paths, `.github/CODEOWNERS` added,
  `docs/factory/README.md` documents the cutover. Owner-authored; scheduled tasks are not
  changed by this PR. (infra)
- 2026-10-02 — Dev run 57: added Immich (`content/repos/immich.md`, `immich-app/immich`,
  AGPL-3.0) to the Self-Hosted grove — the next item from `PRODUCT.md` §2's own named
  example list (Coolify, Dokploy, CasaOS, Portainer, Immich, Nextcloud) not yet built.
  Self-hosted photo/video backup with native mobile apps and ML-powered face
  recognition/search, positioned against Google Photos/Apple iCloud Photos (spec §8's
  "replace paid software" pattern); no open-source alternative exists in the catalog yet
  for this category, so no comparison page was needed. Two other spec-named candidates
  ("Continue", "Aider" — both from the AI grove's example list) were researched and
  rejected this run: Continue was acquired by Cursor and is reported EOL/discontinued in
  2026; Aider has an open, unresolved GitHub issue asking whether it has stopped
  receiving updates — shipping either as `status: active` would misrepresent it. 375/375
  tests pass (5 new/updated), lint/`tsc --noEmit` clean, 0 `npm audit` findings, all run
  locally; `npm run build` reproduced the known ADR-006 sandbox font-fetch gap, left to
  CI (green, all 4 checks). Independent review (subagent) found no BLOCKER/MAJOR/MINOR
  issues. PR #111. (dev)
- 2026-10-02 — Dev run 56: completed the Databases grove's pairwise comparison matrix
  — only 3 of 6 possible cross-pairs among DuckDB/ClickHouse/SQLite/PostgreSQL existed;
  added the 3 missing ones (`duckdb-vs-postgresql.md`, `clickhouse-vs-postgresql.md`,
  `clickhouse-vs-sqlite.md`) and completed all 4 repos' `alternatives.open_source`
  frontmatter to a fully mutual quartet, same shape as the git-TUI trio/AI inference
  trio/editor cluster. 369/369 tests pass (4 new), lint/`tsc --noEmit` clean, 0
  `npm audit` findings, all run locally; `npm run build` reproduced the known ADR-006
  sandbox font-fetch gap, left to CI. Independent review (subagent) found a real MAJOR:
  all 4 repos' `## Pros`/`## Cons` bullets were word-wrapped onto two physical lines,
  which `content.ts`'s `extractListItems()` silently truncates (only captures lines
  starting with "- ") — this PR's 3 new comparison pages would have rendered every one
  of those bullets cut off mid-sentence. Fixed by rewrapping onto single lines
  (content unchanged) before merging; added regression assertions on the full,
  untruncated bullet text. PR #108 (5/5 gating checks green, including the non-gating
  Playwright/axe-core run); post-merge CI on `main` confirmed green.
- 2026-10-02 — Dev run 56 (continued): a full-corpus scan prompted by PR #108's own
  truncation finding found the identical wrapped-bullet problem in 11 more repos'
  Pros/Cons — `appwrite`, `dokploy`, `gitui`, `helix`, `lazygit`, `llamaindex`,
  `localai`, `pocketbase`, `tig`, `vim`, `zed` — meaning most of the site's existing
  `/compare` pages were already rendering truncated bullets, not just the 3 new ones
  from #108. Rewrapped every affected bullet onto a single physical line (wording
  unchanged — verified via a normalization diff, not just passing tests). Added a new
  build-time guard, `assertNoWrappedListItems()`, wired into both `parseRepo()`
  (Pros/Cons) and `parseAlternative()` (Open source/Free/Commercial/Best fit — the
  file type that already suffered this exact bug once for real, per this file's own
  run-49 entry below) — a future wrapped bullet now fails the build loudly instead of
  truncating silently, the same "durable check over a one-off fix" approach the design
  lane used for UX-2026-006. 375/375 tests pass (6 new) against the real, full
  `content/` corpus, lint/`tsc --noEmit` clean, 0 `npm audit` findings, all run
  locally; `npm run build` reproduced the known ADR-006 sandbox font-fetch gap, left to
  CI. Independent review (subagent) wrote a normalization script confirming every
  rewrapped file is word-for-word identical to its prior content, traced the
  validator's edge cases against the real corpus, and caught that the first draft only
  wired the guard into `parseRepo()` — fixed to also cover `parseAlternative()` before
  opening the PR. PR #109 — pushed with CI still running when this run's 40-minute lock
  window closed; CI went green shortly after (6/6 checks), merged at close-out once
  confirmed. RG-7/8/9 re-checked this run — still no owner reply (RG-7 defaults
  2026-10-03T13:02:34Z, ~22h off at close-out), held off Phase 4 feature work (dev)
- 2026-10-02 — Dev run 55: added `content/repos/postgresql.md` (`postgres/postgres`,
  "PostgreSQL License") to the Databases grove, growing it from 3 to 4 repos —
  picking up run 54's own next-action pointer to continue the product spec's named
  Database Grove example list (PostgreSQL, DuckDB, SQLite, ClickHouse, SurrealDB,
  PocketBase). Cross-referenced PostgreSQL and SQLite as mutual open-source
  alternatives (client-server vs. embedded/serverless) and added
  `content/comparisons/postgresql-vs-sqlite.md` in the same PR to close that pair
  immediately rather than leave a dangling-reference gap. Facts verified via
  WebSearch against Wikipedia, postgresql.org, pgpedia, and the GitHub repo's own
  "mirror of the official PostgreSQL GIT repository" description. 365/365 tests
  pass (9 new/updated), lint/`tsc --noEmit` clean, 0 `npm audit` findings, all run
  locally; `npm run build` reproduced the known ADR-006 sandbox font-fetch gap, left
  to CI. Independent review (subagent) found no BLOCKER/MAJOR issues (one MINOR
  style note on the non-SPDX license string, accepted per Vim's existing precedent).
  PR #107 (3/3 gating checks green, including the non-gating Playwright/axe-core
  run); post-merge CI on `main` also confirmed green. RG-7/8/9 re-checked — still no
  owner reply (RG-7 defaults 2026-10-03, due tomorrow), held off Phase 4 feature
  work again (dev)
- 2026-10-02 — Dev run 54: added `content/repos/sqlite.md` (`sqlite/sqlite`, Public
  Domain) to the Databases grove, growing it from 2 to 3 repos — picking up run 53's
  own next-action pointer to continue the product spec's named Database Grove example
  list (PostgreSQL, DuckDB, SQLite, ClickHouse, SurrealDB, PocketBase). Cross-referenced
  DuckDB and SQLite as mutual open-source alternatives (both embedded/serverless, but
  OLTP-row vs. OLAP-columnar workloads) and added `content/comparisons/duckdb-vs-sqlite.md`
  in the same PR to close that pair immediately rather than leave a dangling-reference
  gap. Facts verified via WebFetch against Wikipedia and an independent third-party
  DuckDB-vs-SQLite comparison. 362/362 tests pass (3 new/updated), lint/`tsc --noEmit`
  clean, 0 `npm audit` findings, all run locally; `npm run build` reproduced the known
  ADR-006 sandbox font-fetch gap, left to CI. Independent review (subagent) found no
  BLOCKER/MAJOR/MINOR issues. PR #106 (4/4 gating checks green, plus the non-gating
  Playwright/axe-core run); post-merge CI on `main` also confirmed green. RG-7/8/9
  re-checked — still no owner reply, held off Phase 4 feature work again (dev)
- 2026-10-02 — Dev run 53: added `content/groves/databases.md` with two initial repos,
  DuckDB (`content/repos/duckdb.md`, MIT) and ClickHouse (`content/repos/clickhouse.md`,
  Apache-2.0), plus `content/comparisons/clickhouse-vs-duckdb.md` (PR #105). With every
  known dangling `alternatives.open_source`/`alternatives.commercial` reference in
  `content/` closed as of run 52, a fresh cross-reference audit this run (grove
  membership, `related_groves`, alternative references, mutual-pair comparison
  coverage) found zero remaining gaps of that kind — the existing 3-grove/17-repo set
  is fully internally consistent. With no dangling reference left to close, this run
  expanded breadth instead: the product spec (PRODUCT.md §2) names a "Database Grove"
  (PostgreSQL, DuckDB, SQLite, ClickHouse, SurrealDB, PocketBase) that never got built,
  unlike AI/Self-Hosted/Developer-Tools. DuckDB and ClickHouse cross-reference each
  other under `alternatives.open_source` (embedded/in-process vs. distributed/
  client-server OLAP databases — a comparison already widely drawn across independent
  industry sources, not an invented pairing); the new comparison page closes that
  mutual pair in the same PR rather than leaving it as a gap for a future run. Facts
  (DuckDB: created by Mark Raasveldt and Hannes Mühleisen at CWI; ClickHouse: built at
  Yandex, open-sourced 2016, now developed by ClickHouse, Inc.) verified via
  WebSearch/WebFetch against Wikipedia plus an independent industry comparison source
  (airbyte.com), cross-checked against several other independent "ClickHouse vs
  DuckDB" writeups — not scraped from either project's own one-line description, per
  CLAUDE.md rule 4. Small related change: added `databases` to `content/groves/ai.md`'s
  and `content/groves/self-hosted.md`'s `related_groves` (frontmatter + body prose),
  reciprocal with `databases.md`'s own `related_groves: [self-hosted, ai]`; Developer
  Tools deliberately left out of the relation in both directions. Updated/added tests
  across all five affected test files (slug-list fixtures, parse-correctness
  assertions, `getReposInGrove("databases")` coverage, real-page render tests for all
  four new pages, recomputed homepage numbers). 359/359 tests pass (16 new/updated),
  lint clean, `tsc --noEmit` clean, `npm audit --audit-level=high` 0 vulnerabilities,
  all run locally; `npm run build` reproduced the known ADR-006 sandbox font-fetch gap
  (the full local test suite already exercises `content.ts`'s real build-time
  validation against every file in this PR, confirming it parses and cross-validates
  cleanly before that unrelated failure), left to CI's GitHub-hosted runner. Independent
  review (subagent, skeptical-senior-engineer pass) found no CRITICAL/MAJOR issues; one
  MINOR (ClickHouse's named production adopters have no inline citation, but match
  ClickHouse's own publicly documented adopters list — not fabricated) left as-is.
- 2026-10-02 — Dev run 52: added `content/alternatives/lm-studio.md` (PR #104).
  `ollama.md` has listed LM Studio under `alternatives.commercial` since bootstrap with
  no corresponding alternative page — the last remaining dangling commercial reference
  in `content/` (run 51's fresh audit found exactly two: AWS Amplify, shipped that run,
  and LM Studio, shipped this run). The new page lists Ollama/LocalAI/vLLM as
  Open-source alternatives (all three already have real repo pages, rendering as real
  links with live star counts); no Free/Commercial section, since no other content
  file cross-references a commercial alternative to LM Studio — the first alternatives
  page to exercise both of `AlternativePage`'s omit-when-empty branches. Facts
  researched and cross-checked against two independent secondary sources (a
  knolli.ai open-source-alternatives roundup, a dev.to Ollama-vs-LM-Studio comparison)
  rather than lmstudio.ai directly — this sandbox's network proxy declined a direct
  fetch to lmstudio.ai this run (an unattended provenance-approval prompt with no one
  to answer it): LM Studio is free to use (including commercially) but closed source
  with no public code access, bundling a point-and-click GUI, a Hugging-Face-backed
  model hub, and a local OpenAI-compatible API server. This run's new page gives
  `/repo/ollama`'s long-standing LM Studio commercial chip somewhere real to link to
  for the first time, via `AlternativesTable.tsx`'s commercial-chip resolution (wired
  up in PR #102). Independent review (subagent, skeptical-senior-engineer pass) found
  one real MINOR — a second stale doc comment (`src/app/repo/[slug]/page.tsx`) still
  citing LM Studio as unresolved, fixed before merge alongside the first (caught in
  this PR's own first pass, in `AlternativesTable.tsx`) — and otherwise verified every
  Open-source name resolves to a real repo page, `slugifyAlternativeName("LM Studio")`
  matches the new filename exactly, every Best-fit bullet is a single unwrapped line
  (no silent-truncation risk), and the Best-fit facts don't overreach past what the two
  secondary sources support. Added a real-content integration test
  (`tests/app/repo-page.test.tsx`) exercising `/repo/ollama`'s LM Studio commercial
  chip resolving to `/alternative/lm-studio`, not just the isolated component/
  alternative-page unit tests. 352/352 tests pass (6 new/updated), lint/tsc clean, 0
  vulnerabilities, all run locally; build reproduced the known ADR-006 sandbox
  font-fetch gap, confirmed green on CI's real GitHub-hosted runner (all 4 gating
  checks, pre- and post-merge). With this merged, every known dangling
  `alternatives.open_source`/`alternatives.commercial` reference in `content/` is now
  closed — a future decision-free run will need a new source of content work (a fresh
  audit, a new Grove, or a content-accuracy pass).
- 2026-10-02 — Dev run 51: added `content/alternatives/aws-amplify.md` (PR #103).
  `appwrite.md` and `supabase.md` have both listed AWS Amplify under
  `alternatives.commercial` since bootstrap with no corresponding alternative page —
  a fresh content audit this run found zero remaining dangling `alternatives.open_source`
  references anywhere in `content/`, and exactly two remaining dangling commercial
  references: AWS Amplify (2 referencing repos) and LM Studio (1 referencing repo,
  `ollama.md`). AWS Amplify is the higher-value gap, so it shipped this run; LM Studio
  is the next one. The new page lists Appwrite/Supabase/PocketBase as Open-source
  alternatives (all three already have real repo pages, rendering as real links with
  live star counts) and cross-references Firebase under Commercial. Facts researched
  and cross-checked against secondary sources (appwrite.io's own BaaS-platform
  comparison post, a dedicated AWS-Amplify-pricing comparison article) rather than
  AWS's own docs directly — this sandbox's network proxy declined a direct fetch to
  `aws.amazon.com` this run (an unattended provenance-approval prompt with no one to
  answer it): AWS Amplify is a managed front door onto Cognito/AppSync/Lambda/S3, not
  a portable backend; its 12-month free tier (1,000 build minutes, 15 GB data served,
  5 GB storage, 500,000 requests) has no pause once exceeded, transitioning straight
  to usage-based pay-as-you-go billing. This run's new page gives `/repo/appwrite`'s
  and `/repo/supabase`'s long-standing AWS Amplify commercial chips somewhere real to
  link to for the first time, via `AlternativesTable.tsx`'s commercial-chip resolution
  (wired up in PR #102). Independent review (subagent, skeptical-senior-engineer pass)
  found no BLOCKER/MAJOR/MINOR issues — verified every Open-source name resolves to a
  real repo page, the "looks like a slug" commercial-name validation doesn't apply to
  this content type, and `slugifyAlternativeName("AWS Amplify")` matches the new
  filename exactly. Added a real-content integration test
  (`tests/app/repo-page.test.tsx`) exercising `/repo/appwrite`'s Firebase and AWS
  Amplify commercial chips resolving together, not just the isolated component/
  alternative-page unit tests. 349/349 tests pass (4 new/updated), lint/tsc clean, 0
  vulnerabilities, all run locally; build reproduced the known ADR-006 sandbox
  font-fetch gap, confirmed green on CI's real GitHub-hosted runner (all 3 gating
  checks, pre- and post-merge).
- 2026-10-02 — Dev run 50: added `content/alternatives/vercel.md`, `heroku.md`, and
  `netlify.md` (PR #102). `coolify.md` and `dokploy.md` have both listed Vercel,
  Heroku, and Netlify under `alternatives.commercial` since bootstrap with no
  corresponding alternative pages — the next highest-value gap after Firebase (run
  48) and GitKraken/Sourcetree (run 49), tied at 2 referencing repos each. Each new
  page lists Coolify and Dokploy as Open-source alternatives (both already have real
  repo pages) and cross-references the other two commercial platforms. Facts
  verified against each vendor's own documentation, not scraped: Vercel's Hobby plan
  is contractually non-commercial-use-only and pauses once free-tier usage is
  exceeded (vercel.com/legal/terms, vercel.com/docs/plans); Heroku removed its free
  dyno/Postgres/Key-Value Store plans in November 2022, with usage-based Eco dynos
  and $5/$3-per-month Mini data plans as the current minimums (help.heroku.com's own
  FAQ); Netlify's free plan explicitly permits commercial projects but suspends a
  site for the rest of the month once its usage allowance is exceeded (netlify.com's
  own "Introducing Netlify's Free plan" post). Small related task: fixed
  TECH-DEBT.md's 2026-10-01 row — `AlternativesTable.tsx`'s commercial chips never
  linked forward to a matching `/alternative/:slug` page even once one existed (e.g.
  Firebase on `/repo/appwrite` since run 48). Changed its `commercial` prop from
  `string[]` to `ResolvedCommercialAlternative[]`, resolved in
  `src/app/repo/[slug]/page.tsx` the same way open-source names already resolve.
  Independent review (subagent, skeptical-senior-engineer pass) found no
  BLOCKER/MAJOR content or code issues, but caught a real coverage gap — nothing
  exercised the actual `/repo/coolify`/`/repo/dokploy` rendered output with the new
  resolution wired in — fixed with a real-content integration test
  (`tests/app/repo-page.test.tsx`) before merge. 346/346 tests pass (8 new/updated),
  lint/tsc clean, 0 vulnerabilities, all run locally; build reproduced the known
  ADR-006 sandbox font-fetch gap, confirmed green on CI's real GitHub-hosted runner
  (all 3 checks, pre- and post-merge).
- 2026-10-02 — Dev run 49: added `content/alternatives/gitkraken.md` and
  `content/alternatives/sourcetree.md` (PR #101). Three existing repo pages
  (`gitui.md`, `lazygit.md`, `tig.md`) already listed both GitKraken and Sourcetree
  under `alternatives.commercial` with no corresponding alternative pages — both tied
  for the highest-value gap left (3 referencing repos each, vs. 2 each for
  Vercel/Heroku/Netlify), the same class of gap run 48 closed for Firebase. Both pages
  list GitUI/LazyGit/Tig as Open-source alternatives (all three slugify-resolve to real
  repo pages, rendering as real links with live star counts) and cross-reference each
  other (Sourcetree listed under GitKraken's Free bucket, since Sourcetree is the
  fully-free one; GitKraken listed under Sourcetree's Commercial bucket, since
  GitKraken's free tier is public-repos-only). Facts (GitKraken's free Community tier
  is public-repos-only — private repos need Pro+, ships Mac/Windows/Linux via
  Electron; Sourcetree is free including private
  repos with no seat limit, supports Git and Mercurial, Mac/Windows only) verified via
  WebSearch/WebFetch against two independent comparison sources, plus Atlassian's own
  Sourcetree support KB specifically for the Mercurial claim after independent review
  flagged it as plausibly outdated (Bitbucket's 2020 Mercurial sunset) — Atlassian's
  own docs confirm Sourcetree itself still supports Mercurial today. Independent review
  (subagent, skeptical-senior-engineer pass) caught a real BLOCKER: both files'
  first-draft "Best fit" bullets wrapped across multiple source lines, which
  `extractListItems` silently truncates (only lines starting with "- " are captured) —
  three of six bullets would have shipped as mid-sentence fragments. Fixed by putting
  every bullet on one line; added full-array/full-sentence test assertions (not just
  `toContain`) in `tests/lib/content.test.ts` and `tests/app/alternative-page.test.tsx`
  so a future wrapped bullet fails the suite instead of truncating silently on the
  page. Updated the two hardcoded alternatives-slug fixtures this addition affects and
  added real-content render tests for `/alternative/gitkraken` and
  `/alternative/sourcetree`. 338/338 tests pass, lint/tsc clean, 0 vulnerabilities, all
  run locally; build reproduced the known ADR-006 sandbox font-fetch gap, confirmed
  green on CI's real GitHub-hosted runner (all 3 checks, pre- and post-merge).
- 2026-10-01 — Dev run 48: added `content/alternatives/firebase.md`, the second
  `/alternative/:slug` page after `notion.md`. Three existing repo pages
  (`appwrite.md`, `supabase.md`, `pocketbase.md`) already listed Firebase under
  `alternatives.commercial` with no corresponding alternative page — the highest-value
  gap of this kind (the only commercial-product name referenced by more than one
  existing repo), same prioritization precedent run 37 used for LocalAI's open-source
  dangling reference. All three Open-source entries (Appwrite, Supabase, PocketBase)
  slugify-resolve to real repo pages and render as real links with live star counts
  (`AlternativePage`'s resolved branch, previously only exercised by a synthetic mock);
  AWS Amplify listed as the Commercial alternative, already named alongside Firebase in
  two of the three repos' own `alternatives.commercial`. Every Best-fit bullet grounded
  in a specific fact from the three repos' own content files — independent review
  (subagent, skeptical-senior-engineer pass) caught two early bullets over-generalizing
  a claim across all three repos when it only held for some (e.g. a "real SQL" claim
  that doesn't fit Appwrite's own documented "document-style database, not raw SQL"
  Con) — tightened to scope each claim correctly before merge. Updated the two
  hardcoded alternatives-slug test fixtures this affects
  (`tests/lib/content.test.ts`, `tests/app/alternative-page.test.tsx`) and added a new
  real-content render test for `/alternative/firebase`. Also closed out one stale
  `TECH-DEBT.md` row (the `/trending`/`/rising` row-duplication the design lane's
  `RankedList` extraction, run 35, already fixed) and filed a new one
  (`AlternativesTable.tsx`'s commercial chips don't link to a matching
  `/alternative/:slug` page even when one exists — out of scope for this content-only
  change). 334/334 tests pass, lint/`tsc --noEmit` clean, `npm audit --audit-level=high`
  0 vulnerabilities, all run locally; `npm run build` left to CI (known ADR-006
  sandbox font-fetch gap) — all 3 checks (CI, Factory guardrails, Design screenshots &
  accessibility) green on PR #100 before squash-merging; post-merge CI on `main` also
  confirmed green. Re-checked RG-7/8/9 (Gmail thread `1a0f26990ebc1e9c`) — still
  exactly the one original message, no owner reply; `default_due_at` (2026-10-03)
  hasn't passed.
- 2026-10-01 — Dev run 47: added `content/comparisons/langchain-vs-llamaindex.md` —
  langchain.md and llamaindex.md have listed each other under
  `alternatives.open_source` since llamaindex.md was added (run 39, PR #88), but no
  comparison page existed for the pair. This was the last fully-mutual comparison gap
  in `content/` (the editor cluster, run 46, closed the previous one). Prose grounded
  entirely in facts already stated in both repos' own `content/repos/*.md` files
  (general-purpose orchestration vs. retrieval-first data framework), no new external
  research needed. Independent review (subagent, skeptical-senior-engineer pass) found
  no fabricated/unverified claims and confirmed format/ordering conventions. Every repo
  in `content/repos/` now has at least one comparison; `tests/lib/content.test.ts`'s and
  `tests/app/repo-page.test.tsx`'s "no comparisons" fixtures (previously `langchain`)
  were swapped for a synthetic slug and a new isolated mocked test
  (`tests/app/repo-page-no-comparisons.test.tsx`) respectively, since no real repo is
  left without one. 332/332 tests pass, lint/`tsc --noEmit` clean; `npm run build` left
  to CI (known ADR-006 sandbox font-fetch gap) — all 3 gating checks green on PR #98
  before squash-merging; post-merge CI on `main` also confirmed green. Re-checked
  RG-7/8/9 (Gmail thread `1a0f26990ebc1e9c`) — still exactly the one original message,
  no owner reply; `default_due_at` (2026-10-03) hasn't passed.
- 2026-10-01 — SEC-005: confirmed (not just recommended) that `main` has no
  branch-protection rule — `GET .../branches/main/protection` finally returned a
  decisive GitHub `404 "Branch not protected"` instead of the ambiguous `403` every
  prior run (4, 6, 7, 8, 9) got from the same endpoint, so this is now a verified gap
  rather than an unconfirmed recommendation: no required status checks, no required
  review, nothing stopping a force-push to `main` beyond each lane's own discipline.
  `docs/security/findings/SEC-005-branch-protection-not-enabled.md` added;
  `docs/security/README.md` (A05 row, Findings table, review log) and
  `docs/security/PRODUCTION-HARDENING.md` updated; commented on the existing
  `needs-human` issue #33 (already covered this recommendation alongside SEC-003 —
  no new issue opened) with the confirmed status. Also reviewed the ~2,860 lines of
  real Phase 3+ app surface that landed since the last security run (run 9,
  2026-09-29): `/search`, `/compare/:a/:b`, `/alternative/:slug`, the newsletter
  signup form, and the new `repository_releases` ingestion path — no findings (search
  is pure client-side substring matching with no server round-trip; the newsletter
  form has no working submit path at all; releases use parameterised SQL throughout
  and constrain `html_url` to `https://github.com/...` before rendering it as a link).
  Re-verified SEC-001/002/003/004 unchanged. No code/workflow fix needed this run
  (SEC-005 isn't fixable by this lane — repo-admin action). (security)
- 2026-10-01 — Six new `/compare/:a/:b` pages completing the vim/neovim/helix/zed
  editor cluster's fully-mutual comparison coverage: `content/comparisons/
  helix-vs-neovim.md`, `helix-vs-vim.md`, `helix-vs-zed.md`, `neovim-vs-vim.md`,
  `neovim-vs-zed.md`, `vim-vs-zed.md`. All four repos have listed each other under
  `alternatives.open_source` since `zed.md` landed (run 42), but no comparison pages
  existed for any of the 6 pairs — the last sizeable comparisons gap flagged in
  PROJECT_STATE.md's Next action, same shape as run 36's Supabase/Appwrite/PocketBase
  trio, run 44's GitUI/LazyGit/Tig trio, and run 45's Ollama/LocalAI/vLLM trio. Each
  page's prose draws entirely on facts already stated in the four repos' own content
  files (license, built-in LSP or not, config language, GUI vs terminal,
  collaboration/AI features, plugin-ecosystem maturity). Independent review caught a
  real self-contradiction in two early drafts (vim-vs-zed.md and helix-vs-vim.md both
  called Vim "terminal-only" while also correctly noting it can run as a GUI via
  gVim) — fixed before merge. `tests/lib/content.test.ts`'s comparisons fixture-list
  test updated. 330/330 tests pass. PR #97 merged (3/3 gating checks green; post-merge
  CI on main green). (dev)
- 2026-10-01 — Three new `/compare/:a/:b` pages completing/closing content coverage gaps:
  `content/comparisons/localai-vs-ollama.md` and `localai-vs-vllm.md` complete the AI
  grove's fully-mutual Ollama/LocalAI/vLLM inference-engine trio (previously only
  `ollama-vs-vllm` existed, despite all three listing each other under
  `alternatives.open_source`); `content/comparisons/coolify-vs-dokploy.md` closes the
  Self-Hosted grove's one remaining uncompared pair (listed each other since `dokploy.md`
  landed, run 38). Each page's hand-written "How they differ" prose draws primarily on
  facts already stated in the five repos' own content files; `coolify-vs-dokploy.md`
  also adds one independently verified fact beyond that — per Coolify's own docs
  (`coolify.io/docs`, fetched this run), its multi-server deployment is standalone
  Docker per server plus an external load balancer, with Docker Swarm support already
  deprecated and slated for removal in Coolify v5, unlike Dokploy's built-in Swarm
  orchestration. Independent review caught a real MINOR (the AI-trio file initially
  broke the established alphabetical-by-slug comparison-file naming convention — fixed:
  `ollama-vs-localai.md` → `localai-vs-ollama.md`) and a NIT (an internal-sounding
  citation phrase reworded for end readers) before merge. 6 new/updated tests; 329/329
  tests pass. PR #95 merged (4/4 gating checks green; post-merge CI on main green). (dev)
- 2026-10-01 — Three new `/compare/:a/:b` pages closing out the Developer Tools grove's
  git-TUI trio (GitUI/LazyGit/Tig, added runs 33/43): `content/comparisons/
  gitui-vs-lazygit.md`, `gitui-vs-tig.md`, `lazygit-vs-tig.md`. All three repos have
  listed each other under `alternatives.open_source` since Tig/GitUI landed (run 43),
  but had zero `/compare/:a/:b` pages among them — the same fully-mutual-trio content
  gap run 36's Supabase/Appwrite/PocketBase comparisons closed for the Self-Hosted
  grove, just for this grove's three-way git-TUI cluster. Each page's hand-written "How
  they differ" prose draws only on facts already verified in the three repos' own
  content files (LazyGit's Go implementation independently re-confirmed via its
  pkg.go.dev module listing) — no new unverified claims. 2 new tests (a
  `getComparisonsForRepo` trio-coverage test, a `/compare/lazygit/tig` render test);
  326/326 tests pass. Small related task: fixed TECH-DEBT.md's 2026-10-01 row —
  `.factory/state.yaml`'s `next_actions` list had grown to 22 entries/~600 lines and
  cost this run's own lock-acquisition read a tool-output truncation; archived the 14
  oldest entries (runs 22-35) to new `docs/factory/run-history.md`, kept the most
  recent ~8 in `state.yaml` with a pointer note. (dev)
- 2026-10-01 — Tig (`content/repos/tig.md`, GPL-2.0) and GitUI (`content/repos/gitui.md`,
  MIT) added to the Developer Tools grove — routine editorial content work done while
  Phase 4 feature work stays held pending RG-7 (no owner reply yet, defaults
  2026-10-03). Closes the last dangling reference of this kind: `lazygit.md` has named
  both `tig` and `gitui` under `alternatives.open_source` since bootstrap, but neither
  profile ever existed, so both rendered as "Not yet profiled" — no dangling
  `alternatives.open_source` reference remains anywhere in `content/repos/*.md` after
  this PR. Cross-referenced Tig, GitUI, and LazyGit under each other's own
  `alternatives.open_source` (fully reciprocal); `content/groves/developer-tools.md`'s
  "Core projects" list extended (grove now has 7 members). Facts (Tig: ncurses-based C
  repository browser predating both LazyGit and GitUI, maintained by Jonas Fonseca,
  doubles as a `git log`/`diff` pager; GitUI: Rust terminal UI created by Stephan
  Dilly, staging-first workflow built on `git2`, fast/memory-light on very large
  repositories, moved from `extrawurst/gitui` to the `gitui-org` GitHub organization)
  verified via WebSearch/WebFetch against multiple independent sources — an
  independent review subagent flagged an unverified specific date in the first draft's
  GitUI org-move claim (sourced only from a single AI-generated wiki); the org name
  itself was re-verified against a second independent source and kept, the
  unverifiable date dropped. 324/324 tests pass; PR #93 merged (3/3 checks green,
  including the non-gating screenshot job). (dev)
- 2026-10-01 — Zed (`content/repos/zed.md`, GPL-3.0 / AGPL-3.0) added to the Developer
  Tools grove — routine editorial content work done while Phase 4 feature work stays
  held pending RG-7 (no owner reply yet, defaults 2026-10-03). Closes the last
  dangling reference in this chain: `vim.md`, `neovim.md`, and `helix.md` have all
  named `zed` under `alternatives.open_source` since runs 33/40/41, but no profile
  for it ever existed, so it rendered as "Not yet profiled" on all three pages.
  Cross-referenced Vim, Neovim, and Helix back under Zed's own
  `alternatives.open_source`; `content/groves/developer-tools.md`'s "Core projects"
  list extended. Facts (GPU-accelerated Rust editor built on its own GPUI rendering
  framework rather than Electron/webview; split licensing — GPL-3.0 editor core,
  AGPL-3.0 server/collaboration code, Apache-2.0 for GPUI itself; founded by Nathan
  Sobo/Antonio Scandurra/Max Brunsfeld, formerly of Atom/Tree-sitter at GitHub;
  built-in real-time multiplayer editing, Tree-sitter, LSP, terminal, optional Vim
  keybindings, and an AI assistant with some paid-plan-gated features) verified via
  WebSearch/WebFetch against Zed's own blog, Wikipedia, and an independent features
  summary — an independent review subagent found no BLOCKER/MAJOR issues. 322/322
  tests pass; PR #92 merged (6/6 checks green, including the non-gating screenshot
  job). `tig`/`gitui` (`lazygit.md`'s own dangling refs) remain the only open gap of
  this kind. (dev)
- 2026-10-01 — Helix (`content/repos/helix.md`, MPL-2.0) added to the Developer Tools
  grove — routine editorial content work done while Phase 4 feature work stays held
  pending RG-7 (no owner reply yet, defaults 2026-10-03). Closes a dangling reference:
  both `vim.md` and `neovim.md` have named `helix` under `alternatives.open_source`
  since runs 33/40, but no profile for it ever existed, so it rendered as "Not yet
  profiled" on both pages. Cross-referenced Vim and Neovim back under Helix's own
  `alternatives.open_source` (alongside still-unresolved `zed`, left as backlog);
  `content/groves/developer-tools.md`'s "Core projects" list extended. Facts (Rust
  implementation, Kakoune-inspired selection-first modal editing with multiple
  selections as a core primitive, built-in Tree-sitter/LSP with no plugins required,
  MPL-2.0 license, no official stable plugin system — the experimental Steel/Scheme
  scripting layer requires building from a fork) verified via WebFetch/WebSearch
  against helix-editor.com, Gentoo's package database, and an independent walkthrough
  of Steel's current status — an independent review subagent found no BLOCKER/MAJOR
  issues. 319/319 tests pass; PR #90 merged (3/3 checks green, including the
  non-gating screenshot job). (dev)
- 2026-10-01 — Vim (`content/repos/vim.md`, Vim License) added to the Developer Tools
  grove — routine editorial content work done while Phase 4 feature work stays held
  pending RG-7 (no owner reply yet, defaults 2026-10-03). Closes a dangling reference:
  `neovim.md` has named `vim` under `alternatives.open_source` since bootstrap (run
  33), but no profile for it ever existed, so it rendered as "Not yet profiled" on
  Neovim's page. Cross-referenced Neovim back under Vim's own `alternatives.open_source`
  (alongside still-unresolved `helix`/`zed`, left as backlog); `content/groves/
  developer-tools.md`'s "Core projects" list extended. Facts (Vim License name/GPL-
  compatibility, no native LSP client — third-party plugins like `yegappan/lsp` fill
  the gap, unlike Neovim's built-in client — and the February 2026 Vim 9.2 release)
  verified via WebFetch/WebSearch against Wikipedia, a license explainer, and
  independent release-coverage sources — an independent review subagent specifically
  fact-checked the dated 9.2-release claim as the highest fabrication-risk detail and
  confirmed it independently; no other issues found. 318/318 tests pass; PR #89
  merged (6/6 checks green, including the non-gating screenshot job). (dev)
- 2026-10-01 — LlamaIndex (`content/repos/llamaindex.md`, MIT) added to the AI grove —
  routine editorial content work done while Phase 4 feature work stays held pending
  RG-7 (no owner reply yet, defaults 2026-10-03). Closes a dangling reference:
  `langchain.md` has named `llamaindex` under `alternatives.open_source` since
  bootstrap, but no profile for it ever existed, so it rendered as "Not yet profiled"
  on LangChain's page. Cross-referenced LangChain back under LlamaIndex's own
  `alternatives.open_source`; `content/groves/ai.md`'s "Core projects" list extended.
  Facts (MIT license, Python-first flagship package, RAG/data-framework positioning,
  separate paid LlamaParse/LlamaCloud hosted offerings) verified against the project's
  own GitHub repo page and independent comparison sources (IBM, dev.co) — an
  independent review subagent flagged the first draft's "300+ integration packages"
  figure as an unnecessarily specific metric despite two corroborating sources, and a
  stale Phase-3-placeholder prose line in `langchain.md`'s hand-authored "##
  Alternatives" section; both fixed before merge. 316/316 tests pass; PR #88 merged
  (6/6 checks green, including the non-gating screenshot job). (dev)
- 2026-10-01 — Dokploy (`content/repos/dokploy.md`, Apache-2.0) added to the Self-Hosted
  grove — routine editorial content work done while Phase 4 feature work stays held
  pending RG-7 (no owner reply yet, defaults 2026-10-03). Closes a dangling reference:
  `coolify.md` has named `dokploy` under `alternatives.open_source` since it was added
  (dev run 33), but no profile for it ever existed, so it rendered as "Not yet
  profiled" on Coolify's page. `content/groves/self-hosted.md`'s "Core projects" list
  extended. Facts verified against primary sources (dokploy.com, docs.dokploy.com's
  enterprise/license-keys page) — an independent review subagent flagged the first
  draft's licensing claim (an unverifiable specific license name + date, from a
  secondary blog only) and its multi-server/Swarm claims as carrying the same
  fabrication risk run 37's reviewer caught in LocalAI's content; rewrote the Cons
  section to state only what docs.dokploy.com and a third-party maturity review
  actually corroborate. 314/314 tests pass; PR #87 merged (6/6 checks green,
  including the non-gating screenshot job). (dev)
- 2026-10-01 — LocalAI (`content/repos/localai.md`, MIT) added to the AI grove —
  routine editorial content work done while Phase 4 feature work stays held pending
  RG-7 (no owner reply yet, defaults 2026-10-03). Closes a dangling reference: both
  `ollama.md` and `vllm.md` have named `localai` under `alternatives.open_source`
  since bootstrap (the only slug referenced by two existing repos at once), but no
  profile for it ever existed, so it rendered as "Not yet profiled" on both pages.
  `content/groves/ai.md`'s "Core projects" list extended; `ollama.md`/`vllm.md`'s
  stale, never-rendered "## Alternatives" placeholder prose updated for consistency.
  Facts (OpenAI/Anthropic/ElevenLabs-compatible API, built-in Agents feature,
  Distributed Mode's PostgreSQL+NATS requirement) verified directly against
  localai.io's own docs — an independent review subagent initially flagged two of
  these as likely fabricated from its own training-data memory; re-verified both
  against live localai.io pages and confirmed accurate before keeping them. 312/312
  tests pass; PR #86 merged (3/3 CI checks green). (dev)

### Fixed
- 2026-09-30 — `alternatives.commercial` chips (`AlternativesTable.tsx`) render their
  entries verbatim, with no capitalization — but every `content/repos/*.md` file with a
  non-empty `commercial` list had a raw lowercase slug there instead of a real product
  name (e.g. `firebase` instead of `Firebase`), so the site had been quietly showing
  raw slugs as commercial-alternative names since bootstrap. Fixed `appwrite.md`,
  `coolify.md`, `lazygit.md`, `pocketbase.md`, `supabase.md`. Separately, `ollama.md`'s
  `alternatives.open_source` listed `lm-studio` — but LM Studio is closed-source
  freeware, not open source (traced to `ARCHITECTURE.md`'s own illustrative example,
  fixed too) — moved to `alternatives.commercial` as `"LM Studio"`. New validator in
  `assertValidAlternatives` (`src/lib/content.ts`) fails the build if a future
  `commercial` entry looks like a slug (all-lowercase, no space), so this can't recur
  silently. 307/307 tests pass; PR #84 merged (3/3 CI checks green). (dev)
- 2026-09-30 — `MomentumChip`'s underlying signals (star growth, open issues,
  contributor growth) are now reachable by keyboard, touch, and screen reader, not
  mouse-hover only. Converted the chip to a real WAI-ARIA "disclosure (show/hide)"
  button (`aria-expanded`/`aria-controls`, toggling a signal panel via the native
  `hidden` attribute), closing a TECH-DEBT.md item the design lane had flagged against
  its own component. `/compare/[a]/[b]`'s table cells gained `align-top` so the two
  side-by-side `MomentumChip` instances there can expand independently without
  misaligning the row (caught by independent review pre-merge). See
  `docs/design/findings/UX-2026-005-momentum-chip-tooltip-accessibility.md`. PR #82.
  (design)
- 2026-10-02 — `ComparisonMatrix`'s "How it compares" table (`/repo/[slug]`, shipped by
  PR #115 this same day) silently overflowed the project's 390px mobile viewport with no
  visual scroll affordance — the non-gating "Design screenshots & accessibility" check
  failed on `main` (UX-2026-006's own generic overflow guard caught it, 2px over on
  `/repo/ollama`'s short content). A first, padding-only fix (`px-2 sm:px-3`,
  `pr-2 sm:pr-4`) passed every local check but an independent review found it never
  addressed the real mechanism — a real Chromium reproduction against the actual
  worst-case content (`/repo/zed`'s own `license: GPL-3.0 / AGPL-3.0`, the longest in
  `content/`) showed 68px of real overflow before any fix and still 28px after the
  padding-only one. Re-fixed for real with `table-layout: fixed` + `break-words` below
  `sm` (forces every column to a fixed, wrapping width regardless of content length,
  instead of letting the table's auto layout refuse to shrink below each cell's
  unwrapped width) — confirmed 0px overflow on both `/repo/ollama` and `/repo/zed` at
  390/768/1440px, with tablet/desktop byte-identical to before. Added `/repo/zed` to
  `tests/design/screenshots.spec.ts`'s `ROUTES` so CI's own real, correctly-fonted build
  now exercises this component's worst case on every future run, not just the easy one.
  384/384 tests pass (1 rewritten to cover every cell, not just thead, written first and
  confirmed red against both the pre-fix and the insufficient first-fix component),
  lint/`tsc --noEmit` clean, 0 `npm audit` findings, all run locally; `npm run build`
  reproduced the known ADR-006 sandbox font-fetch gap, left to CI. See
  `docs/design/findings/UX-2026-007-comparison-matrix-mobile-overflow.md`, issue #116.
  (dev)

### Added
- 2026-09-30 — Comparison pages for the Self-Hosted grove's backend trio:
  `content/comparisons/appwrite-vs-supabase.md`, `pocketbase-vs-supabase.md`,
  `appwrite-vs-pocketbase.md` — routine editorial content work done while Phase 4
  feature work stays held pending RG-7 (no owner reply yet, defaults 2026-10-03).
  Supabase/Appwrite/PocketBase already listed each other under
  `alternatives.open_source` in their own content files, but had no `/compare/:a/:b`
  page among them — only `ollama-vs-vllm` existed. Independent review caught one real
  MAJOR before push: a first-draft render test asserted Appwrite's Stars/Momentum
  showing "—"/"Not enough data yet" against the real, unmocked `data/repogrove.db` —
  true only because Appwrite has no ingested snapshot history yet (added to content
  after the last ingestion run), and would have broken the moment the next scheduled
  run populates real rows for it. Fixed by moving that assertion into a new isolated,
  mocked test file (`tests/app/compare-page-no-history.test.tsx`), same pattern as
  `rising-page-empty.test.tsx`. 310/310 tests pass; PR #85 merged (3/3 CI checks
  green). (dev)
- 2026-09-30 — PocketBase and Appwrite (`content/repos/pocketbase.md`, `appwrite.md`)
  added to the Self-Hosted grove — routine editorial content work done while Phase 4
  feature work stays held pending RG-7 (no owner reply yet, defaults 2026-10-03).
  Closes a latent gap: `content/repos/supabase.md`'s `alternatives.open_source` has
  named both since bootstrap, but neither had its own content file, so both rendered
  as "Not yet profiled" on Supabase's Alternatives table. `content/groves/self-hosted.md`'s
  "Core projects" list extended to include both. PR #83. (dev)
- 2026-09-30 — Developer Tools grove (`content/groves/developer-tools.md`), backed by
  two new real repos, LazyGit and Neovim (`content/repos/lazygit.md`, `neovim.md`) —
  routine editorial content work done while Phase 4 feature work stays held pending
  RG-7 (no owner reply yet, defaults 2026-10-03). Closes a dangling reference: both
  `ai.md` and `self-hosted.md` had named `developer-tools` under `related_groves` since
  bootstrap, but the Grove file itself never existed. New `assertGrovesExist` validator
  in `src/lib/content.ts` (wired into `getAllRepos()`) now fails the build loudly if a
  repo's `groves:` field ever names a Grove with no corresponding content file — same
  convention as the existing `assertComparisonReposExist`/`assertNoGithubCollisions`.
  PR #81. (dev)
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
- 2026-09-30 — `/search` (#63, PR #70): static, build-time-generated search index
  matched entirely client-side — no server runtime, compatible with `output: "export"`
  (ADR-008, the short architecture note the issue asked for before landing). New
  `src/lib/search.ts` (`buildSearchIndex()`, server-only, reads `getAllRepos`/
  `getAllGroves`/`getAllAlternatives` — the same public `/content` every page already
  renders) and `src/lib/search-match.ts` (`searchEntries()`, pure tiered
  case-insensitive substring ranking: exact title > starts-with > contains > category
  > description). New `/search` route (Server Component builds the index once, passes
  it to a Client Component for the interactive input); header nav and sitemap both
  gained the new route. `src/lib/content.ts` gained an exported `firstParagraph`
  helper (moved out of `RepoCard.tsx`, its second real call site — pure refactor, no
  behavior change). Independent review before push found a real MAJOR (an alternative
  with no `bestFit` items got a fabricated description sentence, contradicting this
  codebase's "omit, don't fabricate" convention) — fixed pre-push by extracting
  `alternativeDescription()` as its own directly-tested pure function returning `""`
  instead. CI then caught a real Turbopack build failure this sandbox's own local
  build can't reach (blocked by the known ADR-006 font-fetch gap): `SearchBox.tsx` (a
  Client Component) importing `searchEntries` from the same module that also held
  `buildSearchIndex` pulled `content.ts`'s `node:fs` import into the client bundle
  graph, which Turbopack's static-export build can't chunk ("the chunking context
  (unknown) does not support external modules (request: node:fs)") — fixed by
  splitting the pure matching half into its own module with zero dependency on
  `content.ts`, re-pushed, confirmed green. 247/247 tests pass (21 new/updated), lint
  clean, `tsc --noEmit` clean, `npm audit --audit-level=high` 0 vulnerabilities, all
  run locally; all 3 CI checks green on PR #70's final commit before squash-merging;
  post-merge CI on `main` also green. Issue #63 auto-closed by the merge. (dev)
- 2026-09-30 — Newsletter signup form UI (#65, PR #71): "RepoGrove Weekly" section on
  the homepage, scoped to form UI only per the issue's own acceptance criteria — real
  client-side email validation (empty/malformed both get an inline error), clearly
  labeled "Coming soon", no working submission path (no `fetch`, no form
  `action`/`method`) since storing a subscriber email needs an owner decision (vendor +
  PII storage, `CLAUDE.md` rule 6) that hasn't been made. New
  `src/components/NewsletterSignupForm.tsx`. Independent review before push found no
  BLOCKER/MAJOR findings; one MINOR fixed pre-push (editing the email after a
  successful fake submission left a stale confirmation message on screen). 253/253
  tests pass (5 new + 1 updated), lint clean, `tsc --noEmit` clean, `npm audit
  --audit-level=high` 0 vulnerabilities, all run locally; all CI checks green on PR
  #71 before squash-merging; post-merge CI on `main` also green. Issue #65 auto-closed
  by the merge. While closing out, found `docs/WORKPLAN.md`'s Phase 3 gate (the
  17-item MVP list, spec §30/`PRODUCT.md`) includes a "basic news" item (spec §11)
  never filed as a roadmap issue across 28 prior runs — filed #72 (v1 scope: GitHub
  Releases only, no new vendor/licensing risk) so Phase 3 isn't mistakenly marked
  complete. (dev)
- 2026-09-30 — RG-4 (visual direction) defaulted: no owner reply since the ambiguous
  2026-09-27T17:32:04Z message; `default_due_at` passed, so "Editorial/content-forward"
  is now the recorded answer in `.factory/decisions.yaml` (bookkeeping only — every
  design-lane run has already been building against this default since run 1). Issue
  #8 (RG-2/3/4) closed, all three resolved. (design)
- 2026-09-30 — Extended the screenshot + axe-core harness (PR #73) from 3 routes to 8:
  added `/trending`, `/rising`, `/alternative/notion`, `/compare/ollama/vllm`, `/search`
  — every shipped Phase 2/3 page family the harness had never covered since design run
  9. Real CI run: 48/48 checks passed, 0 axe-core WCAG 2.1 A/AA violations across all 8
  routes × 6 viewport/color-scheme projects; all 48 real screenshots committed under
  `docs/design/screenshots/`. Reviewed a representative sample directly — no new UX
  findings, everything consistent with `DESIGN-SYSTEM.md`. (design)
- 2026-09-30 — Basic news widget (#72, PR #74) — Phase 3's last MVP-gate item.
  `/repo/[slug]` gained a "Latest" section listing a repo's recent GitHub releases
  (name/tag, publish date, link to GitHub), or an explicit "No recent releases" empty
  state. New `repository_releases` table in the already-committed `data/repogrove.db`
  (ADR-005 addendum), populated by a third, independently-failable per-repo API call
  in `scripts/ingestion/fetch-snapshots.ts`'s `runIngestion` (`GET
  /repos/{owner}/{repo}/releases?per_page=5`) — a releases-fetch failure never throws
  away that repo's star/fork/issue snapshot. New `src/lib/releases.ts` (read side).
  Independent review before push found one MAJOR (an earlier `parseReleases` coerced
  missing fields with `String(...)`, so a malformed entry became the literal text
  `"undefined"` rather than being skipped — that could reach `dateFormatter.format`
  and throw on an Invalid Date, breaking that repo's whole page render) and one MINOR
  (an ingested `html_url` rendered as a link `href` with no host check); both fixed
  pre-push. 287/287 tests pass (34 new/updated), lint clean, `tsc --noEmit` clean,
  `npm audit --audit-level=high` 0 vulnerabilities, all run locally; all CI checks
  green on PR #74 before squash-merging; post-merge CI on `main` also green. Issue
  #72 auto-closed by the merge. `docs/WORKPLAN.md`'s Phase 3 gate (the 17-item MVP
  list) is now fully complete. (dev)
- 2026-09-30 — Content-filename kebab-case validation + release draft-cutoff fix (PR
  #75). Added `assertSlugIsKebabCase(slug, source)` (`src/lib/content.ts`), called
  from `parseRepo`/`parseGrove`/`parseAlternative`/`parseComparison` — a content
  filename becomes its route slug and (since the sitemap shipped) a public URL, so a
  malformed one now fails the build loudly instead of silently reaching a sitemap
  entry. Also fixed `fetchRepoReleases`: GitHub truncates `per_page` server-side
  before drafts can be filtered, so a draft among a repo's most-recent releases could
  push a real one out of the "Latest" section's window — now over-fetches
  (`per_page=10`) and slices to 5 after filtering. Independent review caught that the
  first regression test for the release fix didn't actually exercise the bug (the
  mock ignored the requested `per_page`); fixed to truncate the fixture like the real
  API would, confirmed it fails against the pre-fix code and passes with the fix.
  8 new/updated tests (295/295 total), lint/`tsc --noEmit` clean, 0 audit
  vulnerabilities, all run locally. (dev)
- 2026-09-30 — Raised three Phase 4 owner decisions instead of guessing or filing
  issues that assume an answer: RG-7 (hold Phase 4 feature work until the site is
  actually deployed, since the owner hasn't yet provisioned the Azure Storage account
  RG-2 chose?), RG-8 (an auth provider for accounts — needed by watchlists/alerts and
  RepoGrove Pro — or defer both?), RG-9 (scope the public API now, or leave it
  unscoped until there's real demand?). All recommend holding/deferring given the
  site has no live traffic yet. Emailed the owner, mirrored as issues #76/#77/#78.
  (dev)
- 2026-09-30 — Fixed UX-2026-004: `/repo/[slug]`'s "Latest" (recent GitHub releases)
  section, added by the basic news widget (#72, PR #74), had landed directly after
  the star-growth chart and ahead of the repo's own one-sentence tagline — with no
  distinct lede styling, the tagline visually read as a trailing continuation of
  "Latest"'s "No recent releases." empty state rather than the page's lead sentence.
  Pure JSX reorder (no content/data/API changes): moved "Latest" to the very end of
  the page, after "Compared with," matching PRODUCT.md §10's documented page order
  (Overview → Alternatives → Comparison → Momentum → News). Documented the page's
  canonical section order in `DESIGN-SYSTEM.md` so a future addition is placed
  deliberately. 295/295 tests pass, lint/`tsc --noEmit` clean; PR #79 merged (6/6 CI
  green), post-merge screenshots confirm the fix in both themes/viewports. (design)
- 2026-09-30 — `tests/app/repo-page.test.tsx`'s empty-state test for the "Latest"
  releases section (#72) asserted "No recent releases." against the real committed
  `data/repogrove.db`, on the premise no ingestion run had fetched releases yet. This
  run manually triggered `ingestion.yml` to validate #72's schema/data path end to end
  for the first time since it merged — `repository_releases` had never actually been
  created in the committed db before — which populated real releases for all 5 tracked
  repos and broke that premise. Moved the empty-state assertion into its own isolated,
  mocked test file (mirroring the existing populated-state sibling); independent review
  added back a structural (non-content-specific) smoke test confirming the real,
  unmocked render path still works. 296/296 tests pass, lint/`tsc --noEmit` clean; PR
  #80 merged (4/4 CI checks green). (dev)
- 2026-10-01 — Fixed TECH-DEBT.md's 2026-09-30 row: `MomentumChip`'s disclosure button
  and `NewsletterSignupForm`'s submit button used `focus:ring-offset-2` with no
  `ring-offset-color`, falling back to Tailwind's default (white) — a visible light
  halo between the button and the blue focus ring in dark mode. Added
  `focus:ring-offset-bg-default` to both; `bg.default` is the correct token for both
  (verified against render ancestry, not assumed — neither button ever sits on a
  `bg-subtle`/`bg-elevated` surface today) and resolves per theme automatically since
  it's the same semantic token already redefined in `globals.css`'s dark-mode media
  query. Documented the convention in `DESIGN-SYSTEM.md`'s new "Focus rings" note.
  Independent reviewer subagent caught that the first pass had marked the wrong two
  TECH-DEBT.md rows resolved and missed the actual tracked row — fixed before the PR
  opened; also corrected two unrelated, genuinely stale 2026-09-28 rows (screenshot
  harness / `commit-screenshots` job) that were never marked resolved even though the
  facts they waited on have been true since dev run 17 (2026-09-29). Verified the
  compiled Tailwind utility directly (`@tailwindcss/node`'s `compile()`) rather than
  trusting the class name alone. 321/321 tests pass (2 new regression tests), lint
  clean; `npm run build` reproduced the known ADR-006 sandbox font-fetch gap, left to
  CI. PR #91 merged (4/4 gating checks green). (design)
- 2026-10-01 — UX-2026-006: `/compare/[a]/[b]`'s at-a-glance table has no
  `table-layout: fixed`, so a cell avoids wrapping if it can — vLLM's `category` list
  grew to three items (`ai, llm, inference`) since design run 13 last reviewed this
  page as clean on mobile, and the real `compare-ollama-vllm__mobile-light.png`
  screenshot showed the value silently clipped mid-word at the 390px viewport edge
  (the `overflow-x-auto` wrapper's horizontal scroll has no visual affordance). A
  first-draft fix mirrored `AlternativesTable`'s own UX-2026-002 fix (hide the row
  below `sm`) but an independent reviewer subagent caught that `hidden` is
  `display:none`, removed from the accessibility tree too — it would have hidden the
  fact from a screen reader at the same mobile viewport, not just sighted users, and
  was more lossy than necessary on a two-repo comparison page. Shipped a wrap-based
  fix instead (`inline-block max-w-32 break-words sm:max-w-none` on the Category
  value), keeping the content visible and in the accessibility tree at every
  viewport; independently compiled the new Tailwind utilities via
  `@tailwindcss/postcss` to confirm they resolve to real CSS. Regression test written
  first (confirmed it failed pre-fix). 330/330 tests pass (1 new), lint/`tsc --noEmit`
  clean; `npm run build` reproduced the known ADR-006 sandbox font-fetch gap, left to
  CI. PR #96 merged (3/3 gating checks green). Real-screenshot re-review of the
  rendered fix is next design run's first job (the post-merge `commit-screenshots`
  run was still in progress when this run closed out). (design)
- 2026-10-01 — UX-2026-006, re-diagnosed and re-fixed: the real-screenshot re-review
  the prior run queued up found that fix's own `commit-screenshots` CI job had
  produced **zero diff** — the real, correctly-fonted screenshot was pixel-identical
  before and after that merge, meaning the fix had no actual effect in production.
  Root-caused with a real Chromium/Playwright reproduction of the exact table (real
  compiled `globals.css`, real component markup) at the project's 390/768/1440px
  viewports: the table's `min-w-[24rem]` (384px) applied unconditionally, including
  below `sm`, while `RootLayout`'s `main max-w-3xl px-6` leaves only 342px of content
  width at the 390px mobile viewport — 384 > 342 always, regardless of Category's
  content, which is what actually forced the silent `overflow-x-auto` clipping on
  every mobile pageview of this route. Scoped the floor to `sm:min-w-[24rem]`
  instead (never applies below 640px; tablet/desktop unchanged, since natural
  content there already exceeds 384px), keeping the first fix's `max-w-32`/
  `break-words` Category wrap as a second, independent guard. Independent review
  (subagent) caught that the new regression test was itself class-presence-only —
  the same blind spot that let the first fix ship broken — so added a generic,
  durable rendered-geometry check to the Playwright screenshot harness instead
  (every route × viewport: no `overflow-x: auto|scroll` element may have
  `scrollWidth` exceeding `clientWidth`), verified against both the pre- and
  post-fix reproductions before relying on it. 333/333 tests pass (2 new), lint/
  `tsc --noEmit` clean; `npm run build` reproduced the known ADR-006 sandbox
  font-fetch gap, left to CI. PR #99 merged (5/5 gating checks green, including the
  real Playwright/axe-core run — 48/48 checks passed, our new overflow check
  included); post-merge `commit-screenshots` finally produced a real diff this
  time, and the refreshed `compare-ollama-vllm__mobile-*.png` screenshots were
  reviewed directly this same run — vLLM's full "ai, llm, inference" now renders
  with clear margin before the viewport edge, no clipping. (design)

- 2026-10-02 — **design:** Precision Editorial look-and-feel refresh. New teal/slate/amber
  tokens (all pairings re-validated, `generate_palette.py` updated), serif retired
  (Inter + IBM Plex Mono only), sticky header + 6xl frame, homepage hero/search entry,
  richer Grove and repo cards (category badge, amber `StarIcon`, `alt:` line, member
  preview), repo page hero card + sidebar, stray chip-list bullets removed. Mock-only
  elements with no backing data were not built (listed in DESIGN-SYSTEM.md). 376/376
  tests; screenshot harness 48/48 with 0 axe violations. (design)
- 2026-10-02 — **design:** repo page details widgets from real data — hero GitHub button +
  stat tiles + "Direct alternative to" chips, Repository ledger, Grove neighbors, "How it
  compares" matrix. Data-less mock widgets (Health Index, Quick Start, Language
  Composition, Community Pulse, commit density) left unbuilt, listed in DESIGN-SYSTEM.md. 383/383 tests;
  harness 48/48, 0 axe violations. (design)
