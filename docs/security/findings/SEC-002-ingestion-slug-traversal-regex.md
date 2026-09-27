# SEC-002 — Ingestion `GITHUB_SLUG_PATTERN` owner-segment guard was dead code

- **Status:** FIXED (this run) — VERIFIED same run (regression tests added and passing;
  see verification note below)
- **Severity:** LOW (real validation bypass, narrow blast radius — see Impact)
- **Summary:** `scripts/ingestion/fetch-snapshots.mjs`'s allowlist regex for the
  `github: owner/name` frontmatter field was supposed to reject a bare `.`/`..` on
  either side of the slash (per its own code comment), but the owner-segment lookahead
  was unreachable and never actually rejected anything. `github: ../rate_limit` (and
  `./name`) passed validation and produced a same-host, path-traversal-shaped request.

## Component
`scripts/ingestion/fetch-snapshots.mjs` (`GITHUB_SLUG_PATTERN`, used by
`readGithubSlugsFromContent`, which feeds `fetchRepoMetrics`'s URL construction).

## OWASP mapping
A10:2021 – Server-Side Request Forgery (the allowlist this bug lived in; see Impact for
why this isn't a full SSRF).

## How this was found
Not found by the security lane's own first pass — found by an independent reviewer
subagent asked to skeptically critique this run's SEC-001 PR (per CLAUDE.md §9 / this
prompt's step 7, "an independent reviewer subagent critiques the change... looking for
bypasses, incomplete fixes"). The security lane's own A10 review had read the same code
comment the regex carries and taken its claim at face value without re-deriving the
regex's actual behaviour. Recorded here as a reminder that a docstring/comment
asserting a security property is not evidence the property holds — verify the claim
against the code (or a test), which is exactly what surfaced this.

## Evidence
Old pattern: `/^(?!\.{1,2}$)[\w.-]+\/(?!\.{1,2}$)[\w.-]+$/`

```
node -e '
const P = /^(?!\.{1,2}$)[\w.-]+\/(?!\.{1,2}$)[\w.-]+$/;
console.log(P.test("../rate_limit")); // true — should be false
console.log(P.test("./name"));        // true — should be false
console.log(P.test("owner/.."));      // false — this side worked
'
```

The leading `(?!\.{1,2}$)` lookahead anchors `$` to the end of the *entire* matched
string. Because a mandatory `/name` always follows the owner segment, that end-of-string
position is never reached while checking the owner segment alone — the lookahead can
never fire there. Only the *name* segment's identical-looking lookahead worked, because
it sits immediately before the real `$`.

`new URL("https://api.github.com/repos/../rate_limit").pathname` → `/rate_limit`,
confirming the bypass turns into a real same-host path change, not just a cosmetic
regex miss.

## Impact
- The ingestion job's `GITHUB_TOKEN` (raises rate limit only, no elevated scope — see
  `.github/workflows/ingestion.yml`) could be made to hit an arbitrary single-segment
  `api.github.com` path (e.g. `/rate_limit`, `/zen`, `/repos` itself) instead of the
  intended `/repos/owner/name`. No way to reach a different host (the base URL is
  hardcoded), and no known two-segment-traversal path takes this past `api.github.com`
  itself.
- Blast radius is narrow because `github:` values only reach this code from
  `/content/repos/*.md` frontmatter, which per CLAUDE.md rule 4 only lands via PR + CI
  review — the same trust boundary as any other content change already trusted with
  repo write access. This is a defense-in-depth gap, not an externally-reachable
  vulnerability today.

## Fix
New pattern: `/^(?!\.{1,2}\/)[\w.-]+\/(?!\.{1,2}$)[\w.-]+$/` — the owner-segment guard
now checks for a bare dot-segment immediately followed by `/` (its own real boundary),
rather than sharing the name segment's end-of-string anchor.

Verified:
- `../rate_limit`, `./name` → rejected (previously accepted)
- `owner/..`, `owner/.`, `..` alone → still rejected (unchanged, already worked)
- `ollama/ollama`, `some.owner/some.repo-name_v2` (dots that aren't a bare dot-segment)
  → still accepted (unchanged)

Regression tests: `tests/ingestion/fetch-snapshots.test.ts` — "rejects a bare-dot-segment
OWNER slug (e.g. '../rate_limit'), not just a bare-dot name" and "still accepts a real
owner/name slug that merely contains dots". Both pass; the first was confirmed to fail
against the pre-fix regex before the fix was applied (TDD — failing test written first).

## Related
- SEC-001 (same run) — the CI-permissions finding whose PR this fix rides along with;
  found by the same independent-review pass.
- `docs/security/README.md` — A10 row
