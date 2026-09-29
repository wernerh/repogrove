# ARCHITECTURE.md — RepoGrove

## Summary
Hybrid architecture (spec §17), chosen over a pure database (Option A) or pure
Git-as-CMS (Option B):

- **Git repository owns editorial content**: Grove definitions, repository write-ups,
  comparisons, pros/cons, curated relationships, newsletter drafts. Every change is a
  commit with author, diff, and review. This is deliberate — it makes the editorial
  layer the part that's hardest to get wrong, and the part most worth version-controlling.
- **Database owns volatile/computed data**: GitHub metrics, historical star snapshots,
  news ingestion cache, search index, computed momentum/"Heat" scores. This data changes
  too often and too mechanically to belong in Git history.

```
GitHub API ──▶ scheduled ingestion (GitHub Actions) ──▶ SQLite/Postgres (metrics)
Markdown (/content, PR-reviewed) ────────────────────▶ Next.js (build/runtime read)
                                    Next.js ──▶ RepoGrove.com
```

## Stack (ADR-001)
- **Frontend:** Next.js / React / TypeScript
- **Styling:** Tailwind CSS
- **Content:** Markdown/MDX under `/content`, Git-versioned
- **Database:** SQLite pre-launch, PostgreSQL when scale/hosting is decided
- **Search:** Postgres/SQLite full-text search initially; Typesense/Meilisearch is a
  Phase 2+ option, not MVP
- **Data source:** GitHub REST/GraphQL API
- **Scheduled jobs:** GitHub Actions (ingestion), moving to dedicated workers only if
  GitHub Actions can't keep up
- **Deployment:** undecided (ADR-002) — Cloudflare + a modern cloud host is the stated
  target once the owner provisions an account
- **Analytics:** privacy-conscious (no third-party ad-tracking pixels); provider TBD via
  ADR when Phase 3 needs it

## Repository layout
```
/agents      — agent role definitions / prompts (discovery, classification, research,
               editorial, SEO, newsletter — see spec §19). Design-time docs, not runtime
               secrets.
/content     — the Git-native content database: /groves, /repos, /alternatives,
               /comparisons (Markdown + YAML frontmatter)
/data        — ingestion output that is safe to commit (e.g. seed fixtures), NOT live
               scrape dumps or real metrics history (that's DB-only)
/docs        — product, architecture, ADRs, factory process, security, design
/src         — the Next.js application
/tests       — automated tests
/feedback    — community/owner feedback logs, retro notes
.factory     — factory run state (state.yaml) and the owner-decision register
               (decisions.yaml)
scripts/factory — guard-rail checker and dashboard metrics generator
```

## Content schema (Git side)
`content/repos/<name-slug>.md` frontmatter (filename is the kebab-case repo-name slug,
not `owner-name` — matches `CLAUDE.md`'s naming convention; the GitHub `owner/name` is
recorded in the `github:` frontmatter field below, which is what disambiguates two
different-owner repos that happen to share a name):
```yaml
github: ollama/ollama
name: Ollama
category: [ai, llm]
license: MIT
status: active        # active | maintained | inactive
featured: false
groves: [ai, developer-tools]
alternatives:
  open_source: [lm-studio, localai, vllm]
  commercial: []
```
Body: `## What it does`, `## Why people use it`, `## Pros`, `## Cons`. This is exactly
the shape described in spec §5 and §16.

`content/groves/<slug>.md` frontmatter: `name`, `description`, `related_groves`. Body is
free-form curatorial copy (spec §25).

`content/alternatives/<slug>.md` — a paid-product page (e.g. `notion.md`): frontmatter
`product`, `category`; body sections `Open source`, `Free`, `Commercial`, `Best fit`
(spec §4).

`content/comparisons/<a>-vs-<b>.md` — a hand-curated `/compare/:a/:b` page (spec §10,
§14; issue #62; schema'd 2026-09-29). Frontmatter `repos: [<a-slug>, <b-slug>]`, exactly
two `content/repos/*.md` slugs, in the order the page renders them (`/compare/a/b` and
`/compare/b/a` both resolve to this file — see `getComparison`). Body: one required
`## How they differ` section (free-form prose) — the one thing about a comparison that
can't be computed from either repo's own data. Every structured fact the page shows
(stars, license, status/momentum, category, pros/cons) is reused at render time from
`getRepo`/`getGrowthSummaries`/`computeHeat` and each repo's own `## Pros`/`## Cons`
body sections, never re-derived or re-typed into the comparison file itself. Deliberately
not auto-generated for every repo pair (spec §14: "every page must provide unique useful
information") — one file per pair, PR-reviewed like every other editorial relationship.

## Database schema (volatile side, spec §15 Option A entities)
`Repository`, `RepositorySnapshot` (time series for star/fork/issue/contributor counts —
this is how star-growth charts and "Rising" are computed), `Grove`, `RepositoryGrove`
(join table — note: the curated Grove *membership decision* lives in the content
frontmatter above; this table is a denormalised, ingestion-refreshed mirror of it for
query performance), `Alternative` (denormalised mirror of content-declared
relationships, for the same reason), `NewsItem`.

Rule: **the content repo's frontmatter is the source of truth for editorial
relationships** (which repos are in which Grove, what's an alternative to what). The
database mirrors them for fast queries; it never becomes the authority. Ingestion jobs
that touch `RepositorySnapshot`/`NewsItem` are the only writers of purely computed data.

## Momentum / "Grove Heat"
Computed, not stored as an opaque score — see `docs/adr/ADR-004-momentum-methodology.md`
once written. Inputs: star growth rate, commit recency, release frequency, contributor
growth, issue/PR activity, GitHub-trending appearances, external mentions. Output is a
labelled state (🔥 Rising / 🟢 Active / etc.) plus the underlying numbers, always shown
together (spec §7).

## Autonomous pipeline compatibility (spec §19–20)
Agents propose changes as PRs (`feat: add Ollama to AI Grove`, `content: update Supabase
alternatives`, `data: refresh repository metrics`). CI validates. Nothing an agent writes
is live until merged. This is enforced by the factory rules in `CLAUDE.md`, not by
anything special in the app code.

## What's explicitly deferred
Auth, payments, admin CMS, elaborate recommender, heavy crawler infra, dedicated
search service, worker infra beyond GitHub Actions — see `PROJECT_STATE.md` "Not doing"
and `docs/WORKPLAN.md` phase gates.
