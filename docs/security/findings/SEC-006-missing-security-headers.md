# SEC-006 — No security response headers configured for the now-live production deployment

- **Status: FIXED (partial — see Fix/Deferred)**. **Verified: yes, this run** (regression
  test added and confirmed failing before the fix, passing after; Azure Static Web Apps'
  own `globalHeaders` mechanism confirmed by documentation, not by inspecting the live
  resource — see Evidence/Impact for what is and isn't independently confirmed).
- **Severity:** LOW (defense-in-depth on a read-only, no-auth, no-PII static site — see
  Impact; not inflated to MEDIUM because there is no demonstrated exploitation path
  today, not downgraded to INFORMATIONAL because the site is now genuinely public and
  live, so "nobody can reach it yet" no longer applies)
- **Summary:** This run found that `main` has gained a real, live production deployment
  since the last security review (run 10) — `.github/workflows/azure-static-web-apps-orange-sea-032472e10.yml`,
  added directly by the owner (`c0a5938`, Azure's standard "on-behalf-of: @Azure" portal
  integration commit) with a follow-up path fix (`c6e47df`), now deploys every push to
  `main` to a real Azure Static Web App, and `GET /repos/wernerh/repogrove/actions/workflows/373247078/runs`
  confirms multiple `push` events completing with `conclusion: success` today
  (2026-10-02). `docs/security/PRODUCTION-HARDENING.md`'s "CSP / security headers" row
  had been `NOT VERIFIED` since bootstrap specifically because it was "genuinely blocked
  on a live deployment target" — that blocker is now gone. The repo had no
  `staticwebapp.config.json` anywhere (confirmed — `find . -iname staticwebapp.config.json`
  returns nothing pre-fix), so the live site was serving with no `globalHeaders` override
  at all beyond whatever minimal defaults the Azure Static Web Apps platform applies on
  its own.

## Component
`public/staticwebapp.config.json` (new) — copied verbatim into the Next.js static
export's output root by `next build`'s standard `public/` → `out/` copy, landing exactly
where `azure-static-web-apps-orange-sea-032472e10.yml`'s `output_location: "out"` expects
it. Repository-controlled hosting config, in scope per this lane's "repository-controlled
infra ... config" clause — not a live-resource change, a repo file.

## OWASP mapping
A05:2021 – Security Misconfiguration (missing security headers on a live public
endpoint). Added as a new row in `docs/security/README.md`'s Findings table rather than
folded into the existing A05 finding (SEC-001/SEC-005) because the underlying surface —
"is there a live deployment at all" — is new, not a restatement of either prior finding.

## How this was found
Per this run's charge to "review the real code that shipped since your last run," diffed
`b26eed5..HEAD` (the last security-reviewed commit) across `src`, `scripts`, `.github`,
`package.json`, `package-lock.json`: 58 files, ~5,150 insertions. Almost all of it is
content/component work already covered by the dev/design lanes' own review (new
`TrendBoard`/`TrendHeader`/`GroveHeader`/`GroveRepoList`/etc. components, a
`.github/CODEOWNERS` file wired to the already-known SEC-005 branch-protection gap, a
content-validation guard against wrapped Markdown bullets) and came back clean on a
direct read: no `dangerouslySetInnerHTML` outside the pre-reviewed explanatory comment in
`src/lib/content.ts`, no new `eval`/`new Function`, every new internal `<Link href=...>`
builds from build-time-validated repo/grove slugs (never user input), `react-markdown`
still has no raw-HTML plugin anywhere. The one item that was not just more of the same
was the new `.github/workflows/azure-static-web-apps-orange-sea-032472e10.yml` — a real
deploy pipeline, which this lane's scope explicitly covers ("repository-controlled CI/CD
... config"). Reviewed it line by line: `permissions: { id-token: write, contents: read }`
is appropriately scoped at job level; the deploy token is referenced only via
`secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_ORANGE_SEA_032472E10` (GitHub Actions secrets
context — never hardcoded, never echoed to a log step); the `close_pull_request_job`
only runs on `pull_request: closed` and only tears down that PR's own preview
environment. Considered and ruled out a fork-PR secret-exfiltration concern: this
workflow uses the `pull_request` event (not `pull_request_target`), and GitHub's own
documented behavior withholds repository secrets from workflow runs triggered by a
pull request from a forked repository regardless of this repo's own settings — the
`azure_static_web_apps_api_token` input would simply be unset for a genuine external
fork PR, not exfiltratable. (The repo's own "require approval for first-time
contributors" setting, which gates whether such a run even executes at all, could not be
read — `GET /repos/.../actions/permissions*` is blocked by this sandbox's own egress
proxy, same as every prior run's attempts on adjacent endpoints — left `NEEDS-VERIFICATION`,
not claimed either way.) With the deploy pipeline itself reviewed clean, the open
question became "now that this is genuinely live, what in `PRODUCTION-HARDENING.md`'s
backlog of `NOT VERIFIED (blocked on deployment)` rows can finally get a real answer" —
checked for `staticwebapp.config.json` (Azure Static Web Apps' own mechanism for
response headers on a static-export app with no server/middleware available) and found
none.

