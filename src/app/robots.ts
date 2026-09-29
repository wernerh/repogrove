import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Renders to a real, static `robots.txt` at build time (same static-export
 * convention as `sitemap.ts`) — everything on RepoGrove is public content
 * meant to be indexed (spec §14's whole SEO strategy), so this just points
 * crawlers at the sitemap rather than restricting anything.
 *
 * `output: "export"` (`next.config.ts`, ADR-002) needs metadata-route files
 * to opt into `force-static` explicitly — without it, `next build` fails
 * page-data collection for `/robots.txt` outright (confirmed on CI; this
 * sandbox's own local build never reaches that step, see the known
 * ADR-006 font-fetch gap).
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
