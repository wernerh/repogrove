import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { extractListItems, getAllComparisons, getComparison, getRepo, type Repo } from "@/lib/content";
import { getGrowthSummaries, getSnapshotHistories } from "@/lib/snapshots";
import { computeHeat } from "@/lib/heat";
import { numberFormatter } from "@/lib/format";
import StatusChip from "@/components/StatusChip";
import MomentumChip from "@/components/MomentumChip";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ a: string; b: string }>;
}

/**
 * Every comparison's canonical pair gets *both* URL orders pre-rendered
 * (`/compare/ollama/vllm` and `/compare/vllm/ollama`) since `getComparison`
 * resolves either — a static export can't redirect one onto the other at
 * request time, and a reader shouldn't have to know which repo "comes
 * first" in the content file to avoid a 404.
 */
export function generateStaticParams() {
  return getAllComparisons().flatMap((comparison) => [
    { a: comparison.repoSlugs[0], b: comparison.repoSlugs[1] },
    { a: comparison.repoSlugs[1], b: comparison.repoSlugs[0] },
  ]);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { a, b } = await params;
  const comparison = getComparison(a, b);
  if (!comparison) return {};
  const repoA = getRepo(comparison.repoSlugs[0]);
  const repoB = getRepo(comparison.repoSlugs[1]);
  if (!repoA || !repoB) return {};
  return {
    title: `${repoA.name} vs ${repoB.name}`,
    description: `How ${repoA.name} and ${repoB.name} differ, compared side by side on RepoGrove.`,
    // Both URL orders render identical content (see generateStaticParams
    // above) and the reversed order is reachable from internal links (e.g.
    // repoB's own page links back in reversed order) as well as being
    // pre-rendered, not just theoretically crawlable — a `sitemap.xml`
    // omission alone doesn't stop it from being indexed as a separate,
    // duplicate page (issue #64 review finding). Pointing every order at
    // the file's own canonical order tells crawlers which URL to actually
    // index, same convention the sitemap already uses.
    alternates: {
      canonical: `/compare/${comparison.repoSlugs[0]}/${comparison.repoSlugs[1]}`,
    },
  };
}

/** One `<tr>` of the at-a-glance table — a label cell plus one value cell
 * per repo, in `repos`' order. Kept generic (a `render` callback per repo)
 * rather than one component per fact, since each fact renders differently
 * (a chip, a formatted number, plain text). */
function FactRow({
  label,
  repos,
  render,
}: {
  label: string;
  repos: [Repo, Repo];
  render: (repo: Repo) => React.ReactNode;
}) {
  return (
    <tr className="border-b border-border-subtle last:border-b-0">
      <th scope="row" className="py-2 pr-4 text-left font-normal text-text-secondary">
        {label}
      </th>
      {repos.map((repo) => (
        <td key={repo.slug} className="py-2 pr-4">
          {render(repo)}
        </td>
      ))}
    </tr>
  );
}

