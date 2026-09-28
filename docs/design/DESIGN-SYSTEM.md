# DESIGN-SYSTEM.md

**Status:** v1.1 — tokens (color, type scale, radius, elevation, motion) are wired into
code as of 2026-09-28, in `src/app/globals.css`'s Tailwind v4 `@theme`/`@theme inline`
blocks (Tailwind v4 has no `tailwind.config.js` `theme.extend`; config is CSS-first —
the values below are ported verbatim into that file's custom properties instead). The
four Phase 1 pages (`layout.tsx`, `page.tsx`, `repo/[slug]/page.tsx`,
`grove/[slug]/page.tsx`) were restyled to consume the new semantic classes
(`bg-bg-default`, `text-text-link`, `font-serif`, etc.) instead of raw Tailwind defaults
(`zinc-*`, `emerald-700`). Screenshotted light + dark, desktop/tablet/mobile with
Playwright (at the time, globally installed, not yet a project dependency — as of
2026-09-28 this is now a reusable, checked-in harness, see "Open questions" below and
`docs/adr/ADR-007-design-screenshot-a11y-harness.md`) before merging. **Not yet wired:**
the actual Inter/Source Serif 4/IBM Plex Mono
font *files* — `next/font` loading is explicitly dev-lane work per this doc's Typography
section (needs an ADR note); the fallback stacks (system sans/serif/mono) are live now
and already produce the correct visual hierarchy (sans UI chrome, serif prose, mono
slugs/stats), so this is a swap-in-place upgrade, not a blocker.

Working assumption while no UI exists to test against: values here are derived from
documented design method (`design-superpowers:creative` — Palette Architect, Typography
Director, Layout Strategist) applied to this product's brief, not from user testing.
Revisit once Phase 1 pages exist and can be screenshotted (see `UX-PRINCIPLES.md` for the
open-question log on this).

## Visual direction (RG-4)

Owner question RG-4 (`.factory/decisions.yaml`) — editorial/content-forward vs.
directory/marketplace-dense — is still **OPEN**, no reply from whurter5@gmail.com as of
this run (checked 2026-09-27; auto-defaults 2026-09-30 if unanswered). Everything below
proceeds on the recommended default, **editorial/content-forward**, which is cheap to
reverse: swapping density/tone later is a token-value change, not a rebuild.

**Theme statement:** *structured, trustworthy, technical-editorial.*

Rationale: RepoGrove's two governing references (`style-contexts.csv`) are in tension by
design — **News Editorial Publishing** (grid discipline and typographic hierarchy read as
authority; serif/sans pairing for long-form credibility) for the "map of open source"
editorial voice, and **Developer Tools Technical B2B** (cool neutral base, monospace
accents signal built-by-engineers, engineer audiences reward perceived competence over
warmth) for the fact that every reader is a developer evaluating a technical decision.
Blending them (serif for long-form editorial content, grotesque sans for UI chrome,
monospace for stats/dates/code) is what keeps RepoGrove from reading as either a GitHub
clone or a content-marketing blog. Avoided per both contexts' AVOID lists: claymorphism,
neon/Y2K, playful maximalism, script type, heavy skeuomorphism.

## Color

Generated in OKLCH (perceptually uniform steps), validated against WCAG 2.1 contrast
requirements programmatically — see `docs/design/tokens/generate_palette.py`, committed
in this PR, not eyeballed. Three layers, never mixed: **primitive** (raw scale step) →
**semantic** (role) → **component** (what a component actually references). Components
must only ever reference semantic tokens, never a raw `neutral-40` or a hex value
directly.

Both scales below use the full 11-/9-step convention from the method this doc follows
even though only a subset is referenced elsewhere in this doc today (e.g. `brand-80`/
`brand-90` are marked "rarely used"). That's deliberate headroom, not padding: a
9-step brand scale is the minimum the method recommends for reliable hover/active/
disabled derivations later, and regenerating a scale after the fact (once real
components depend on specific steps) is a breaking token change — cheaper to have the
full ramp now, when nothing yet depends on it, than to insert a step later.

### Neutral scale (hue 220 — cool, near-desaturated)

| Token | OKLCH | Hex |
|---|---|---|
| `neutral-0` | oklch(99% 0.001 220) | `#fbfcfc` |
| `neutral-10` | oklch(96% 0.003 220) | `#f0f2f3` |
| `neutral-20` | oklch(91% 0.004 220) | `#dee2e3` |
| `neutral-30` | oklch(84% 0.006 220) | `#c6cbcd` |
| `neutral-40` | oklch(74% 0.008 220) | `#a6acae` |
| `neutral-50` | oklch(62% 0.010 220) | `#80888a` |
| `neutral-60` | oklch(50% 0.010 220) | `#5d6567` |
| `neutral-70` | oklch(40% 0.009 220) | `#43494b` |
| `neutral-80` | oklch(30% 0.008 220) | `#2a2f31` |
| `neutral-90` | oklch(20% 0.006 220) | `#131718` |
| `neutral-100` | oklch(12% 0.004 220) | `#050607` |

### Brand scale (hue 205 — "deep pond" blue-teal)

Deliberately not literal foliage-green (avoids the "Sustainability/Eco" cliché the
`style-contexts.csv` AVOID list warns off, and avoids reading as a slow-living wellness
brand) and not GitHub's blue (`#0969da`, hue ~255) — a distinct, cooler, deeper teal so
RepoGrove reads as its own product per spec §29, with a quiet nod to "Grove" without an
illustrated leaf anywhere.

| Token | OKLCH | Hex | Typical use |
|---|---|---|---|
| `brand-10` | oklch(95% 0.03 205) | `#d8f5f8` | tinted surfaces (selected row, info banner bg) |
| `brand-20` | oklch(88% 0.05 205) | `#b2e2e7` | hover surface on brand-tinted components |
| `brand-30` | oklch(80% 0.07 205) | `#86cbd3` | dark-mode link/accent text |
| `brand-40` | oklch(70% 0.10 205) | `#41b0bc` | dark-mode CTA fill |
| `brand-50` | oklch(58% 0.13 205) | `#008b96` | key hue — illustrative reference, rarely used raw |
| `brand-60` | oklch(48% 0.13 205) | `#006b74` | **primary CTA fill (light mode)**, active nav indicator |
| `brand-70` | oklch(38% 0.11 205) | `#004c53` | CTA hover/active, link text on light bg |
| `brand-80` | oklch(28% 0.09 205) | `#002f34` | rarely used — high-emphasis dark accents |
| `brand-90` | oklch(18% 0.06 205) | `#001518` | rarely used |

### Semantic colors

Each has a **text** value, independently solved and validated ≥4.5:1 **in both themes**
(light text against `bg.default` light = `neutral-0`; dark text against `bg.default` dark
= `neutral-90` — not the same hex reused across themes, which would fail: see "Reproducing
these numbers" below for what happens if you naively reuse the light value in dark mode).
Each also has a **surface** value (tinted background, decorative only — never the sole
carrier of meaning; always paired with an icon and a text label per WCAG 2.1 SC 1.4.1,
"Use of Color").

| Role | Text — light (on `neutral-0`) | Text — dark (on `neutral-90`) | Surface (light) |
|---|---|---|---|
| `success` | `#00791e` (oklch 50% 0.16 145) — 5.44:1 | `#399341` (oklch 59% 0.147 145) — 4.66:1 | `neutral-0` + tint at hue 145, 95% L |
| `warning` | `#986600` (oklch 55% 0.16 75) — 4.82:1 | `#af7600` (oklch 61% 0.147 75) — 4.65:1 | same method, hue 75 |
| `error` | `#ba2b2e` (oklch 52% 0.18 25) — 5.88:1 | `#db5853` (oklch 63% 0.166 25) — 4.76:1 | same method, hue 25 |
| `info` | `#0070a6` (oklch 52% 0.14 240) — 5.28:1 | `#1c89c5` (oklch 60% 0.129 240) — 4.67:1 | same method, hue 240 |

Colorblind check: success (green, hue 145) and error (red, hue 25) are never the *only*
distinguishing signal between two adjacent states in the same view (e.g. a pass/fail pair)
— always paired with a distinct icon shape (✓ / ✕) and a text label, not color alone.

### Momentum / "Heat" (spec §7, §23 — product-specific, not a generic semantic color)

Never a single opaque score. Four documented states, each **icon + label + color**, color
never sole signal. Text color independently solved per theme, same method as semantic
colors above (not a reused light-mode hex):

| State | Icon | Label | Text — light (on `neutral-0`) | Text — dark (on `neutral-90`) |
|---|---|---|---|---|
| Rising | 🔥 | "Rising" | `#b84b00` (oklch 55% 0.17 45) — 5.05:1 | `#d06127` (oklch 62% 0.156 45) — 4.66:1 |
| Active | 🟢 | "Active" | `#006818` (oklch 45% 0.15 145) — 6.83:1 | `#3f9246` (oklch 59% 0.138 145) — 4.65:1 |
| Slowing | 🟡 | "Slowing" | `#986600` (oklch 55% 0.16 75) — 4.82:1 (shares `warning`'s hue — both mean "caution/deceleration", intentional) | `#af7600` — 4.65:1 |
| Dormant | ⚪ | "Dormant" | `neutral-60` `#5d6567` — 5.80:1 | `neutral-40` `#a6acae` — 7.85:1 |

A momentum chip's underlying signals (star growth, commit recency, release frequency,
etc. — spec §7) must be inspectable on hover/expand, never just the badge alone — this is
a UX requirement, not just a color one; file as a dev-lane dependency when repo pages are
built (methodology itself is dev/data-lane work, this doc only owns the chip's visual
contract).

### Borders (semantic, not a neutral-scale alias)

`border.default` needs to clear WCAG's 3:1 **UI component** contrast minimum against
`bg.default`, which `neutral-30`/`neutral-40` do not (1.59:1 / 2.24:1 measured) — use
`neutral-50` (3.52:1) instead. `border.subtle` (decorative dividers, e.g. table row
separators) can use `neutral-20`/`neutral-30` since it's reinforced by spacing, never the
sole boundary signal for an interactive element.

| Token | Light | Dark |
|---|---|---|
| `border.default` (inputs, focus-adjacent, card outlines) | `neutral-50` (3.52:1 on `neutral-0`) | `neutral-60` (3.03:1 on `neutral-90`) |
| `border.subtle` (dividers, table rows) | `neutral-20` | `neutral-70` |

### Surfaces & text (semantic layer)

Every contrast ratio below is measured against **that row's own theme** — the light
column's ratio is against light `bg.default` (`neutral-0` / `#fbfcfc`), the dark column's
against dark `bg.default` (`neutral-90` / `#131718`), never mixed across themes.

| Token | Light | Dark |
|---|---|---|
| `bg.default` | `neutral-0` (`#fbfcfc`) | `neutral-90` (`#131718`) |
| `bg.subtle` (page background behind cards) | `neutral-10` | `neutral-100` |
| `bg.elevated` (cards, popovers) | `neutral-0` | `neutral-80` (stacks *upward* in dark mode per convention — elevated = lighter, not darker) |
| `text.default` | `neutral-90`, 17.56:1 vs. light `bg.default` | `neutral-10`, 16.07:1 vs. dark `bg.default` |
| `text.secondary` | `neutral-60`, 5.80:1 vs. light `bg.default` | `neutral-40`, 7.85:1 vs. dark `bg.default` |
| `text.link` / `text.brand` | `brand-70`, 9.47:1 vs. light `bg.default` | `brand-30`, 9.88:1 vs. dark `bg.default` |
| `cta.fill` | `brand-60` fill, white text, 6.26:1 | `brand-40` fill, `neutral-90` (dark) text, 7.01:1 — white text would fail on this lighter dark-mode fill, so the CTA text flips to dark, not white |
| `cta.fill.hover` | `brand-70` fill, white text, 9.73:1 | `brand-30` fill, `neutral-90` text |

Dark mode is a second theme remapping semantics to different primitive steps — primitives
themselves never change (per method: invert lightness, preserve hue, reduce chroma
slightly at dark surfaces, elevate *lighter* not darker).

## Typography

**Pairing — "Technical / precise" base, with one editorial exception for long-form
prose**, per the blended theme statement above:

- **UI / chrome / labels / tables / nav:** Inter (variable, SIL OFL, free) — geometric
  grotesque, the "built by engineers" signal `Developer Tools Technical B2B` calls for.
  Fallback stack: `Inter, "Helvetica Neue", Arial, sans-serif`.
- **Long-form editorial prose only** (Grove essays, repo "why it matters"/pros-cons
  write-ups, newsletter body) — Source Serif 4 (SIL OFL, free, pairs cleanly with Inter's
  x-height) for the credibility/authority signal `News Editorial Publishing` calls for,
  and to visually mark "this is curated editorial content" vs. "this is UI chrome" as the
  reader scans a page. Fallback stack: `"Source Serif 4", Georgia, "Times New Roman",
  serif`.
- **Stats, dates, star counts, code, repo slugs:** IBM Plex Mono (SIL OFL, free) — used
  sparingly, as texture/precision signal, never for body paragraphs.
- All three are open-license and free — no paid-vendor decision needed. Load via
  `next/font` (self-hosted at build time, ships with Next.js, not an added runtime
  dependency and not a CDN request) once the app exists — that's still "a web font," so
  per CLAUDE.md §6/rule 7 the dev lane should add a one-line ADR note (append to
  ADR-001 or a short ADR-005) when wiring this in, naming the three faces and the
  self-hosted/no-CDN method.

**Scale:** ratio 1.25 ("Major Third" — editorial-leaning product, matches the blended
tone), base 16px.

`text-xs` sits below the practical legibility floor most style guides hold to for content
a user actually needs to read. It stays in the scale (kept for the rare case of a purely
decorative micro-label, e.g. a "sponsored" tag) but is scoped narrowly: **informational
content never uses it.** Star counts, dates, and repo slugs — RepoGrove's actual
"smallest-tier" content — use `text-sm` instead, not `text-xs`, precisely because they're
informational, not decorative.

| Token | Size (px / rem) | Role | Line height | Letter spacing |
|---|---|---|---|---|
| `text-xs` | 10px / 0.625rem | **decorative-only** micro-labels (e.g. a "sponsored" tag) — never metadata a user needs to read | 1.4 | +0.05em if all-caps |
| `text-sm` | 13px / 0.8125rem | secondary body, helper text, table cells, **and all metadata** (star counts, dates, repo slugs — mono) | 1.5 | 0 |
| `text-base` | 16px / 1rem | primary body copy | 1.6 (serif prose) / 1.5 (sans UI) | 0 |
| `text-lg` | 20px / 1.25rem | card intros, lead paragraph | 1.5 | 0 |
| `text-xl` | 25px / 1.5625rem | h3 — section headings | 1.25 | -0.01em |
| `text-2xl` | 31px / 1.9375rem | h2 — page headings | 1.15 | -0.015em |
| `text-3xl` | 39px / 2.4375rem | h1 — display (homepage hero only) | 1.1 | -0.02em |

Body prose max-width: `65ch` (Grove/repo write-up text columns). Tables, the alternatives
comparison grid, and card grids are exempt — sized to content, not prose measure.

## Spacing & layout

**Base unit: 8px** (not 4px) — the "airy, editorial interface" choice per the theme
statement; component-internal padding may drop to a 4px sub-unit where genuinely dense
(the alternatives comparison table's cell padding), documented per-component, not as a
second global scale.

**Tailwind mapping — important, to avoid a config collision when this gets wired in
(issue #5):** every value below is already a multiple of Tailwind's own default 4px
spacing unit, so **do not** add a parallel `space-1`…`space-8` key set to
`theme.extend.spacing` — that would either silently override Tailwind's default numeric
scale (if keyed `1`…`8`) or produce non-idiomatic classes like `p-space-3` (if keyed
literally). Instead this scale is documentation for *which* of Tailwind's own default
numeric keys to use — no `theme.extend.spacing` entry needed at all. The "semantic name"
column below is what this doc and future component specs call each step; the "Tailwind
key" column is the literal class suffix a component uses (e.g. `p-6` for `space-3`):

| Semantic name | Value | Tailwind key | Use |
|---|---|---|---|
| `space-1` | 8px | `2` (`p-2`, `gap-2`) | inline gap (icon + label), dense table cell padding |
| `space-2` | 16px | `4` (`p-4`, `gap-4`) | padding inside small components (chips, buttons) |
| `space-3` | 24px | `6` (`p-6`, `gap-6`) | padding inside standard components (card interior) |
| `space-4` | 32px | `8` (`p-8`, `gap-8`) | section padding, card-to-card gap in a grid |
| `space-5` | 40px | `10` (`p-10`) | major section separation within a page |
| `space-6` | 48px | `12` (`p-12`) | page-level top/bottom padding |
| `space-8` | 64px | `16` (`p-16`) | hero whitespace (homepage only) |

The one config change actually needed later: constrain component code to *only* the
even-numbered keys above (never odd keys like `p-3` or `p-5`) so the 8px rhythm holds —
that's a lint/review convention for the dev lane to enforce once components exist, not a
token-file change.

**Grid:** 12-column, fluid gutters — desktop (≥1280px): 12 col / 24px gutter / 48px
margin; tablet (768–1279px): 8 col / 16px gutter / 24px margin; mobile (<768px): 4 col /
16px gutter / 16px margin.

**Breakpoints:** `sm`=480, `md`=768, `lg`=1024, `xl`=1280, `2xl`=1440 (mobile-first).

**Density modes:** default (1×) only for v1 — RepoGrove's audience (evaluator, browser)
benefits from the airy editorial default; do not add a compact/dashboard density mode
until a real page (e.g. the alternatives table at scale) demonstrates the need. Speculative
density theming before there's a page to test it against would be exactly the kind of
premature scale CLAUDE.md §4 asks the design lane to avoid.

## Radius, elevation, motion

- **Radius:** `radius-sm` = 4px (chips, badges, inputs), `radius-md` = 8px (cards,
  buttons), `radius-lg` = 12px (modals/popovers only). No fully-rounded (`9999px`) pill
  shapes except momentum/status chips — reads as "editorial/structured" rather than
  "consumer/playful," consistent with the theme statement and the "avoid playful
  maximalism" caution from the Developer Tools context row.
- **Elevation:** two levels only — `elevation-1` (cards: `0 1px 2px rgb(0 0 0 / 0.06), 0
  1px 1px rgb(0 0 0 / 0.04)`) and `elevation-2` (popovers/modals: `0 4px 12px rgb(0 0 0 /
  0.10)`). Prefer a `border.subtle` + `bg.elevated` pairing over heavy shadow wherever
  possible — flat, editorial, not skeuomorphic.
- **Motion:** productive register, not expressive. Durations: `motion-fast` = 120ms
  (hover states, chip color changes), `motion-base` = 200ms (panel expand/collapse,
  dropdown open). Easing: `ease-out` for entrances, `ease-in` for exits. Respect
  `prefers-reduced-motion` — disable non-essential transitions (fine for hover-color, must
  disable for anything that moves position/size) when set.

## Component patterns (specs — not yet built; dev lane implements against these when
Phase 1/2 pages land)

- **Repo/Grove card** (spec §8, §25): `bg.elevated`, `radius-md`, `elevation-1`, `space-3`
  interior padding. Header row: repo/Grove name (Inter, `text-lg`, `text.default`) +
  momentum chip (top-right). Body: one-line plain-English description (serif, `text-sm`,
  `text.secondary`, clamped to 2 lines). Footer row: stars (mono, `text-sm`) · language ·
  category tag · "why interesting" one-liner. Entire card is a single link (one focus
  stop, not nested interactive elements) — a11y requirement, not a style one.
- **Alternatives comparison table** (spec §3–4): sortable columns (stars, language,
  activity, hosting) — sort state must be programmatically exposed (`aria-sort`), not
  color-only. Momentum/activity column uses the chip pattern above, never a bare colored
  dot. Row hover: `bg.subtle`, no color shift on text (contrast must hold on hover too).
- **Status chips** (momentum/Heat — see above): icon + label + text-color pairing, never
  a filled color block with no text, `radius-sm` fully-rounded exception noted above,
  `space-1` internal padding.
- **Dates:** always render as an explicit, unambiguous string with a native
  `<time datetime>` attribute (e.g. "3 days ago" with a `title` tooltip showing the exact
  ISO date) — relative dates alone are an a11y/clarity failure for anyone using a screen
  reader that doesn't announce hover tooltips.
- **Loading state:** skeleton blocks matching the final layout's shape (card skeleton,
  table-row skeleton) — never a single centered spinner replacing a whole page, since it
  discards layout stability (CLS).
- **Empty state:** icon + one-sentence explanation + a next action (e.g. an empty
  "alternatives" section says "No alternatives documented yet" + a link, never a bare
  blank section that reads as broken).
- **Error state:** `error` semantic text/icon + plain-English explanation + retry action
  where applicable — never a raw stack trace or HTTP status code as the only message.
- **Page headers:** title (Inter, `text-2xl`) + one-line context/breadcrumb (mono for a
  slug like `owner/name`, sans for everything else) + primary action (if any) right-
  aligned on desktop, stacked on mobile.

## WCAG 2.1 AA — floor, not aspiration

Every token pairing above that carries text has a measured contrast ratio, in **both**
light and dark theme, not an eyeballed one and not a light-mode value naively reused in
dark mode (reusing it would fail: e.g. `success`'s light-mode hex on the dark background
measures 3.23:1, well under the 4.5:1 minimum — dark-mode values are independently
solved, same recipe, higher lightness).

Reproducing these numbers: `docs/design/tokens/generate_palette.py` (committed in this
PR, not just described in a PR body — run it yourself, don't take the numbers on faith)
regenerates every scale and re-validates every pairing above. Two candidate values from
earlier in this run failed and are worth recording so the reasoning survives: a first
`border.default` candidate at `neutral-30` measured 1.59:1 against the 3:1 UI minimum
(replaced with `neutral-50`, 3.52:1), and a first `warning` light-mode text candidate at
`oklch(62% 0.16 75)` measured 3.61:1 against the 4.5:1 text minimum (replaced with
`oklch(55% 0.16 75)`, 4.82:1).

## Open questions / next steps for this lane

- RG-4 (visual direction) — still open as of 2026-09-28 (checked the email thread again
  this run — design run 3 — no new reply from whurter5@gmail.com since the ambiguous
  "happy with public and suggestions" already recorded); proceeding on the recommended
  default (editorial/content-forward) per `.factory/decisions.yaml`, defaults
  2026-09-30 if still unanswered — two days away, next run should check again.
- Density modes, additional radius/elevation tiers, and a compact table mode are
  deliberately deferred until a real page exists to test them against (see Spacing &
  layout above).
- **Done this run (2026-09-28, design run 3):** the repeatable screenshot + axe-core
  harness is built — `@playwright/test` + `@axe-core/playwright` as devDependencies,
  `playwright.config.ts`, `tests/design/screenshots.spec.ts`, `npm run
  design:screenshots` — see `docs/adr/ADR-007-design-screenshot-a11y-harness.md` for
  the full design and its one real limitation (this sandbox can't fetch the Google
  Fonts this repo's build now needs — ADR-006 — so this run verified the harness's
  mechanics against a locally-stubbed build rather than the real one; real screenshots
  need a future run/CI with that network access). **Next major task:** once that
  happens and real screenshots exist, extend `ROUTES` in the spec to the component
  patterns below (cards, alternatives table, status chips) as the dev lane builds the
  pages that need them, and review the actual rendered output against this doc's specs
  for the first time.
- Component patterns (repo/Grove card, alternatives table, status chips, dates,
  loading/empty/error states) are still specs only — no page yet needs them. Wire them in
  as each dev-lane page lands, not speculatively ahead of it.
