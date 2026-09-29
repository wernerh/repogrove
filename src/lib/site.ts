/**
 * The canonical production origin RepoGrove's SEO surface (sitemap, robots,
 * OpenGraph URLs) is built against. `PRODUCT.md` names `repogrove.com` as
 * the target domain, explicitly "not yet provisioned" — hosting itself is
 * still undecided/gated (ADR-002, RG-2, CLAUDE.md rule 6: registering a
 * domain or standing up cloud resources is a human gate). This constant
 * doesn't provision anything; it's just the absolute-URL prefix Next's
 * static `sitemap.ts`/`robots.ts` conventions require, so the generated
 * `sitemap.xml`/`robots.txt` are correct once the site is actually served
 * from this origin. Update this one place when a real origin is chosen.
 */
export const SITE_URL = "https://repogrove.com";
