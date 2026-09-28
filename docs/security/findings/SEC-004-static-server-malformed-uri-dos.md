# SEC-004 — Malformed-URI request crashed the design harness's static server (unhandled rejection)

- **Status: FIXED** (this run). **Verified: yes** — same run (regression tests added
  and passing; failing test confirmed against the pre-fix code first — see verification
  note below)
- **Severity:** LOW (localhost-only, CI-only test infrastructure; no data exposure, no
  externally-reachable surface — see Impact)
- **Summary:** `scripts/design/static-server.mjs` (the design lane's local static file
  server for the Playwright + axe-core screenshot harness, ADR-007, added in PR #36/#39)
  passed `req.url` straight into `decodeURIComponent()` inside its request handler with
  no error handling. A malformed percent-encoding (e.g. a bare `%`, trivially sendable
  by any raw TCP client — `curl` included) throws a `URIError`. Because the handler is
  an `async` function that `node:http`'s `createServer` never awaits, that throw became
  an unhandled promise rejection, which is fatal by default in Node — the entire server
  process crashed and stopped answering *every* connection, not just the bad one.

## Component
`scripts/design/static-server.mjs` (the request handler passed to `createServer`).
Reached only by `tests/design/screenshots.spec.ts` via `playwright.config.ts`'s
`webServer` config, on GitHub-hosted CI runners (`.github/workflows/design-screenshots.yml`)
or a contributor's own machine — never deployed, never internet-facing.

## OWASP mapping
Not a clean fit for the web-app OWASP Top 10 (this is CI/test tooling, not the product
itself) — closest is A05:2021 Security Misconfiguration (missing/incorrect error
handling), in the same "repository-controlled CI/CD infra" scope as SEC-001. Also a
plain availability/robustness bug: an uncaught exception in a shared process taking down
work unrelated to the request that triggered it.

## How this was found
Routine review of new attack surface introduced since the last security run: PR #36 and
#39 (design lane's screenshot+a11y harness, wired into CI) added this script. It's new,
repository-controlled CI infrastructure per this lane's scope, so it got the same
line-by-line read as `fetch-snapshots.ts`'s SSRF-relevant code got in SEC-002. The path
-containment logic (`resolveFile`) is careful and correct (true prefix-with-separator
check, not a bare `startsWith`); the unguarded `decodeURIComponent` call next to it
was not.

## Evidence
Reproduced directly (not just theoretically) before writing the fix:

```
$ node scripts/design/static-server.mjs --dir . --port 4399   # (cwd: a dir with index.html)
design static server serving /tmp/repogrove-secscan at http://127.0.0.1:4399
$ curl -sS -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:4399/%"
000
curl: (52) Empty reply from server
```

Server-side stack trace at the moment of the crash:

```
file:///.../scripts/design/static-server.mjs:78
  const file = await resolveFile(decodeURIComponent(req.url ?? "/"));
                                 ^
URIError: URI malformed
    at decodeURIComponent (<anonymous>)
    at Server.<anonymous> (file:///.../scripts/design/static-server.mjs:78:34)
Node.js v22.22.2
```

`curl` (and any raw client) can send a literal `%` on the wire without pre-validating
it; `fetch()`/browsers construct requests through the URL Standard's parser, which
normalizes or percent-encodes an invalid sequence rather than emitting it raw — that's
why this needed a raw-socket request to reproduce in the regression test
(`tests/design/static-server.test.ts`) rather than `fetch()`.

## Impact
- The server only ever binds `127.0.0.1` and only ever runs transiently inside a CI job
  or a contributor's own `npm run test:design`-equivalent invocation — never reachable
  from outside that single machine/runner, and never handles anything but this repo's
  own already-built static HTML/CSS/JS. No secret, credential, or user data is served by
  this path.
- Real-world impact was limited to this lane's own CI job failing with a confusing
  "connection refused"-style Playwright error instead of a clear signal, on any request
  a test (or a future, less careful one) happened to send with an unusual character —
  not exploitable by an outside party today. Kept as LOW rather than INFORMATIONAL
  because it's a genuine uncaught-exception/DoS *class* of bug (the fix generalizes: any
  future unexpected error in this handler, not just this one `URIError`, is now caught
  and answered with 500 instead of taking the process down) in code this repo already
  ships and runs unattended in CI.

## Fix
Wrapped the whole request-handler body in try/catch: a `URIError` (malformed percent
-encoding) now answers `400 Bad request`; any other unexpected error answers
`500 Internal server error` and is logged — neither crashes the process, so one bad
request can no longer take down every other route/test sharing the same server
instance. See `scripts/design/static-server.mjs`'s inline comment for detail.

Regression tests: `tests/design/static-server.test.ts` — spawns the real script as a
child process and drives it with a raw TCP socket (the only way to send a genuinely
malformed percent-encoding; normal HTTP clients won't let you). Confirmed the first
test fails against the pre-fix code (empty response / dropped connection instead of
400) before applying the fix — TDD, failing test written first.

## Related
- SEC-001 — same OWASP category (A05), same "repository-controlled CI/CD infra" scope.
- SEC-002 — same review pattern (new attack surface introduced by a recent PR, read
  line-by-line rather than trusting the PR's own testing notes).
- `docs/security/README.md` — A05 row.
