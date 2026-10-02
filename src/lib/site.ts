/**
 * The canonical production origin RepoGrove's SEO surface (sitemap, robots,
 * OpenGraph URLs) is built against. The site is live at
 * https://www.repogrove.com (Azure Static Web Apps, ADR-002 addendum,
 * 2026-10-02), while this constant still names the apex `repogrove.com`.
 * This constant doesn't provision anything; it's the absolute-URL prefix
 * Next's static `sitemap.ts`/`robots.ts` conventions require. Whether the
 * apex redirects to `www` (and so which origin should be canonical) is an
 * owner/DNS question, tracked in TECH-DEBT.md; update this one place if the
 * canonical origin changes.
 */
export const SITE_URL = "https://repogrove.com";
