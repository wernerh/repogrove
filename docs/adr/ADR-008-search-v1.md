# ADR-008: Search v1 — static build-time index, client-side matching

**Status:** Accepted (v1 — explicitly scoped, see "Non-goals" below)
**Date:** 2026-09-30

## Context

Spec §9 wants search to understand repository names, product names ("Datadog
alternative"), categories ("self hosted analytics"), and free-text intent ("AI
coding assistant") — not just an exact-name lookup. Issue #63 files this as Phase
3's search item, and its own "Proposed solution" already narrows the architecture
question to one thing: `output: "export"` (ADR-002/RG-2 — Azure Storage
static-website hosting, no server runtime) means there is no place to run a
server-side DB-backed full-text-search query, the approach `ARCHITECTURE.md`'s
stack section names as the initial plan ("Postgres/SQLite full-text search
initially"). That line was written before RG-2 was answered; RG-2's own answer
already flagged this exact gap as "a Phase 3 consideration."

The issue asks for a short ADR before landing, per `CLAUDE.md` rule 4 (stub/scope
an expensive-to-reverse surface before building it ad hoc) — not because this
touches the locked stack (ADR-001) or a new vendor/hosting decision (`CLAUDE.md`
rule 6's human-gate list: auth provider, data model, hosting, framework, paid
vendor, public API shape — none of those are in play here), but because "how does
search work at all under a static export" is a real architectural fork worth
writing down once, the same way ADR-004/ADR-005 scoped Grove Heat v1 and snapshot
storage without needing an owner decision.

## Decision

**Search v1 is a static, build-time-generated index, matched entirely client-side
in the browser.** No new runtime dependency, no new vendor, no server.

### Index

`src/lib/search.ts`'s `buildSearchIndex()` reads the same content-loader
functions every other page already calls — `getAllRepos()`, `getAllGroves()`,
`getAllAlternatives()` (`src/lib/content.ts`) — and returns a flat
`SearchEntry[]`: `{ type: "repo" | "grove" | "alternative", slug, title,
description, categories, url }`. `description` is a short, already-public string
per type (a repo's `firstParagraph(body)` — the same helper `RepoCard` uses,
extracted here since this is now its second real call site, matching this
codebase's established "extract on second use" convention; a Grove's own
`description` frontmatter field; an alternative's `bestFit` list rendered as
"Best for: …" via the small exported `alternativeDescription` helper, since
`Alternative` has no free-text body to pull from — `bestFit` is legitimately
optional, and an alternative without it gets an empty description rather than
a fabricated sentence, matching this codebase's "omit, don't fabricate"
convention rather than inventing prose no `/content` file actually states).
Comparisons (`content/comparisons/*.md`) are deliberately not indexed — a
comparison page is reached from either of its two repos, not searched for by its
own identity (spec §10 frames it as a repo-page perspective, not a landing page).

This index is built exactly once per build, in a React Server Component
(`src/app/search/page.tsx`), and passed as a prop to a client component
(`SearchBox`) — the same server → client data flow every framework tutorial
calls "hydration," not a hand-rolled JSON asset or a metadata-route file like
`sitemap.ts`/`robots.ts` use. Those two exist because *crawlers* fetch
`/sitemap.xml`/`/robots.txt` as their own URLs; here the only consumer is this
page's own client-side JavaScript, so embedding the data in the page's own RSC
payload (what Next.js already does for build-time `page.tsx` data) is simpler
and needs no extra network round-trip. The result is still exactly what the
issue's "Proposed solution" (a) describes — "a build-time-generated static
search index (JSON) queried client-side" — just serialized through Next's
existing RSC mechanism rather than a hand-written `public/*.json` file.

### Matching

`searchEntries(index, query)` (`src/lib/search.ts`, pure, unit-tested
independent of any component) does substring matching, case-insensitive, no
external library:

1. exact `title` match
2. `title` starts with query
3. `title` contains query
4. any `categories[]` entry contains query
5. `description` contains query

Each entry gets the *best* (lowest-numbered) tier it matches, entries that match
no tier are excluded, and results are sorted by tier then alphabetically by
title. An empty/whitespace-only query returns no results (a search page with
nothing typed shouldn't render every piece of content unranked). This is
deliberately simple — no fuzzy/typo-tolerant matching, no scoring model, no
external search library — matching issue #63's own non-goal ("semantic/AI-ranked
search" is explicitly out) and keeping v1 to what a plain substring match can
honestly deliver: real name and category matches, which is the acceptance
criterion.

**A real build failure this PR hit, found by CI, not this sandbox:** the module
holding `searchEntries` originally also held `buildSearchIndex` (and therefore
imported `content.ts`, which imports `node:fs`). `SearchBox.tsx` (a Client
Component) importing `searchEntries` from that same module pulled `node:fs`
into the client-bundle import graph too — even though `searchEntries` itself
never calls it — and Turbopack's static-export build fails outright rather
than tree-shaking it away ("the chunking context (unknown) does not support
external modules (request: node:fs)"). Fixed by splitting the pure matching
half into its own module, `src/lib/search-match.ts` (`searchEntries`, the
`SearchEntry`/`SearchEntryType` types — zero import from `content.ts`), which
`SearchBox.tsx` imports directly; `src/lib/search.ts` keeps `buildSearchIndex`
(server-only, needs `content.ts`) and re-exports the matching half for
server-side/test convenience. This is the same category of static-export-only
failure mode `robots.ts`/`sitemap.ts` already hit with `force-static` (see
those files' doc comments) — a build-time constraint this sandbox's own
`next build` can't reproduce locally (it never gets past the ADR-006
font-fetch gap), so CI is genuinely the only place this class of bug surfaces.

### Where it's wired

New `/search` route (`src/app/search/page.tsx` + `src/components/SearchBox.tsx`,
a client component for the input/results interactivity `output: "export"` still
allows — static export restricts *data fetching*, not client-side React state).
Header nav (`src/app/layout.tsx`) gains a "Search" link alongside Trending/
Rising. A search bar embedded directly on the homepage (spec §9's mockup) is a
separate, design-owned homepage layout decision — out of scope for this PR,
which focuses on the search mechanism itself existing and working at all.

### Security

The index is built from `getAllRepos()`/`getAllGroves()`/`getAllAlternatives()`
only — the same public `/content` Markdown every existing page already renders.
No `data/repogrove.db` field, no volatile/computed data, and nothing beyond what
`/repo/[slug]`, `/grove/[slug]`, and `/alternative/[slug]` already expose ships
in the index, satisfying issue #63's own security note.

## Non-goals (v1)

- Semantic/AI-ranked search, typo tolerance, fuzzy matching — issue #63's own
  non-goal; a plain substring match is what "real name/category matches" needs
  and no more.
- A hosted search service (Typesense/Meilisearch) — explicitly deferred past MVP
  per `ARCHITECTURE.md`; would also be a new paid-vendor decision (`CLAUDE.md`
  rule 6 human gate), not something this ADR can decide unilaterally even if it
  wanted to.
- Free-text *intent* search ("AI coding assistant", "self hosted Zapier") — spec
  §9's fuller ambition. Substring matching against `category`/`description`
  gets partway there today (e.g. "self hosted" matches repos categorized or
  described that way) but doesn't understand intent as such; a real intent layer
  needs either a curated synonym/intent-tag system (an editorial-content
  addition, not an architecture change) or the semantic search this ADR
  explicitly defers.
- Indexing `content/comparisons/*.md` — see "Index" above.
- A homepage search bar — design/layout decision, left to a future PR.

## Consequences

- Every new `content/repos|groves|alternatives/*.md` file is automatically
  searchable with no code change (same "derived from the content loader, not a
  second hand-maintained list" property `sitemap.ts` already established for
  routes).
- The entire index ships to the client on `/search`'s first load (today: 5
  repos + 2 Groves + 1 alternative — trivially small). This doesn't scale
  indefinitely; revisit (see below) once the content set is large enough that
  shipping the whole index becomes a real payload-size concern.
- No new dependency, no new vendor, no schema change, no ingestion change —
  this PR only reads `/content` the same way every other page does.

## Revisit (v2 candidates, not scoped here)

- **Payload size**: once `/content` grows enough that shipping the full index
  client-side is wasteful, revisit either code-splitting the index by type or
  moving to a real search service — at that point the Azure Static Web
  Apps/Functions path RG-2's answer already flagged becomes the relevant
  architecture question, not a decision to make speculatively now.
- **Intent/synonym search**: a curated `intent:` or `synonyms:` frontmatter
  field per content file (editorial, PR-reviewed, consistent with `CLAUDE.md`
  rule 4's "no raw scraping" spirit) could get closer to spec §9's fuller
  ambition without needing semantic search at all.
- **Homepage search bar**: wire `SearchBox` (or a trimmed variant) into
  `src/app/page.tsx` once the design lane has a homepage layout opinion — the
  component itself doesn't need to change to support this.
