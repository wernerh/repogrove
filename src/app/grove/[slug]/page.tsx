import Link from "next/link";
import { notFound } from "next/navigation";
import GroveHeader from "@/components/GroveHeader";
import GroveRepoList from "@/components/GroveRepoList";
import GroveSidebar, { type RelatedGrove } from "@/components/GroveSidebar";
import { getAllGroves, getGrove, getRepo, getReposInGrove } from "@/lib/content";
import { buildGroveRows, computeGroveStats, topGainers } from "@/lib/grove-rows";
import { getSnapshotHistories } from "@/lib/snapshots";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllGroves().map((grove) => ({ slug: grove.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const grove = getGrove(slug);
  if (!grove) return {};
  return { title: grove.name, description: grove.description };
}

/**
 * `/grove/[slug]` — a Grove as a browsable research guide (spec §2, §25):
 * header card with real aggregate figures, a filterable/sortable/paginated
 * list of member repos, and a sidebar (Trendspotting, Related Groves,
 * newsletter signup).
 *
 * Which repos are listed comes from each repo's own `groves:` frontmatter
 * (`getReposInGrove`), not from the Grove file's body — so the list can't
 * drift from real membership. The body's hand-written "Core projects" bullets
 * duplicated that, so the body is no longer rendered here (it stays in
 * `content/groves/*.md` as editorial source).
 */
export default async function GrovePage({ params }: PageProps) {
  const { slug } = await params;
  const grove = getGrove(slug);
  if (!grove) notFound();

  const repos = getReposInGrove(slug);
  // One database open for the whole Grove (see `getSnapshotHistories`).
  const histories = getSnapshotHistories(repos.map((repo) => repo.github));
  const rows = buildGroveRows(repos, histories, (altSlug) => getRepo(altSlug)?.name ?? altSlug);
  const stats = computeGroveStats(rows);

  const related: RelatedGrove[] = grove.relatedGroves.flatMap((relatedSlug) => {
    const relatedGrove = getGrove(relatedSlug);
    return relatedGrove
      ? [{ slug: relatedGrove.slug, name: relatedGrove.name, repoCount: getReposInGrove(relatedSlug).length }]
      : [];
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 font-mono text-sm text-text-secondary">
        <nav aria-label="Breadcrumb">
          <ol className="flex list-none items-center gap-2 p-0">
            <li>
              <Link href="/#groves" className="hover:text-text-default hover:underline">
                Groves
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-text-default">
              {grove.name}
            </li>
          </ol>
        </nav>
        <p>
          {stats.repoCount} curated {stats.repoCount === 1 ? "repository" : "repositories"}
          {stats.updatedOn && (
            <>
              {" "}
              · Updated <time dateTime={stats.updatedOn}>{stats.updatedOn}</time>
            </>
          )}
        </p>
      </div>

      <GroveHeader name={grove.name} description={grove.description} stats={stats} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="min-w-0 md:col-span-2">
          {rows.length > 0 ? (
            <GroveRepoList rows={rows} groveName={grove.name} />
          ) : (
            <p className="rounded-md border border-border-subtle bg-bg-elevated p-6 font-sans text-sm text-text-secondary shadow-elevation-1">
              No repositories in this Grove yet.
            </p>
          )}
        </div>
        <GroveSidebar gainers={topGainers(rows)} related={related} />
      </div>
    </div>
  );
}
