/**
 * Shared number formatting for star counts. `numberFormatter` used to be
 * duplicated verbatim in `AlternativesTable.tsx` and
 * `alternative/[slug]/page.tsx` (TECH-DEBT.md, 2026-09-29 row, left
 * unresolved at 2 call sites to keep that PR scoped to its own routing/
 * content-loader work) — `/compare/:a/:b` (issue #62) needed a third,
 * past the point where duplicating it again was the smaller diff. Extracted
 * here and both existing call sites switched over in the same PR.
 */
export const numberFormatter = new Intl.NumberFormat("en-US");

/**
 * Shared date formatting for a release's `publishedAt` (issue #72, "Latest" section
 * on `/repo/[slug]`) — "Sep 20, 2026" rather than a raw ISO timestamp.
 */
export const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});
