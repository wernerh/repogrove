# SEC-003 — GitHub Dependabot security alerts are disabled on the repository

- **Status: OPEN, owner-blocked** (repo-admin setting; the factory's GitHub App token
  cannot read or change it — see Evidence). **Verified: yes** — GitHub's own API
  confirms the setting is off; not a proxy artifact.
- **Severity:** LOW (defense-in-depth gap; existing controls already cover the same
  ground on a schedule rather than in real time — see Impact)
- **Summary:** `GET /repos/wernerh/repogrove/dependabot/alerts` returns "Dependabot
  alerts are disabled for this repository." This is the real-time vulnerability-alert
  feature (a new CVE against a dependency version already in `package-lock.json`
  triggers an alert immediately), distinct from the `dependabot.yml`-driven
  version-update PRs already running (#28, #29, #30 open on `main` today) and from CI's
  own `npm audit --audit-level=high` job — both of those only catch a newly-published
  CVE the next time they run (weekly / per-push), not the moment it's published.

## Component
Repository security settings (`wernerh/repogrove`, GitHub-hosted, not a file in this
repo) — repository-controlled infra, in scope per this lane's brief, but not something
`check.py` or any file-based reviewer can see.

## OWASP mapping
A06:2021 – Vulnerable and Outdated Components. A06 stays **PASS** in
`docs/security/README.md` — `npm audit` is clean (0 vulnerabilities) and CI gates on it
— this finding is an added layer, not a hole in that pass.

## How this was found
Part of this run's review of new attack surface (PR #31 star-growth chart, PR #32
self-hosted fonts — both clean, no findings) plus a routine check of GitHub-side
repository security settings while re-verifying SEC-001/SEC-002. Also checked
`GET /repos/.../secret-scanning/alerts` and `GET /repos/.../vulnerability-alerts`
(the toggle endpoint) — both blocked by this environment's own outbound proxy
(`"Access to this GitHub API path is not permitted through this proxy"`), so their
state is NOT VERIFIED, not confirmed-off; only the Dependabot alerts finding above is a
confirmed GitHub-side answer, not a proxy limitation.

## Evidence
```
$ curl .../repos/wernerh/repogrove/dependabot/alerts?state=open
{"message":"Dependabot alerts are disabled for this repository.", ...}

$ curl -X PUT .../repos/wernerh/repogrove/vulnerability-alerts   # the enable toggle
{"message":"Access to this GitHub API path is not permitted through this proxy.", ...}
```
The first response is from GitHub itself (matches GitHub's documented error text for
this exact state); the second is this sandbox's own egress proxy refusing the path
before it ever reaches GitHub — so GitHub's real answer to that request (whether the
installed GitHub App even carries admin scope for this endpoint) was never observed,
unlike the genuinely-confirmed disabled-alerts finding above. Either way the practical
outcome is the same: the factory has no path to enable this setting from here, whether
the blocker turns out to be scope, the proxy, or both.

## Impact
- Public repo, no npm-vulnerability findings today (`npm audit` clean). Existing nets
  (weekly Dependabot version-update PRs, `npm audit --audit-level=high` in CI on every
  push/PR) already catch the same class of issue, just not immediately on CVE
  publication — this is closing that timing gap, not covering an otherwise-uncovered
  class of risk.
- Grows in value as the dependency surface grows (Phase 3 adds a real API surface per
  `docs/WORKPLAN.md`) and is free/zero-config to enable — worth doing regardless of
  urgency.

## Fix
Not fixable by this lane: `Settings → Code security → Dependabot alerts → Enable` is
normally a repository-admin action, and this sandbox's own egress proxy blocks the
enabling endpoint (`PUT /vulnerability-alerts`) before it even reaches GitHub — so
whether the installed GitHub App additionally lacks admin scope for it was never
directly tested, only presumed. Either way the practical result is the same: no path
to enable it from here. Recommending to the owner via issue #33 (`needs-human`, opened
this run, also covers the pre-existing branch-protection recommendation) rather than
the `.factory/decisions.yaml` owner-decision protocol, since this isn't a decision with
options/reversibility to weigh — it's a single toggle with no downside.

## Related
- `docs/security/PRODUCTION-HARDENING.md` — new checklist row, grouped with the
  existing branch-protection row (same class of GitHub-admin-only setting the factory
  can recommend but not verify or enable)
- `docs/security/README.md` — A06 review log entry, this run
