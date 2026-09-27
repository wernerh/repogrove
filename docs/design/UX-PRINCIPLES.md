# UX-PRINCIPLES.md

**Status:** v1, first real pass (2026-09-27, design-lane run 1). Reviewed against
`PRODUCT.md` / `docs/REQUIREMENTS.md` (owner's full spec). Everything under "ASSUMPTION"
is derived reasoning from the spec, not user research — RepoGrove has no visitors yet.
Never invent research or contact users to fill these in; only real usage data (once Phase
1+ ships and there's traffic) may move an item out of ASSUMPTION status, and that move
must cite what changed it.

## Personas (ASSUMPTION — derived from the spec, not from user research)
- **A1 — The evaluator**: a developer deciding what to use for a new project ("what's the
  open-source alternative to X"). Wants trade-offs, not a sales pitch. Arrives via search
  with high intent, often mid-decision. Bounces fast if the page reads like marketing
  copy instead of structured facts (spec §3–4: "present structured facts and trade-offs,"
  not a ranking).
- **A2 — The browser**: someone scanning what's trending/rising in a space they follow
  (AI, self-hosting, etc.) for general awareness. Lower intent, higher session length if
  hooked — scans multiple cards, follows "related Grove" links. Values a scannable card
  over a dense paragraph.
- **A3 — The newsletter reader**: wants a weekly digest, low commitment, high signal.
  Reads mostly in an email client (constrained rendering), clicks through to one or two
  items max. Everything the newsletter surfaces must also work as a cold-open landing
  page, since that's the first RepoGrove page most of this persona will ever see.

## Jobs-to-be-done (derived from spec §1, ASSUMPTION)
- "Help me find a genuinely useful project for [job]."
- "Tell me what's replacing [paid tool] in open source."
- "Tell me what's emerging before it's mainstream."
- "Tell me what happened recently with [project I already use]."

## Journeys (ASSUMPTION — one per persona, mapped to the Phase 1–3 page set)

**A1 — Evaluator, "alternative to X" journey** (spec §3–4, the "killer feature"):
search/newsletter link → `/alternative/:slug` → scans open-source / free / commercial
groupings → opens 1–3 repo pages in new tabs to compare → decision made off structured
facts (stars, activity, hosting, license), not prose alone. **Design implication:** the
alternatives table (pattern spec in `DESIGN-SYSTEM.md`) must be scannable *without*
opening a single repo page — if the table forces a click-through to compare two rows, it
has failed this persona's primary path.

**A2 — Browser, discovery journey** (spec §8, homepage "Hot Right Now"/"Rising"): lands on
homepage cold → scans card feed → clicks whatever card's one-line "why it's interesting"
hooks them → repo page → "Related Grove" link → repeats. **Design implication:** the
card's one-liner (not the description) is doing the persuasion work; it must never be a
generic scraped GitHub description (spec §29's core differentiation) or this journey's
first click never happens.

**A3 — Newsletter reader journey** (spec §12): email → 1–2 "Explore Repo" clicks → lands
mid-context on a repo page, not the homepage. **Design implication:** repo pages can't
assume the visitor has seen a Grove or the homepage first; every repo page needs enough
standalone context (what it is, why it matters, one alternative) to be a coherent landing
page on its own.

## Design principles this implies

- **Structured facts over prose-only ranking** (spec §3–4, §29) — every comparison
  (alternatives table, pros/cons) is a fact grid or list, not a single paragraph verdict.
- **Every card/chip earns its own click** — a card's hook line and a momentum chip's
  label must independently justify attention; never rely on the surrounding page context
  to explain what a badge means.
- **No dead-end pages** — per the A3 journey, a repo/Grove page reached with zero prior
  context (search, email, a shared link) must still make sense standalone.
- **Momentum without opacity** (spec §7, §23) — "why is this trending" must be
  answerable from the page itself (see `DESIGN-SYSTEM.md`'s momentum chip spec), not
  implied by a badge alone.

These will be revisited and either confirmed or revised once real usage data exists —
they are not to be treated as validated research. Next review trigger: first real traffic
after Phase 1 ships, or the first design-lane run of a new Africa/Johannesburg day per
CLAUDE.md §4 (re-read Goal/Assumptions, note what might change and what built work would
be thrown away).
