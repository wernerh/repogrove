# PRODUCT.md — RepoGrove

## Vision
RepoGrove is a curated map of the open-source ecosystem. GitHub has millions of
repositories; finding the genuinely useful ones — and knowing what to use instead of a
given tool — is hard. RepoGrove answers: what's hot right now, what's rising before it's
mainstream, what's the open-source alternative to this paid product, and "what happened
recently with this project?"

It sits between GitHub Trending, Product Hunt, AlternativeTo, Awesome Lists, and a curated
tech newsletter — but with its own data model and its own voice.

## Differentiation
Not another scraped directory. The value is **discovery + context + comparison +
momentum + editorial curation**. A visitor should leave a page knowing what a project is,
whether it's active, what else exists, and why they should care. Every generated page must
add unique information — no thin programmatic-SEO pages.

## Core concepts
- **Grove** — a curated collection of repos around a problem/technology/category
  (e.g. AI, Databases, Self-Hosted, Developer Tools, Observability).
- **Repository page** — richer than GitHub's own page: at-a-glance stats, plain-English
  "what it does" / "why people use it", pros/cons, alternatives, similar projects, related
  Grove.
- **Alternatives** — every repo/product page answers "what else could I use?" with
  open-source alternatives (table: stars/language/activity/hosting), commercial
  alternatives, and similar repositories — structured facts and trade-offs, not a global
  ranking.
- **Paid → open-source alternative pages** (`/alternative/notion`) — likely the strongest
  SEO/product feature.
- **Momentum / "Grove Heat"** — transparent, documented signals (star growth, commit
  recency, release frequency, contributor growth, issue/PR activity) surfaced as
  "🔥 Rising" / "🟢 Active", never a single opaque score.
- **"Why is this trending?"** — converts raw activity into a stated reason, not just a
  rank number.
- **Newsletter — RepoGrove Weekly** — 10 open-source projects worth knowing about, drafted
  by an editorial process, never auto-sent.

## MVP scope (spec §30)
Homepage · search · repository pages · Grove pages · GitHub star metrics · trending ·
rising · alternatives · pros/cons · related repos · basic news · newsletter signup ·
Git-native Markdown content · automated GitHub ingestion · basic SEO metadata · sitemap ·
OpenGraph cards.

**Explicitly not MVP:** accounts, paid subscriptions, enterprise dashboards, elaborate
recommendation engines, heavy crawling infra, admin CMS.

## Phase 2 / Phase 3
Phase 2: historical charts, alerts/watchlists, richer alternatives, comparison pages,
better news aggregation, community submissions, newsletter automation, discovery agents,
API. Phase 3: RepoGrove Pro, B2B intelligence, ecosystem monitoring, premium newsletters,
sponsored discovery.

## Success metrics
Discovery (visitors, searches, page views), Engagement (pages/session, alternative
clicks, GitHub outbound clicks, signup rate), Audience (subscribers, growth, returning
visitors), Commercial (sponsorship, affiliate, premium, API revenue — Phase 3+). North
star: **are people discovering projects they didn't already know about?**

## Monetisation (not for MVP)
Newsletter sponsorship, sponsored Grove placement (clearly labelled), developer-tooling
affiliate revenue, RepoGrove Pro, B2B ecosystem-monitoring, API. Do not monetise
aggressively before there's an audience.

## Brand
Domain (target, not yet provisioned): repogrove.com. Positioning: "Explore the
open-source ecosystem" / "A map of open source." Light in-house terminology (Grove, Hot,
Rising, Neighbours) — normal language stays dominant for SEO/usability; don't overdo it.

Full original product spec (verbatim, as supplied by the owner) is preserved for
reference in `docs/REQUIREMENTS.md`.
