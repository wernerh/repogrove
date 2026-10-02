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
  // /alternative/:slug page once one exists (most still don't — e.g. "LM
  // Studio" has no content/alternatives/lm-studio.md yet) rather than always
  // rendering as inert text. assertValidAlternatives (src/lib/content.ts)
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

  return (
    <article>
      <p className="font-sans text-sm font-medium text-text-link">Repository</p>
      <h1 className="font-sans text-2xl font-semibold tracking-tight text-text-default">
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

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-sans text-sm text-text-secondary">
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
          <dd className="inline">📜 {repo.license}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-text-default">Category: </dt>
          <dd className="inline">{repo.category.join(", ")}</dd>
        </div>
      </dl>

      <StarGrowthChart history={snapshotHistory} />

      <div className="mt-6">
        <Markdown>{bodyBeforeAlternatives}</Markdown>
      </div>

      <AlternativesTable openSource={openSourceAlternatives} commercial={commercialAlternatives} />

      <div className="mt-6">
        {/* The body's own "## Related Grove" section (hand-authored in
            content/repos/*.md) already links back to the Grove — rendering
            a second, computed one here would just duplicate it. */}
        <Markdown>{bodyAfterAlternatives}</Markdown>
      </div>

      {comparisons.length > 0 && (
        <section className="mt-6">
          <h2 className="font-sans text-xl font-semibold text-text-default">Compared with</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {comparisons.map(({ comparison, otherRepo }) => (
              <li key={comparison.slug}>
                <Link
                  href={`/compare/${repo.slug}/${otherRepo.slug}`}
                  className="inline-block rounded-sm bg-bg-subtle p-2 font-sans text-sm text-text-link hover:underline"
                >
                  vs {otherRepo.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* UX-2026-004: placed last, after the editorial narrative, alternatives and
          comparisons — matching PRODUCT.md §5/§10's page-perspective order
          (Overview -> Alternatives -> Comparison -> Momentum -> News). Originally
          landed (#74) directly after the star chart and before the repo's own
          one-sentence tagline (the first line of its Markdown body); with no distinct
          lede styling on that tagline, "Latest" pushed it down to visually read as a
          trailing continuation of the "No recent releases." empty state rather than
          the page's lead sentence. See docs/design/findings/UX-2026-004. */}
      <section className="mt-6">
        <h2 className="font-sans text-xl font-semibold text-text-default">Latest</h2>
        {releases.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {releases.map((release) => (
              <li
                key={release.tagName}
                className="flex flex-wrap items-baseline gap-x-2 font-sans text-sm"
              >
                <a
                  href={release.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-link hover:underline"
                >
                  {release.name ?? release.tagName}
                </a>
                <span className="font-mono text-xs text-text-secondary">
                  {dateFormatter.format(new Date(release.publishedAt))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 font-sans text-sm text-text-secondary">No recent releases.</p>
        )}
      </section>
    </article>
  );
}