## Evidence
```
$ find . -iname "staticwebapp.config.json" -not -path "*/node_modules/*"
                                                          # (no output, pre-fix)
```
Deploy pipeline confirmed real and currently green (repo-side fact, not a live-resource
probe):
```
$ curl .../repos/wernerh/repogrove/actions/workflows/373247078/runs?per_page=10
37075824329 push completed success main 2026-10-02T23:04:54Z
37066617639 push completed success main 2026-10-02T21:24:11Z
...
$ curl .../repos/wernerh/repogrove/commits/main/check-runs
Build and Deploy Job  completed  success
```
Repo-wide grep confirming the site has no runtime dependency the headers below could
plausibly break: no `next/image`, no `<script>`/`next/script`, no analytics/`gtag`/gstatic
calls, no camera/microphone/geolocation API usage anywhere in `src/`. Two files do use
inline `style={{ width: ... }}` (`src/components/TrendBoard.tsx`,
`src/components/GroveHeader.tsx`) for progress-bar widths — noted below as the reason
`Content-Security-Policy` is explicitly deferred rather than guessed at.

## Impact
- **Confirmed (repo-side, 100% certain):** before this fix, the live site had zero
  explicit security-header configuration anywhere in the repository. Whatever the
  Azure Static Web Apps platform applies on its own by default was all that existed.
- **Not independently confirmed (would require inspecting the live resource, which this
  lane never does):** the exact header set the live `*.azurestaticapps.net` origin was
  actually sending before this fix, and whether it changes after this fix deploys.
  Framed as the repo-side gap being real and fixed, not as "the live site was
  definitely vulnerable to X" — this is defense-in-depth hardening, not a demonstrated
  exploit.
- Low severity because: no auth, no accounts, no PII collected today (A01/A02/A07 all
  still NOT APPLICABLE per the existing OWASP table), the site is read-only editorial
  content with no user-generated content and no raw-HTML rendering path (A03 stays
  PASS) — so the headers below are hardening against classes of attack (clickjacking,
  MIME-sniffing, browser-feature abuse via a compromised dependency) that have no
  current foothold to combine with, not closing an active hole.
- Still worth a real severity (not INFORMATIONAL): the site is now genuinely public,
  live, and reachable — "there's no deployment yet" stopped being a mitigating factor
  the moment `c0a5938`/`c6e47df` landed and the push-triggered deploys started
  succeeding, and CLAUDE.md's own stated end state for RepoGrove is exactly this kind of
  public, SEO-driven, high-traffic site.

