# ADR-004: Grove Heat / Momentum — v1 methodology (star growth only)

**Status:** Accepted (v1 — explicitly provisional, see "Revisit" below)
**Date:** 2026-09-29

## Context

Spec §7 wants a transparent "Heat" indicator (🔥 Rising / 🟢 Active / etc.), computed
from underlying signals and never collapsed into a single opaque score. Issue #21
proposes a broad input list: star growth rate, commit recency, release frequency,
contributor growth, issue/PR activity, GitHub-trending appearances, and external
mentions — and explicitly anticipates that some of these "would need their own
ingestion additions."

`docs/design/DESIGN-SYSTEM.md` (design lane, run 1) already specified the chip's full
visual contract ahead of any methodology existing: four states — Rising 🔥, Active 🟢,
Slowing 🟡, Dormant ⚪ — each icon + label + a reserved `momentum-*` color token (never
the generic `success`/`warning` tokens `StatusChip` uses for the unrelated editorial
`status` field), plus a requirement that "a momentum chip's underlying signals ... must
be inspectable on hover/expand, never just the badge alone." This ADR is the
methodology half of that already-specified contract.

**What `data/repogrove.db` actually contains as of this ADR** (checked directly via
`node:sqlite` before writing anything): 5 tracked repos, 3 calendar days of history each
(2026-09-27 through 2026-09-29) —
- `stars`/`forks`/`open_issues`/`watchers`: present for all 3 days, all 5 repos.
- `contributors`: present only on the most recent (2026-09-29) day for every repo — the
  column was added in a later schema migration (see ADR-005's first addendum) than the
  other columns, so no repo yet has two non-null readings to compute a real delta from.

Of issue #21's proposed inputs, that leaves **star growth rate** as the only one with
enough real history to compute today. Commit recency, release frequency, GitHub-trending
appearances, and external mentions all need new ingestion work the issue itself already
carved out as a dependency, not something this ADR can responsibly work around. Per
`CLAUDE.md` rule 4 (stub before building on unresolved dependencies; list provisional
decisions before >1 day of effort), this ADR scopes v1 to what's actually ingested and
documents the rest as a v2 extension, rather than inventing placeholder ingestion to fill
out the full input list.

## Decision

**v1 Grove Heat is computed from star growth alone**, with two additional ingested
signals (open-issues count, contributor count) exposed as supplementary, non-gating
context — never folded into the label itself, and never fabricated when not enough
history exists to compute them for real.

### Label (gates on relative star-growth rate)

`src/lib/heat.ts`'s `computeHeat(history)` reuses `getGrowthSummary` (same module
`/trending` and `/rising` already read) to get `deltaStars`/`days`/`currentStars`, then
computes a **relative, per-day** growth rate:

```
percentPerDay = (deltaStars / baselineStars) * 100 / days
```

(`baselineStars = currentStars - deltaStars`, the same zero/negative-baseline guard
`rankByRelativeGrowth` already uses.) Relative, not absolute, so the label isn't just "a
huge repo gets a bigger number" (the same §6/§8 distinction that separates `/rising` from
`/trending`); per-day, not a raw window total, so repos with a different number of
tracked days remain comparable.

That rate maps to one of the four design-system states:

| State | Threshold (`percentPerDay`) |
|---|---|
| 🔥 Rising | `>= 0.05` |
| 🟢 Active | `>= 0.02` and `< 0.05` |
| 🟡 Slowing | `> 0` and `< 0.02` |
| ⚪ Dormant | `<= 0` (flat or shrinking) |

**These thresholds are provisional, not derived from a rigorous model.** They were
picked by looking at the actual growth rates of the 5 repos tracked as of this ADR
(~0.024%–0.064%/day, all established, high-star projects — vLLM highest at ~0.064%/day,
Ollama lowest at ~0.024%/day) and choosing boundaries wide enough to produce more than
one bucket on real data, rather than every repo landing in the same one. A 5-repo, 3-day
sample is not enough to validate a threshold model against — this is a starting point to
revisit (see "Revisit" below), not a claim that 0.05%/day is the objectively correct line
between "hot" and "not."

A repo without enough history — no snapshots at all, or only one (`days === 0`, same
convention `/trending`/`/rising` use) — gets **no Heat chip at all**, never a fabricated
"Dormant." This matches the codebase's existing "omit, don't fabricate" convention for
every other not-yet-available signal (`AlternativesTable`'s unresolved slugs, `RepoCard`'s
omitted language/momentum fields). A *real* Dormant reading (actual flat/negative growth
over a real window) is shown, not hidden — same "don't exclude bad news" convention
`/trending`'s negative-growth repos already use.

### Supplementary signals (displayed, never label-gating)

`computeHeat` also returns an `open-issues` and a `contributor-growth` signal:

