# SEC-005 — Branch protection is not enabled on `main`

- **Status: OPEN, owner-blocked** (repo-admin setting; the factory's GitHub App token
  cannot change it — see Evidence). **Verified: yes, this run** — GitHub's own API now
  gives a definitive answer (`404 "Branch not protected"`), upgrading this from the
  `NOT VERIFIED` status every prior run recorded (the same endpoint used to return a
  `403` ambiguous between "not protected" and "no admin scope to even ask" — see How
  this was found).
- **Severity:** LOW (defense-in-depth gap on a repo with a single collaborator and no
  external contributors today — see Impact; not inflated to MEDIUM/HIGH because there is
  no current exploitation path, not downgraded to INFORMATIONAL because it removes a
  control `CLAUDE.md` itself assumes exists — see below)
- **Summary:** `GET /repos/wernerh/repogrove/branches/main/protection` returns GitHub's
  own `404 "Branch not protected"` — confirmed, not inferred. `main` has no branch
  protection rule: no required status checks (CI passing is not technically enforced
  before a push lands on `main`, only followed by convention), no required PR review,
  and nothing stopping a force-push or branch deletion by anyone with write access.
  `CLAUDE.md` §3.7 states "Never bypass branch protection" as a hard rule for every
  lane — that rule currently has no technical backstop, only the lanes' own discipline.

## Component
Repository security settings (`wernerh/repogrove`, GitHub-hosted, not a file in this
repo) — repository-controlled infra, in scope per this lane's brief, same class as
SEC-003.

## OWASP mapping
A05:2021 – Security Misconfiguration. Does not change A05's existing `FINDING (LOW)`
status in `docs/security/README.md` — this is an additional item in the same row, not a
new category.

## How this was found
Part of this run's routine re-verification of SEC-001/002/003/004 plus a fresh look at
the GitHub-side checks every prior security run has logged as blocked. Previous runs
(4, 6, 7, 8, 9) all recorded `GET .../branches/main/protection` as a `403 "Resource not
accessible by integration"` and filed it as `NOT VERIFIED` — genuinely ambiguous,
since a `403` from this class of endpoint can mean either "this branch has no
protection rule" (older GitHub API behavior, or a scope-limited token) or "the token
can't even ask the question." This run, the same call returned a clean `404` with
GitHub's own documented body for an *unprotected* branch, not a scope-rejection
message — a materially different, decisive answer. Re-ran it twice to rule out a flaky
response; both times `404`. Also re-confirmed `GET .../dependabot/alerts` (SEC-003)
still returns GitHub's real `"Dependabot alerts are disabled for this repository"`
(unchanged) and `GET .../secret-scanning/alerts` still returns this sandbox's own proxy
rejection (`"Access to this GitHub API path is not permitted through this proxy"`) —
that one stays `NOT VERIFIED`, unchanged; only the branch-protection check's status
changed this run.

## Evidence
```
$ curl .../repos/wernerh/repogrove/branches/main/protection
HTTP 404
{"message":"Branch not protected","documentation_url":"...","status":"404"}

$ curl .../repos/wernerh/repogrove/dependabot/alerts
HTTP 403
{"message":"Dependabot alerts are disabled for this repository.", ...}   # unchanged, real

$ curl .../repos/wernerh/repogrove/secret-scanning/alerts
HTTP 403
{"message":"Access to this GitHub API path is not permitted through this proxy.", ...}  # unchanged, proxy
```
The first response's body and `404` status match GitHub's own documented shape for an
unprotected branch (distinct from the `403`/scope-rejection shape the same endpoint
returned in every run since SEC-001), and is not this sandbox's proxy-rejection message
— a real, decisive GitHub answer.

## Impact
- The repo is public but has a single collaborator (the owner) and no external
  contributors with write access yet (spec §21's community-contribution workflow is a
  Phase 2+ idea, not built). The realistic actors who could push directly to `main`
  today are the owner and this factory's own GitHub App token — both already expected
  to follow the PR+CI convention, so there is no current outside-attacker exploitation
  path.
- The real gap is that the PR+CI gate every lane depends on (`CLAUDE.md` §5/§7: "Each
  lane merges only PRs it opened with its own label", "never bypass branch protection")
  is enforced only by each lane's own conduct, not by GitHub itself. A bug in a future
  factory run, a compromised token, or a simple mistake could push straight to `main`
  — skipping CI, lint, tests, and the independent-review step — with nothing at the
  platform level to stop it. Required status checks would convert that from "a lane
  should not do this" into "GitHub will not let this happen."
- Grows in importance once `content/` accepts outside submissions (spec §21) — at that
  point `main`'s only protection against a bad fast-forward or force-push is this same
  branch-protection setting, which still won't exist unless enabled before then.

## Fix
Not fixable by this lane: enabling branch protection (`Settings → Branches → Add branch
protection rule → main → Require status checks to pass before merging`, selecting at
least the `CI` workflow's job) is a repository-admin action. The factory's installed
GitHub App has no admin scope for this endpoint (every write attempt to this class of
setting has been structurally blocked in this environment, same finding as RG-6/ADR-007
addendum 3 for a different endpoint) — not re-attempted here since the read-side
confirmation already answers the open question (SEC-003's finding doc and
`docs/security/PRODUCTION-HARDENING.md` already recommend this exact fix; this run only
upgrades its verification status from "recommended, unverified" to "recommended,
confirmed necessary"). Already tracked in issue #33 (`needs-human`) alongside SEC-003 —
commented on that issue this run with the newly confirmed status rather than opening a
duplicate. Recommended minimum: require the `CI` workflow's status check on `main`
before merging; optionally also require a review (would need reconciling with how the
three lanes currently self-merge their own PRs — worth the owner's own call, not
defaulted here).

## Related
- Issue #33 (`needs-human`) — opened run 4, covers SEC-003 and this finding together;
  commented this run with the confirmed status.
- SEC-003 — same class of GitHub-admin-only repository setting, same owner-blocked
  status, same issue.
- `docs/security/PRODUCTION-HARDENING.md` — branch-protection row updated from
  `NOT VERIFIED` to `CONFIRMED ABSENT` this run.
- `docs/security/README.md` — A05 row, review log entry, this run.
