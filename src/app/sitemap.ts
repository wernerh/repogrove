import type { MetadataRoute } from "next";
import { getAllAlternatives, getAllComparisons, getAllGroves, getAllRepos } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

/**
 * `next build`'s static export (`output: "export"`, `next.config.ts`)
 * renders this into a real `sitemap.xml` at build time — no server runtime
 * needed, so it's compatible with the Azure Static Web Apps static hosting
 * target (ADR-002). Every route is derived from the same content-loader functions
 * every page already calls (`getAllRepos`/`getAllGroves`/
 * `getAllAlternatives`/`getAllComparisons`) rather than a second,
 * hand-maintained list of "what pages exist" — a new `content/*.md` file
 * shows up here automatically (issue #64's acceptance criteria).
 *
 * Comparison pages pre-render *both* URL orders (see
 * `src/app/compare/[a]/[b]/page.tsx`'s `generateStaticParams`), but only
 * the file's own canonical order (`repoSlugs[0]`/`repoSlugs[1]`) is listed
 * here — the reversed URL is the same content under a different path, and
 * a sitemap shouldn't advertise two URLs for one page (duplicate-content
 * SEO anti-pattern; the compare page's own `alternates.canonical` points
 * every order at this same URL).
 *
 * `output: "export"` needs metadata-route files to opt into `force-static`
 * explicitly, same as `robots.ts` — see that file's doc comment.
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/trending`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/rising`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/search`, changeFrequency: "weekly", priority: 0.5 },
  ];

  const repoRoutes: MetadataRoute.Sitemap = getAllRepos().map((repo) => ({
    url: `${SITE_URL}/repo/${repo.slug}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const groveRoutes: MetadataRoute.Sitemap = getAllGroves().map((grove) => ({
    url: `${SITE_URL}/grove/${grove.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const alternativeRoutes: MetadataRoute.Sitemap = getAllAlternatives().map((alternative) => ({
    url: `${SITE_URL}/alternative/${alternative.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const comparisonRoutes: MetadataRoute.Sitemap = getAllComparisons().map((comparison) => ({
    url: `${SITE_URL}/compare/${comparison.repoSlugs[0]}/${comparison.repoSlugs[1]}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...repoRoutes, ...groveRoutes, ...alternativeRoutes, ...comparisonRoutes];
}
