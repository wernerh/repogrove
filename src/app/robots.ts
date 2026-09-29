import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Renders to a real, static `robots.txt` at build time (same static-export
 * convention as `sitemap.ts`) — everything on RepoGrove is public content
 * meant to be indexed (spec §14's whole SEO strategy), so this just points
 * crawlers at the sitemap rather than restricting anything.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
