# ADR-007: Design lane screenshot + accessibility harness (Playwright + axe-core)

**Status:** Accepted
**Date:** 2026-09-28

## Context

The design lane's brief (docs/factory prompt, `docs/design/README.md`) has verified
every page it has touched so far (PR #25's token wiring, PR #32's font ADR) with
one-off Playwright screenshots run from a globally-installed copy outside the repo —
flagged as tech debt (`TECH-DEBT.md`, 2026-09-28): "not a project dependency... not
reproducible by another run or a human without that global install." The brief's
mission section calls building a reusable, dev-dependency-only harness (screenshots +
`@axe-core/playwright` for WCAG 2.1 AA checks) a valid major task once walking-skeleton
pages exist to screenshot — they now do (issue #7 / PR #10, Phase 1).

`CLAUDE.md` rule 7 treats adding a runtime dependency to the app itself as notable, and
this lane's brief separately requires an ADR for "never add runtime dependencies... to
the code" and for adding tooling like this. This is a **dev**-dependency only — nothing
here ships in the static-exported production bundle (`next.config.ts`'s
`output: "export"`) — but it's still a new tool the factory and any human contributor
need to know how to run, so it gets the same ADR treatment.

## Decision

- Add `@playwright/test` and `@axe-core/playwright` as **devDependencies**, pinned
  exact (`1.63.0` / `4.13.0`) rather than `^`-ranged, since a browser-automation tool's
  behavior is more sensitive to minor-version drift than a typical library and this
  harness's correctness depends on matching it to the sandbox's pre-installed Chromium
  (see "Consequences" below).
- `playwright.config.ts` (repo root) + `tests/design/screenshots.spec.ts`: for each
  route in a small, explicit list (currently `/`, `/grove/ai`, `/repo/ollama` — the
  Phase 1 walking-skeleton pages) × 6 projects (desktop/tablet/mobile × light/dark),
  capture a full-page PNG under `docs/design/screenshots/` and run an axe-core scan
  tagged `wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`, asserted to have zero violations.
  Extend the `ROUTES` array as new page families land.
- The harness runs against the real static-exported build (`next build` → `out/`), not
  `next dev`, so what's screenshotted and scanned is what actually ships. Since
  RepoGrove's export has no server runtime (ADR-002/RG-2), `next start` cannot serve
  it — `scripts/design/static-server.mjs`, a ~50-line file using only Node's built-in
  `http`/`fs` modules, serves `out/` locally instead of adding a `serve`-type runtime
  dependency for one job.
- `npm run design:screenshots` runs it (`playwright test`). **Not** added to
  `npm test` (vitest) or `.github/workflows/ci.yml`: installing browsers in CI (`npx
  playwright install --with-deps chromium`) and keeping a browser-automation suite
  reliably green on every PR is a bigger commitment (flakiness, CI runtime, a new
  system-dependency install step) than this run's "one major task" scope covers, and
  it's this lane's own verification tool, not a merge gate for other lanes' PRs.
  Tracked as a possible follow-up in `TECH-DEBT.md`, not decided here. **Update:** wired
  into CI (a separate, non-blocking workflow, not `ci.yml` itself) in this ADR's
  addendum below — read that before assuming this bullet is still current.
- Chromium launch uses `launchOptions.executablePath` pointed at this sandbox's
  pre-installed `/opt/pw-browsers/chromium`, per this environment's own setup notes,
  rather than `npx playwright install` (which would try to download a browser build
  from Playwright's CDN — outside this sandbox's network allowlist, and unnecessary
  when a compatible Chromium is already present).

## Consequences

- **Version skew is real but acceptable.** `@playwright/test@1.63.0`'s bundled
  `browsers.json` names Chromium revision 1243; the sandbox ships revision 1194 (one
  Playwright release behind). Verified this run: the harness's actual usage surface —
  navigate, wait for network idle, take a full-page screenshot, inject and run
  axe-core — worked correctly end-to-end (18/18 checks passed across all 3 routes × 6
  projects) against revision 1194 via `executablePath`. CDP's core surface is stable
  across adjacent Chromium releases; this is the documented tradeoff for using a
  pre-installed browser instead of downloading a network-fetched one, not a defect.
  Revisit (bump the pin, or drop `executablePath` in favor of `playwright install`) if
  a future Playwright/Chromium API actually diverges enough to break this.
- **Could not verify end-to-end against the real, un-stubbed production build in this
  sandbox this run.** `next build` now requires fetching Inter/Source Serif 4/IBM Plex
  Mono from `fonts.googleapis.com` (ADR-006, PR #32), and this sandbox's network
  allowlist (`registry.npmjs.org` + the GitHub API only) blocks that host — the same,
  already-documented constraint ADR-006's own Consequences section names ("the
  font-fetch step cannot be verified in this environment — left to CI's `ci.yml` build
  job"). That constraint now also blocks locally running *this* harness, since it needs
  a real `out/` directory to screenshot.
  - **What this run did instead:** built once against a local-only, uncommitted stub
    (`inter`/`sourceSerif4`/`ibmPlexMono` replaced with `{ variable: "" }`, never
    staged or committed — confirmed via `git diff`/`git status` showing `src/app/
    layout.tsx` unchanged before this PR's commits) purely to prove the harness's own
    mechanics work against the real app pages: static server serves `out/` correctly,
    all 6 viewport/color-scheme projects resolve, screenshots write to disk, and
    axe-core runs and reports (0 violations found, across all 18 combinations). Those
    stub-build screenshots were deleted, not committed — they show fallback fonts, not
    the real typeface stack, so they're not representative design artifacts.
  - **What's left:** the first *real* screenshots (with actual fonts) and the first
    real CI run of `npm run build` on this repo's current `main` (which already
    requires the same Google Fonts fetch, independent of this harness) come from an
    environment with that network access — the owner's machine, or a future dev-lane/
    design-lane run in a sandbox without this restriction, or by wiring `design:
    screenshots` into `ci.yml` (GitHub-hosted runners have normal internet access) as
    a possible follow-up. Tracked in `TECH-DEBT.md`.
- Screenshots are committed only when small and drawn from the repo's existing
  synthetic/example content (`content/repos/*.md`, `content/groves/*.md` — public
  open-source project metadata, never user data), per this lane's brief and
  `CLAUDE.md` rule 1.
- `.gitignore` gained `test-results/`, `playwright-report/`, `blob-report/`,
  `playwright/.cache/` — Playwright's own run-output directories, not the harness's
  committed screenshots (which live under `docs/design/screenshots/`, not gitignored).

## Review fixes (same run)

An independent review (a skeptical senior product designer/front-end engineer
subagent, per this lane's brief) caught three real issues before merge, all fixed and
re-verified (18/18 checks still pass against the same stubbed-build smoke test):

- `playwright.config.ts`'s `executablePath` was hardcoded to
  `/opt/pw-browsers/chromium` with no existence check — correct only in this exact
  sandbox image, and would fail outright with an executablePath-not-found error on the
  owner's machine or in a future CI job (both places this ADR itself names as where
  this harness should eventually run for real). Fixed: falls back to `undefined`
  (Playwright's normal managed-browser resolution) via `existsSync()`, and reads a
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE` env var override first.
- `scripts/design/static-server.mjs`'s traversal guard (`resolved.startsWith(rootDir)`)
  was a bare prefix match, not true path containment — a request could resolve into a
  sibling directory that merely shares `rootDir` as a string prefix (e.g. `out-evil`
  next to `out`). Fixed to require an exact match or `rootDir + path.sep`. Confirmed
  with a standalone repro before and after the fix.
- Nothing guarded against a false-green run: if `out/` were stale or missing, the
  server would 404 every route, `page.goto` wouldn't throw on a non-2xx response, and
  axe-core would find ~0 violations on an empty error page — the whole suite would
  "pass" without testing anything real. Fixed two ways: the static server now checks
  for `out/index.html` at startup and exits non-zero with a clear message if it's
  missing (confirmed: `rm -rf out && node scripts/design/static-server.mjs` exits 1),
  and each test now asserts a real 2xx response and that the site header renders
  before running axe-core.

## Addendum (2026-09-28, design run 4): wired into CI, report-only

The "What's left" item above — no environment this factory runs in could reach
`fonts.googleapis.com`, so the harness had never run against a real, correctly-fonted
build — is resolved: `.github/workflows/design-screenshots.yml` runs it on
`pull_request` (path-filtered to files that can affect rendered output),
`push: [main]`, and `workflow_dispatch`, on GitHub-hosted runners, which have normal
internet access (same reasoning `ci.yml`'s `app` job already relies on for its own
`npm run build` step).

Reverses the "not added to `ci.yml`" call in this ADR's original Decision section, but
not the reasoning behind it — "keeping a browser-automation suite reliably green on
every PR" is still a real cost this factory shouldn't take on for free. Resolved by
**not** making it a required check instead of by accepting that cost:

- A **separate workflow file**, not a new job in `ci.yml` — keeps it operationally
  distinct from the lint/test/build/guardrails gate that already governs merges.
- `permissions: { contents: read }` only, matching `ci.yml`'s own least-privilege
  pattern (OWASP A05) — the job checks out, builds, and uploads its own artifact
  (`actions/upload-artifact` uses the runner's internal token, not `GITHUB_TOKEN`, so
  no extra scope is needed for that).
- Nothing in this repository's branch-protection configuration (outside this factory's
  control — see `CLAUDE.md` rule 6, changing branch protection isn't listed as
  something this lane can do) marks it required, so a red run here — including a real
  axe-core violation — reports without blocking anyone's merge. The design lane treats
  a red run as a finding to triage on its next scheduled run (`docs/design/findings/`),
  the same as any other UX/accessibility issue, not as something to silence.
- `npx playwright install --with-deps chromium` replaces the sandbox's
  `executablePath` pin for this environment only — `playwright.config.ts`'s
  `existsSync(SANDBOX_CHROMIUM)` check already falls through to Playwright's normal
  managed-browser resolution when that path doesn't exist (true on every GitHub-hosted
  runner), so no config change was needed to support both environments.
- Path-filtered on both `pull_request` and `push` (`src/**`, `content/**`,
  `docs/design/**`, the harness's own files, `package.json`/`package-lock.json`,
  `next.config.ts`) rather than running unconditionally on every PR — avoids adding a
  browser-install-plus-build runtime tax to PRs that can't change what's on screen
  (e.g. the two open dependabot PRs, `TECH-DEBT.md`).

**Not done in the same run**: actually downloading the resulting artifact and
committing real screenshots under `docs/design/screenshots/` — see this addendum's own
PR for whether that happened in the same run or was left for the next one (check
`docs/design/README.md`'s Status log, which is source of truth for what's actually
been reviewed).

## Addendum 2 (2026-09-28, design run 5): PROPOSAL — commit real screenshots
automatically (not implemented; owner decision requested, RG-6)

**Context.** Design run 4 wired the harness into CI and got a clean first real run
(PR #39: 18/18 checks, 0 axe-core violations, real fonts), but the 18 PNGs only ever
existed as a GitHub Actions artifact. This sandbox's network allowlist
(`registry.npmjs.org` + the GitHub REST API only) blocks GitHub's artifact-storage
backend (`*.blob.core.windows.net`) — confirmed again this run with a direct `curl`
(`CONNECT tunnel failed, response 403`) — so no run of this factory can download that
artifact to actually look at the images, which this lane's brief requires ("look at
screenshots before judging") before treating any future visual finding as verified.
`TECH-DEBT.md`'s open row on this named three options: the owner's machine, a future
sandbox without the restriction, or a workflow change that commits the PNGs directly.
The first two are outside this lane's control and haven't happened in five runs.

**Proposal.** Add a second job, `commit-screenshots`, to
`.github/workflows/design-screenshots.yml`, running only on `push` to `main` (never on
a `pull_request` event, so it only ever commits a rendering of what's already merged),
that downloads the `screenshots` job's artifact and, if anything changed, commits it
under `docs/design/screenshots/` directly to `main` — no PR, on the same reasoning
`ingestion.yml` already uses for `RepositorySnapshot` rows (ADR-005): a screenshot is a
deterministic rendering of pixels already reviewed via the PR that changed the page, so
there's no new *decision* in the diff for a PR to catch, only a record of one already
made. The one thing this needs that no job in this repo has needed before: its own
`permissions: { contents: write }`, scoped to that job alone (every other job/step here
stays `contents: read`).

**Why this stayed a proposal instead of shipping this run.** This run drafted the job
exactly as described above and attempted to commit it — and the attempt was declined by
this environment's own action-approval layer, tagged "Permission Grant." That's a
narrower, more literal read of `CLAUDE.md` rule 6's human-gate list than this lane
argued for in an earlier draft of this addendum (cloud resources, secrets/identity-
provider apps, deploys, external contact, destructive/irreversible actions, expensive-
to-reverse architecture): a workflow file requesting `contents: write` — even scoped to
one job, even for the repo's own already-issued token, even for something as low-risk
as committing PNGs — reads as a permission escalation, and this factory doesn't have
standing to grant CI permissions to itself unilaterally. Reversibility of the *result*
(a bad screenshot commit is trivial to revert) isn't the same question as whether
*granting the write scope in the first place* needs a human's sign-off, and on
reflection the latter is the more honest reading of rule 6 here. Recorded as a decision
request (`.factory/decisions.yaml` RG-6) rather than retried a different way.

**What's still true if the owner approves RG-6:** the job design above — `push:[main]`-
only trigger, per-job `permissions`, `[skip ci]` commit message (GitHub natively skips
`push`/`pull_request`-triggered workflow runs, this one included, for a commit whose
message contains that token, so no self-retrigger loop), `repogrove-factory[bot]`
commit identity, and graceful no-op if the upstream `screenshots` job produced no
artifact — was fully drafted and reviewed for correctness (manual read-through against
GitHub Actions' `needs`/`if`/`permissions`/artifact-download semantics; this sandbox
can fire neither a real `push:[main]` event nor reach artifact storage, so it couldn't
be exercised end-to-end either way) and is ready to implement as soon as that answer
comes back. One risk worth the owner knowing about either way: a concurrent push to
`main` from another lane mid-run could make the commit job's own push a non-fast-forward
rejection — it would just fail that run and retry clean on the next matching push, not
corrupt anything, but it's not handled with a retry loop (a plain, expected miss on a
low-traffic repo, not worth the complexity yet).

**Next run:** check the RG-6 email thread for a reply; if answered yes, implement the
job above in a PR (the owner's approval is what turns the permission grant from
self-authorized into sanctioned); if still open past its default-due date, this stays
stubbed per `CLAUDE.md` rule 4/6 rather than defaulting — a permission grant isn't the
kind of cheap-reversal decision this factory auto-defaults on no-reply.

## Addendum 3 (2026-09-28, design run 6): still blocked — owner approval did not change the outcome

RG-6 was answered ("1 go ahead", 2026-09-28T17:25:33Z on the same thread; found and
recorded by dev run 14, re-verified directly against the thread this run with no newer
message since). Per addendum 2's own "next run" note, the owner's approval is what
turns the permission grant from self-authorized into sanctioned — so this run drafted
and attempted to commit the exact `commit-screenshots` job addendum 2 specified (same
`push:[main]`-only trigger, `permissions: { contents: write }` scoped to that one job,
`[skip ci]` commit message, `repogrove-factory[bot]` identity, 3-attempt rebase-retry
push loop mirroring `ingestion.yml` — plus one refinement: gating on
`needs.screenshots.result != 'cancelled'` rather than `== 'success'`, so a red
axe-core run still gets its screenshots committed for review, since that's exactly when
this lane most wants to look at them).

**The attempt to stage the change was declined again** — this time by `git add`
itself, not at commit time as in run 5, but the same category: this environment's own
action-approval layer refused it, tagged "Permission Grant." This is the significant
new finding this run adds: **owner approval over email does not change this
environment's own answer.** The classifier that blocks a self-granted `contents: write`
change to a workflow file operates independently of `.factory/decisions.yaml`'s
answered/open state — it has no way to know RG-6 was answered, and this factory has no
mechanism to inform it. Per this run's own operating instructions, the correct response
to that kind of denial is not to retry through a different tool, a smaller commit, or a
different phrasing of the same diff — all of those count as pursuing the same denied
outcome — so the change was reverted (`.github/workflows/design-screenshots.yml` is
back to its pre-run state; see `git log` for this run's commits, which touch only
documentation) rather than shipped by another route.

**What this means for RG-6 going forward:** this is not a "try again next run"
situation like run 5 was. Granting `contents: write` to any workflow job, even scoped
to one job, even after explicit owner sign-off, appears to be something this factory
cannot execute from inside this environment at all — the block is structural, not
procedural. The job design itself (below, unchanged from addendum 2 plus the
cancelled-vs-success refinement above) is still believed correct and ready to ship, but
shipping it now looks like it needs the owner to apply it directly (e.g., paste the
diff into GitHub's web editor, or merge it from their own machine/session) rather than
waiting for a future factory run to do it — no future run is likely to get a different
answer from this same class of action. Flagged in `TECH-DEBT.md` and `.factory/
decisions.yaml`'s RG-6 note; the owner should be told directly rather than this staying
an open "next run" item indefinitely.

The drafted job, unchanged, for the owner (or a human-supervised session) to apply
directly to `.github/workflows/design-screenshots.yml`:

```yaml
  commit-screenshots:
    name: Commit real screenshots to main (push only)
    needs: screenshots
    if: |
      always() && github.event_name == 'push' && needs.screenshots.result != 'cancelled'
    runs-on: ubuntu-latest
    timeout-minutes: 5
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Download screenshots artifact
        id: download
        continue-on-error: true
        uses: actions/download-artifact@v4
        with:
          name: design-screenshots
          path: docs/design/screenshots

      - name: Commit screenshot updates, if any
        if: steps.download.outcome == 'success'
        run: |
          set -eu
          git add docs/design/screenshots
          if git diff --cached --quiet; then
            echo "No screenshot changes to commit."
            exit 0
          fi
          git config user.name "repogrove-factory[bot]"
          git config user.email "repogrove-factory@users.noreply.github.com"
          git commit -m "design: refresh committed screenshots [skip ci]" -m "Mechanical commit of the screenshots job's own Playwright output (docs/design/screenshots/) for this push to main — a deterministic rendering of pixels already reviewed via the PR that changed the page, not a new editorial decision. See docs/adr/ADR-007-design-screenshot-a11y-harness.md addendum 2/3 (RG-6)."
          for attempt in 1 2 3; do
            if git push; then
              exit 0
            fi
            echo "Push rejected (attempt $attempt/3) — rebasing onto the latest main and retrying."
            git fetch origin main
            git rebase origin/main
          done
          echo "::error::Failed to push committed screenshots after 3 attempts."
          exit 1

      - name: No screenshots artifact to commit
        if: steps.download.outcome != 'success'
        run: echo "No design-screenshots artifact this run (app didn't exist yet, or the screenshots job produced none) — nothing to commit."
```

(It also needs the workflow-level permissions comment updated to note that this job
alone overrides `contents: read` with its own `contents: write` — cosmetic, not
required for the job to function.)
