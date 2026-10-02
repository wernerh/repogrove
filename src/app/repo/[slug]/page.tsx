import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import {
  getAllRepos,
  getAlternative,
  getComparisonsForRepo,
  getRepo,
  slugifyAlternativeName,
  splitOutSection,
} from "@/lib/content";
import { getGrowthSummaries, getSnapshotHistory } from "@/lib/snapshots";
import { getRecentReleases } from "@/lib/releases";
import { computeHeat } from "@/lib/heat";
import { dateFormatter } from "@/lib/format";
import StarGrowthChart from "@/components/StarGrowthChart";
import StatusChip from "@/components/StatusChip";
import MomentumChip from "@/components/MomentumChip";
import AlternativesTable, {
  type ResolvedAlternative,
  type ResolvedCommercialAlternative,
} from "@/components/AlternativesTable";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllRepos().map((repo) => ({ slug: repo.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const repo = getRepo(slug);
  if (!repo) return {};
  return { title: repo.name, description: `${repo.name} (${repo.github}) on RepoGrove` };
}

export default async function RepoPage({ params }: PageProps) {
  const { slug } = await params;
  const repo = getRepo(slug);
  if (!repo) notFound();

  // Resolve each open-source alternative slug against /content/repos (most
  // don't have a page yet — see AlternativesTable's doc comment) and batch-
  // fetch stars for whichever ones do, rather than one getSnapshotHistory
  // call per row (same N+1 lesson as TECH-DEBT.md's 2026-09-29 homepage row).
  // No self-reference/duplicate filtering needed here — parseRepo's
  // assertValidAlternatives (src/lib/content.ts) already fails the build
  // loudly on either, so a resolved list reaching this page is guaranteed
  // clean.
  const resolvedRepos = repo.alternatives.open_source.map((altSlug) => ({
    slug: altSlug,
    repo: getRepo(altSlug) ?? null,
  }));
  const starsByGithub = getGrowthSummaries(
    resolvedRepos.flatMap((r) => (r.repo ? [r.repo.github] : [])),
  );
  const openSourceAlternatives: ResolvedAlternative[] = resolvedRepos.map(({ slug: altSlug, repo: altRepo }) => ({
    slug: altSlug,
    repo: altRepo,
    stars: altRepo ? starsByGithub.get(altRepo.github)?.currentStars ?? null : null,
  }));

  // TECH-DEBT.md's 2026-10-01 row: resolve each commercial display name
  // against /content/alternatives the same way open-source names resolve
  // against /content/repos above, so a chip links forward to its own
  // /alternative/:slug page once one exists, rather than always rendering as
  // inert text. Every commercial reference any content/repos/*.md names
  // today resolves to a real page as of content/alternatives/lm-studio.md
  // (dev run 52) — this still falls back to plain text for any future name
  // that doesn't yet have one. assertValidAlternatives (src/lib/content.ts)
  // already fails the build loudly on a duplicate commercial name, so no
  // extra dedup is needed here.
  const commercialAlternatives: ResolvedCommercialAlternative[] = repo.alternatives.commercial.map(
    (name) => ({
      name,
      alternativeSlug: getAlternative(slugifyAlternativeName(name))?.slug ?? null,
    }),
  );

  // Reused for both the star-growth chart and the Momentum/Heat chip below
  // — one getSnapshotHistory call per repo page, not two (same N+1 lesson
  // as TECH-DEBT.md's 2026-09-29 homepage row).
  const snapshotHistory = getSnapshotHistory(repo.github);
  const heat = computeHeat(snapshotHistory);

  // Issue #72 (basic news widget, v1: GitHub Releases only) — recent releases for
  // this repo, ingested into data/repogrove.db (never fetched live: output: "export"
  // has no server runtime, same reasoning as every other data-fetching section on
  // this page). Empty (no releases ingested yet, or the repo genuinely has none) gets
  // an explicit "No recent releases" message below, never a fabricated one.
  const releases = getRecentReleases(repo.github);

  // /compare/:a/:b (issue #62) — every hand-curated comparison naming this
  // repo, so a reader lands here without needing to know the compare route
  // exists. Sorted for a stable render order (comparisons don't have their
  // own ranking signal), not left in whatever order getAllComparisons's
  // file-listing happens to produce.
  // getRepo(otherSlug)! is safe: content.ts's assertComparisonReposExist
  // already fails the build loudly if a comparison names a repo slug that
  // doesn't exist, so every comparison reaching this page is guaranteed to
  // resolve (same guarantee AlternativesTable's resolved rows rely on).
  const comparisons = getComparisonsForRepo(repo.slug)
    .map((comparison) => ({
      comparison,
      otherRepo: getRepo(comparison.repoSlugs.find((slug) => slug !== repo.slug)!)!,
    }))
    .sort((a, b) => a.otherRepo.name.localeCompare(b.otherRepo.name));

  const { before: bodyBeforeAlternatives, after: bodyAfterAlternatives } = splitOutSection(
    repo.body,
    "Alternatives",
  );
  // Defensive drift check: if this repo declares real alternatives but the
  // "## Alternatives" heading wasn't found (e.g. an editor renamed/removed
  // it in the Markdown body without updating splitOutSection's call site
  // here), the old hand-authored prose would otherwise render *alongside*
  // the new computed table below instead of being replaced by it — a silent
  // duplication independent review flagged as a real risk. `next build`
  // fails on any unhandled throw during static generation, so this is the
  // project's usual "fail loudly on bad content" pattern, not a new one.
  const hasAlternatives = repo.alternatives.open_source.length > 0 || repo.alternatives.commercial.length > 0;
  if (hasAlternatives && bodyAfterAlternatives === "" && bodyBeforeAlternatives === repo.body) {
    throw new Error(
      `content/repos/${repo.slug}.md declares "alternatives" frontmatter but its body has no "## Alternatives" ` +
        `heading for splitOutSection to remove — the hand-authored placeholder prose would render duplicated ` +
        `alongside the computed AlternativesTable. Add the heading back, or remove it along with the frontmatter.`,
    );
  }

  // `[&>:first-child]:mt-0!`: the article-level prose rules (globals.css) give headings
  // and paragraphs a top margin that would otherwise double the card's own padding.
  const CARD =
    "rounded-md border border-border-subtle bg-bg-elevated p-4 shadow-elevation-1 sm:p-6 [&>:first-child]:mt-0!";

  return (
    <article className="flex flex-col gap-6">
      <header className={`${CARD} sm:p-8`}>
        <p className="font-mono text-sm text-text-link">Repository</p>
        <h1 className="mt-1 font-sans text-3xl font-semibold tracking-tight text-text-default">
          {repo.name}
        </h1>
        <a
          href={`https://github.com/${repo.github}`}
          className="font-mono text-sm text-text-secondary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/{repo.github}
        </a>

        <dl className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm text-text-secondary">
          <div>
            <dt className="inline font-medium text-text-default">Status: </dt>
            <dd className="inline">
              <StatusChip status={repo.status} />
            </dd>
          </div>
          {heat && (
            <div>
              <dt className="inline font-medium text-text-default">Momentum: </dt>
              <dd className="inline">
                <MomentumChip heat={heat} />
              </dd>
            </div>
          )}
          <div>
            <dt className="inline font-medium text-text-default">License: </dt>
            <dd className="inline font-mono">{repo.license}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-text-default">Category: </dt>
            <dd className="inline font-mono">{repo.category.join(", ")}</dd>
          </div>
        </dl>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className={CARD}>
            <StarGrowthChart history={snapshotHistory} />
          </div>

          <div className={CARD}>
            <Markdown>{bodyBeforeAlternatives}</Markdown>
          </div>

          <div className={CARD}>
            <AlternativesTable openSource={openSourceAlternatives} commercial={commercialAlternatives} />
          </div>

          <div className={CARD}>
            {/* The body's own "## Related Grove" section (hand-authored in
                content/repos/*.md) already links back to the Grove — rendering
                a second, computed one here would just duplicate it. */}
            <Markdown>{bodyAfterAlternatives}</Markdown>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-6" aria-label="Repository sidebar">
          {comparisons.length > 0 && (
            <section className={CARD}>
              <h2 className="!mt-0 font-sans text-lg font-semibold text-text-default">Compared with</h2>
              <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
                {comparisons.map(({ comparison, otherRepo }) => (
                  <li key={comparison.slug}>
                    <Link
                      href={`/compare/${repo.slug}/${otherRepo.slug}`}
                      className="inline-block rounded-sm bg-bg-brand-subtle px-2 py-1 font-sans text-sm text-text-on-brand-subtle hover:underline"
                    >
                      vs {otherRepo.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* UX-2026-004: "Latest" is supplementary and must never sit above the
              editorial lede. In the two-column layout it lives in the sidebar, so
              the main column's order is still chart -> editorial body ->
              alternatives -> related Grove (PRODUCT.md §5/§10), and on narrow
              screens the sidebar stacks *after* the main column, i.e. last. */}
          <section className={CARD}>
            <h2 className="!mt-0 font-sans text-lg font-semibold text-text-default">Latest</h2>
            {releases.length > 0 ? (
              <ul className="mt-3 flex list-none flex-col gap-2 p-0">
                {releases.map((release) => (
                  <li
                    key={release.tagName}
                    className="flex flex-wrap items-baseline justify-between gap-x-2 font-sans text-sm"
                  >
                    <a
                      href={release.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-link hover:underline"
                    >
                      {release.name ?? release.tagName}
                    </a>
                    <span className="font-mono text-sm text-text-secondary">
                      {dateFormatter.format(new Date(release.publishedAt))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 font-sans text-sm text-text-secondary">No recent releases.</p>
            )}
          </section>
        </aside>
      </div>
    </article>
  );
}