- **Open issues**: raw delta over the same window (`latest.openIssues - oldest.openIssues`).
  Deliberately not label-gating — a rising open-issue count can mean either growing
  attention (more people filing) or a growing unaddressed backlog, and this codebase has
  no ingested signal (issue *close* rate, PR merge rate) to disambiguate those yet. Shown
  as inspectable context, not folded into a score that would silently pick one
  interpretation.
- **Contributor growth**: reported as `available: false` / "not enough data yet" for
  every repo today, per the schema-history gap above — never a fabricated delta computed
  against a `null` baseline. Once every tracked repo has ≥2 non-null `contributors`
  readings (naturally, as daily ingestion continues), this signal starts reporting real
  deltas with no code change needed — `computeHeat`'s guard is `oldest.contributors ===
  null || latest.contributors === null`, not a hardcoded "not yet" flag.

Every signal (available or not) is returned in `HeatResult.signals`, satisfying
DESIGN-SYSTEM.md's "inspectable on hover/expand" requirement at the data layer.
`MomentumChip` (new component, mirrors `StatusChip`'s existing icon+label+color pattern)
surfaces them today via the native `title` tooltip — a real hover/expand affordance is a
UI-design decision left to the design lane, not decided on its behalf here.

**Baseline consistency:** the star-growth rate, open-issues delta, and contributor
delta must all describe the *same* time window, or the chip would silently show three
numbers computed over three different periods. `src/lib/snapshots.ts`'s `getGrowthSummary`
already picks a baseline row (oldest snapshot within 30 days of latest, or the very
first if history is shorter); this is now extracted into its own exported
`getGrowthBaseline(history)` so `computeHeat` reuses the identical row for every signal,
rather than defaulting the supplementary signals to `history[0]` (the absolute-earliest
snapshot ever) — a real bug independent review caught, since it's invisible today (every
tracked repo has ≤3 days of history, so "the earliest snapshot ever" and "the 30-day
baseline" are the same row) but would silently diverge the first time any repo
accumulates more than 30 days of history.

### Where it's wired

`/repo/[slug]` only, next to the existing `StatusChip` — the repo page already fetches
`getSnapshotHistory(repo.github)` once for the star-growth chart; `computeHeat` reuses
that same call rather than opening `data/repogrove.db` a second time (same N+1 lesson
TECH-DEBT.md's 2026-09-29 homepage row already recorded). Not wired into `/trending`,
`/rising`, or the homepage repo cards in this PR — those already show their own specific
growth figures, and adding a second momentum signal to already-shipped ranking pages is a
separate, deliberately-deferred UI decision, not folded into this scoped PR.

## Non-goals (explicitly out of scope for v1, per issue #21's own note)

- Commit recency, release frequency, GitHub-trending appearances, external
  mentions/news coverage — none are ingested; each needs its own ingestion-pipeline
  addition and, for trending/mentions, a source-licensing/attribution review (spec §11)
  before any of that work starts.
- A weighted/combined multi-signal score — deliberately not built; spec §7's own
  requirement is transparency over a single number, and v1 genuinely only has one signal
  with enough history to compute for real.

## Consequences

- v1 Heat is, honestly, close to `/rising`'s own relative-growth math with per-day
  normalization and a 4-bucket label instead of a sorted list — that's a fair criticism
  of how thin v1 is, and is recorded here rather than left implicit. The differentiator
  over `/rising` is the *labelled, threshold-based state* (matching the design system's
  already-specified visual contract) plus the supplementary signals, not a fundamentally
  different data source. v2 (below) is what makes this genuinely multi-signal.
- Threshold tuning is an open, revisitable question, not a locked decision — this ADR
  intentionally doesn't over-claim precision it can't back with data yet.
- No new ingestion, no new dependency, no schema change — this PR only reads
  `data/repogrove.db` and `content/repos/*.md` the same way `/trending`/`/rising`
  already do.

## Revisit (v2 candidates, not scoped here)

- **Contributor growth** as a real gating/secondary signal, automatically, once enough
  tracked repos have ≥2 non-null readings (no code change needed — see above).
- **Commit recency** and **release frequency**: each needs a new ingestion call
  (`GET /repos/{owner}/{repo}/commits` for the latest commit date; `GET
  /repos/{owner}/{repo}/releases` for release cadence) and schema additions to
  `repository_snapshots` or a new table — scope as its own issue once Heat v1 has been
  live long enough to know whether the star-growth-only label is actually useful.
- **Threshold recalibration** once more repos and more calendar days of history exist —
  today's 5-repo, 3-day sample is not enough to validate against, as noted above.
- **GitHub-trending appearances / external mentions**: explicitly out of scope per issue
  #21's own non-goals; would need new ingestion (a trending-page scrape or API, a
  news/mentions source) with its own licensing/attribution review (spec §11) before this
  ADR's scope could reasonably extend to cover it.
