import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllAlternatives, getAlternative, getRepo, slugifyAlternativeName, type Repo } from "@/lib/content";
import { getGrowthSummaries } from "@/lib/snapshots";
import { numberFormatter } from "@/lib/format";
import type { Metadata } from "next";
import StarIcon from "@/components/StarIcon";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ResolvedOpenSourceAlternative {
  /** The raw display name from `content/alternatives/*.md`'s "Open source"
   * bullet list, e.g. "AppFlowy" — shown verbatim when unresolved. */
  name: string;
  /** The matching `content/repos/*.md` entry, or `null` when
   * `slugifyAlternativeName(name)` doesn't resolve to one yet — most of
   * today's content, see `content/alternatives/notion.md`'s own note. */
  repo: Repo | null;
}

export function generateStaticParams() {
  return getAllAlternatives().map((alternative) => ({ slug: alternative.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const alternative = getAlternative(slug);
  if (!alternative) return {};
  return {
    title: `${alternative.product} alternatives`,
    description: `Open-source, free, and commercial alternatives to ${alternative.product} on RepoGrove.`,
  };
}

/**
 * Resolves each "Open source" display name against `/content/repos` — the
 * same resolved-or-plain-text convention `AlternativesTable`
 * (`src/components/AlternativesTable.tsx`) already uses for
 * `Repo.alternatives.open_source`, applied here to plain bullet-list display
 * names (`slugifyAlternativeName`) instead of explicit frontmatter slugs.
 * Exported (not inlined in the page component) so the resolution logic has
 * its own unit-test coverage independent of real `content/alternatives/*.md`
 * fixtures happening to contain a name that resolves — see
 * `tests/app/alternative-page.test.tsx`.
 */
export function resolveOpenSourceAlternatives(names: string[]): ResolvedOpenSourceAlternative[] {
  return names.map((name) => ({ name, repo: getRepo(slugifyAlternativeName(name)) ?? null }));
}

/** A plain bullet-list section (Free / Commercial / Best fit) — rendered
 * only when non-empty, matching the "omit, don't fabricate an empty
 * section" convention `AlternativesTable` uses for its own commercial-chip
 * list. */
function PlainListSection({ heading, items }: { heading: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="font-sans text-xl font-semibold text-text-default">{heading}</h2>
      <ul className="mt-3 flex flex-col gap-1 text-sm text-text-secondary">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default async function AlternativePage({ params }: PageProps) {
  const { slug } = await params;
  const alternative = getAlternative(slug);
  if (!alternative) notFound();

  const resolvedOpenSource = resolveOpenSourceAlternatives(alternative.openSource);
  // Batch-fetch stars for whichever resolved rows have a real repo, rather
  // than one getSnapshotHistory/getGrowthSummary call per row (same N+1
  // lesson as TECH-DEBT.md's 2026-09-29 homepage row and /repo/[slug]'s own
  // AlternativesTable resolution).
  const starsByGithub = getGrowthSummaries(
    resolvedOpenSource.flatMap((r) => (r.repo ? [r.repo.github] : [])),
  );

  return (
    <article className="max-w-3xl">
      <p className="font-sans text-sm font-medium text-text-link">Alternatives</p>
      <h1 className="font-sans text-2xl font-semibold tracking-tight text-text-default">
        {alternative.product} alternatives
      </h1>
      <p className="mt-2 text-lg text-text-secondary">{alternative.category}</p>

      {resolvedOpenSource.length > 0 && (
        <section className="mt-6">
          <h2 className="font-sans text-xl font-semibold text-text-default">Open source</h2>
          <ul className="mt-3 flex flex-col gap-1 font-sans text-sm">
            {resolvedOpenSource.map(({ name, repo }) => {
              const stars = repo ? starsByGithub.get(repo.github)?.currentStars ?? null : null;
              return (
                <li key={name}>
                  {repo ? (
                    <Link href={`/repo/${repo.slug}`} className="text-text-link hover:underline">
                      {repo.name}
                    </Link>
                  ) : (
                    <span className="font-mono text-text-secondary">{name}</span>
                  )}
                  {stars !== null && (
                    <span className="ml-2 font-mono text-text-secondary">
                      <StarIcon className="mr-1 inline" />
                      {numberFormatter.format(stars)}
                    </span>
                  )}
                  {!repo && <span className="ml-2 text-text-secondary">Not yet profiled</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <PlainListSection heading="Free" items={alternative.free} />
      <PlainListSection heading="Commercial" items={alternative.commercial} />
      <PlainListSection heading="Best fit" items={alternative.bestFit} />
    </article>
  );
}
