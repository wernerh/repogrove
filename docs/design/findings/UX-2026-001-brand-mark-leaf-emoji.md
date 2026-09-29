# UX-2026-001 — Brand mark uses literal leaf/tree emoji

- **Status: FIXED** (this run). **Verified: yes** — same run (grepped `src/`, `content/`,
  and `docs/design/` after the fix; none of the three emoji remain in application code).
- **Severity:** MAJOR — the header logo appears unconditionally on every page, so it is
  the strongest brand signal a first-time visitor gets; it directly contradicted this
  lane's own documented, deliberate brand decision (see Summary), not a matter of taste.
- **Summary:** `docs/design/DESIGN-SYSTEM.md`'s Brand scale section documents a
  deliberate decision: the brand color was chosen to avoid a literal foliage motif —
  "Deliberately not literal foliage-green (avoids the 'Sustainability/Eco' cliché ... and
  avoids reading as a slow-living wellness brand) ... a distinct, cooler, deeper teal so
  RepoGrove reads as its own product per spec §29, with a quiet nod to 'Grove' without an
  illustrated leaf anywhere." The actual header, rendered on every page, read `🌱
  RepoGrove` — a literal green sprout emoji, exactly the "illustrated leaf" that
  rationale rules out. The homepage compounded it with `🌳 Groves` as a section-heading
  icon — the same literal-foliage problem one level down from the logo. `📦 Repositories`
  is a separate, smaller issue: the box emoji isn't foliage and doesn't contradict the
  brand-color rationale directly, but leaving it while removing `🌳` next to it would
  read as an inconsistent, half-finished heading treatment — removed for that reason,
  not the foliage one (no spec anywhere calls for a decorative icon on either heading).

## Component
`src/app/layout.tsx` (header wordmark), `src/app/page.tsx` (homepage section headings).
Rendered on every page via the shared root layout.

## Found
2026-09-29, design factory run 7 — the first run able to review the real,
correctly-fonted committed screenshots (`docs/design/screenshots/*.png`; real screenshots
only became possible once RG-6 landed, see `docs/design/README.md` runs 5-7 and
`TECH-DEBT.md`).

## Why it wasn't caught earlier
Design runs 1-2 (tokens + wiring) worked from Playwright screenshots taken before real
fonts loaded (ADR-006's sandbox gap) and, per this lane's own "look at screenshots before
judging" rule, were reviewing layout/contrast/type mechanics, not full content. Runs 3-6
were entirely about building and landing the screenshot+CI harness itself (ADR-007) and
were blocked on RG-6 (this sandbox's network allowlist can't reach GitHub's
artifact-storage backend, so the real, GitHub-hosted-runner screenshots existed only as an
unreachable CI artifact until RG-6's `commit-screenshots` job landed). This run is the
first time real, correctly-fonted screenshots of the actual pages have been sitting in the
repo for this lane to open and read end to end.

## Impact
Cosmetic/brand-identity only — no functional or accessibility impact (axe-core's WCAG
2.1 A/AA scan already passed 18/18 against the unfixed version, since emoji glyphs don't
trip contrast or semantic-markup rules). The impact is that the site's one
always-visible element was undermining the "structured, trustworthy, technical-editorial"
identity the rest of the token set (cool neutral base, deep-teal accent, serif/sans/mono
pairing) was built to produce, reading instead as generic nature/eco clip art.
`src/app/favicon.ico` (an abstract triangle mark) already got this right, which made the
header's contradiction easy to confirm as a real gap rather than a difference in taste.

## Fix
Removed the three decorative emoji; the wordmark and section headings now rely on
typography alone (Inter, `font-semibold`). No spec in `DESIGN-SYSTEM.md` — not the page
header pattern, not the type scale's section-heading tier — calls for a decorative icon
on the logo or these headings, so this is a straight removal, not a swap for a different
icon. No token, layout, or color change was needed — this was a content-level fix in two
files.

## Verification
- `npm run lint` / `npx tsc --noEmit` / `npm test` (75/75) / `npm audit --audit-level=high`
  all clean locally.
- `npm run build` reproduces the known ADR-006 sandbox font-fetch gap (unrelated to this
  change) — left to CI's GitHub-hosted runner, which has real font access.
- Grepped `src/`, `content/`, and `docs/design/` for the three emoji plus a general
  leaf/tree/plant emoji sweep — none remain in application code after the fix.
- `design-screenshots.yml`'s `commit-screenshots` job will recommit fresh screenshots to
  `docs/design/screenshots/` on the next push to `main` after this PR merges; a future run
  should do one more visual pass on the refreshed header once that lands, but the fix
  itself is a direct text removal with no room for a rendering surprise.

## Related
Issue [#50](https://github.com/wernerh/repogrove/issues/50). Follow-up note left in
`DESIGN-SYSTEM.md`'s "Open questions" section for whoever builds the Phase 3 homepage
sections `PRODUCT.md` §8 names with emoji prefixes (🔥 Hot Right Now, 🌱 Rising, 🌳
Popular Groves, 💰 Replace Paid Software) — don't carry those literally without a
deliberate pass against this doc's brand rationale first.