export default async function ComparePage({ params }: PageProps) {
  const { a, b } = await params;
  const comparison = getComparison(a, b);
  if (!comparison) notFound();

  const repoA = getRepo(comparison.repoSlugs[0]);
  const repoB = getRepo(comparison.repoSlugs[1]);
  // Defensive: content.ts's assertComparisonReposExist already fails the
  // build loudly if either slug doesn't resolve, so this should never
  // actually trigger — same "drift check, not the primary guard" pattern
  // /repo/[slug] uses for its own "## Alternatives" heading check.
  if (!repoA || !repoB) notFound();
  const repos: [Repo, Repo] = [repoA, repoB];

  // Two batched reads, not two-per-repo (four) opens: getGrowthSummaries
  // already batches the stars lookup across both repos in one db open, and
  // getSnapshotHistories (src/lib/snapshots.ts) does the same for the full
  // history computeHeat needs — always exactly 2 repos on this page (issue
  // #62's non-goal rules out a 3+ comparison mode), so this doesn't grow
  // with the number of comparisons in /content, only stays fixed at 2.
  const starsByGithub = getGrowthSummaries([repoA.github, repoB.github]);
  const historiesByGithub = getSnapshotHistories([repoA.github, repoB.github]);
  const heatByGithub = new Map(
    repos.map((repo) => [repo.github, computeHeat(historiesByGithub.get(repo.github) ?? [])]),
  );

  return (
    <article>
      <p className="font-sans text-sm font-medium text-text-link">Comparison</p>
      <h1 className="font-sans text-2xl font-semibold tracking-tight text-text-default">
        {repoA.name} vs {repoB.name}
      </h1>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[24rem] border-collapse text-left font-sans text-sm">
          <caption className="sr-only">
            {repoA.name} vs {repoB.name} at a glance
          </caption>
          <thead>
            <tr className="border-b border-border-default">
              <th scope="col" className="py-2 pr-4" />
              {repos.map((repo) => (
                <th
                  key={repo.slug}
                  scope="col"
                  className="py-2 pr-4 text-left font-medium text-text-default"
                >
                  <Link href={`/repo/${repo.slug}`} className="text-text-link hover:underline">
                    {repo.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <FactRow
              label="Stars"
              repos={repos}
              render={(repo) => {
                const stars = starsByGithub.get(repo.github)?.currentStars ?? null;
                return (
                  <span className="font-mono text-text-secondary">
                    {stars !== null ? `⭐ ${numberFormatter.format(stars)}` : "—"}
                  </span>
                );
              }}
            />
            <FactRow label="License" repos={repos} render={(repo) => `📜 ${repo.license}`} />
            <FactRow
              label="Status"
              repos={repos}
              render={(repo) => <StatusChip status={repo.status} />}
            />
            <FactRow
              label="Momentum"
              repos={repos}
              render={(repo) => {
                const heat = heatByGithub.get(repo.github) ?? null;
                return heat ? (
                  <MomentumChip heat={heat} />
                ) : (
                  <span className="text-text-secondary">Not enough data yet</span>
                );
              }}
            />
            <FactRow
              label="Category"
              repos={repos}
              render={(repo) => (
                <span className="text-text-secondary">{repo.category.join(", ")}</span>
              )}
            />
          </tbody>
        </table>
      </div>

      {/* Pros/Cons: reused from each repo's own content/repos/*.md body
          (its "## Pros"/"## Cons" sections) rather than re-authored here —
          same "don't re-derive what's already computed/curated elsewhere"
          principle the at-a-glance table above follows for stars/status/
          momentum. Omitted per-repo if genuinely empty (shouldn't happen —
          every repo content file has both — but "omit, don't fabricate" is
          this codebase's convention for exactly this kind of edge case). */}
      {repos.map((repo) => {
        const pros = extractListItems(repo.body, "Pros");
        const cons = extractListItems(repo.body, "Cons");
        if (pros.length === 0 && cons.length === 0) return null;
        return (
          <section key={repo.slug} className="mt-6">
            <h2 className="font-sans text-xl font-semibold text-text-default">{repo.name}</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {pros.length > 0 && (
                <div>
                  <h3 className="font-sans text-sm font-medium text-text-secondary">Pros</h3>
                  <ul className="mt-2 flex flex-col gap-1 font-serif text-sm text-text-secondary">
                    {pros.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {cons.length > 0 && (
                <div>
                  <h3 className="font-sans text-sm font-medium text-text-secondary">Cons</h3>
                  <ul className="mt-2 flex flex-col gap-1 font-serif text-sm text-text-secondary">
                    {cons.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        );
      })}

      <section className="mt-6">
        <h2 className="font-sans text-xl font-semibold text-text-default">How they differ</h2>
        <div className="mt-3 font-serif text-sm text-text-secondary">
          <Markdown>{comparison.howTheyDiffer}</Markdown>
        </div>
      </section>
    </article>
  );
}
