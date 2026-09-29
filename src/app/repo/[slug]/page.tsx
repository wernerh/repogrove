import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { getAllRepos, getRepo, splitOutSection } from "@/lib/content";
import { getGrowthSummaries, getSnapshotHistory } from "@/lib/snapshots";
import { computeHeat } from "@/lib/heat";
import StarGrowthChart from "@/components/StarGrowthChart";
import StatusChip from "@/components/StatusChip";
import MomentumChip from "@/components/MomentumChip";
import AlternativesTable, { type ResolvedAlternative } from "@/components/AlternativesTable";
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

  // Reused for both the star-growth chart and the Momentum/Heat chip below
  // — one getSnapshotHistory call per repo page, not two (same N+1 lesson
  // as TECH-DEBT.md's 2026-09-29 homepage row).
  const snapshotHistory = getSnapshotHistory(repo.github);
  const heat = computeHeat(snapshotHistory);

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

      <AlternativesTable openSource={openSourceAlternatives} commercial={repo.alternatives.commercial} />

      <div className="mt-6">
        {/* The body's own "## Related Grove" section (hand-authored in
            content/repos/*.md) already links back to the Grove — rendering
            a second, computed one here would just duplicate it. */}
        <Markdown>{bodyAfterAlternatives}</Markdown>
      </div>
    </article>
  );
}