## Fix
Added `public/staticwebapp.config.json` (Next.js copies `public/` into the static export
root, landing exactly at the deploy workflow's `output_location: "out"`):
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, and a `Permissions-Policy` denying
every powerful browser feature this site's source never calls (`camera`, `microphone`,
`geolocation`, `payment`, `usb`). All four are purely additive response headers with no
effect on routing, caching, or any existing behavior — confirmed by scoping the file to
`globalHeaders` only, nothing else (`routes`/`navigationFallback`/`mimeTypes` all
untouched), and pinned by the new regression test asserting the config's top-level keys
are exactly `["globalHeaders"]` so a future edit can't silently add a routing-affecting
key as a side effect.

Regression test: `tests/infra/staticwebapp-config.test.ts` — confirmed failing
(`ENOENT`, no config file) before the fix, passing after. `npm test` (463/463, up from
457), `npm run lint` (clean), `tsc --noEmit` (clean), `npm audit --audit-level=high`
(0 vulnerabilities) all re-run after the fix and still clean.

## Deferred — Content-Security-Policy
Deliberately **not** shipped this run, and this is the main reason this finding is
"FIXED (partial)" rather than fully closed. A real CSP needs a correct `script-src`, and
getting that wrong on the next auto-deploy would be a live-breaking regression this lane
has no way to catch in advance:

- Next.js App Router's static export has no server or middleware available at all
  (`output: "export"`), so there is no way to mint a per-request nonce for inline
  scripts — the usual safe way to allow React/RSC's own inline hydration `<script>`
  tags under a strict CSP.
- This sandbox's local `npm run build` cannot complete (the known ADR-006
  `fonts.googleapis.com` proxy gap, reproduced again this run — fails at the font-fetch
  step, confirmed it still compiles past content loading first), so there is no real
  `out/` HTML this run could inspect to enumerate the exact inline scripts that would
  need a hash-based CSP entry.
- This lane never inspects or touches the live deployment directly, so checking the
  real rendered page is also not an option.
- Two components (`TrendBoard.tsx`, `GroveHeader.tsx`) use inline `style={{ width }}`
  attributes, so `style-src` would need `'unsafe-inline'` at minimum regardless —
  confirmed safe for that specific, narrow use (numeric widths only, no content ever
  flows from Markdown/user input into a `style` attribute anywhere in `src/`), but still
  worth getting the rest of the policy right before shipping it.

Recommended next step for whichever run picks this up: get a real `out/` build (either
once ADR-006's font-fetch gap is resolved, e.g. by switching the two Google fonts to
`next/font/local` — a dev-lane call, not this lane's to make unilaterally — or by reading
CI's own successful build logs/artifact rather than running it locally), enumerate the
actual inline `<script>` tags Next.js emits for hydration, and write a CSP with either
correct hashes or an explicit, reasoned `'unsafe-inline'` tradeoff instead of a guess.
Left as `NOT VERIFIED` in `docs/security/PRODUCTION-HARDENING.md`'s CSP row rather than
closed.

## Related
- `docs/security/PRODUCTION-HARDENING.md` — "CSP / security headers" and "HTTPS
  enforced" rows, both updated this run now that a real deployment exists to reason
  about (HTTPS enforcement itself stays `NEEDS-VERIFICATION` — Azure Static Web Apps
  documents always serving its default domain over HTTPS with a managed certificate,
  but confirming that for *this* app's actual live origin would mean inspecting the
  live resource, which this lane does not do).
- SEC-001/SEC-005 — same A05 category, same "repository-controlled CI/CD" scope.
- `docs/adr/ADR-002-hosting.md` — recorded the owner's RG-2 answer as *Azure Storage
  static-website hosting*; what actually landed and is now live is *Azure Static Web
  Apps* (a related but distinct Azure product — ADR-002's own text already flagged this
  exact distinction as a risk if Phase 3's API needs ever required Functions). Not this
  lane's decision to adjudicate — flagged via one `PROJECT_STATE.md` Blockers line
  (CLAUDE.md §5) for the dev lane, which owns `PROJECT_STATE.md`/ADRs, to reconcile.
