import Link from "next/link";
import type { Metadata } from "next";
import { getAllRepos } from "@/lib/content";
import { getGrowthSummaries, type GrowthSummary } from "@/lib/snapshots";
import { rankByAbsoluteGrowth } from "@/lib/trending";

export const metadata: Metadata = {
  title: "Trending",
  description:
    "Repositories RepoGrove tracks, ranked by absolute GitHub star growth — spec §8's \"Hot Right Now\".",
};

const numberFormatter = new Intl.NumberFormat("en-US");

function formatDelta(delta: number): string {
  if (delta > 0) return `+${numberFormatter.format(delta)}`;
  if (delta < 0) return numberFormatter.format(delta); // already carries "-"
  return "±0";
}

/**
 * The spec's "one-line reason it's interesting" (§8), computed from real
 * growth data rather than an editorial claim this lane would have to
 * invent — no Grove Heat/momentum score exists yet to draw a richer reason
 * from (issue #21/ADR-004, separately data-gated).
 */
function reason(summary: GrowthSummary): string {
  return `${formatDelta(summary.deltaStars)} stars in the last ${summary.days} day${
    summary.days === 1 ? "" : "s"
  }`;
}

export default function TrendingPage() {
  const repos = getAllRepos();
  const summaries = getGrowthSummaries(repos.map((repo) => repo.github));
  const ranked = rankByAbsoluteGrowth(repos, summaries);

  return (
    <div>
      <h1 className="font-sans text-2xl font-semibold tracking-tight text-text-default">
        🔥 Hot Right Now
      </h1>
      <p className="mt-2 font-serif text-lg text-text-secondary">
        Tracked repositories ranked by absolute GitHub star growth.
      </p>

      {ranked.length === 0 ? (
        <p className="mt-6 font-sans text-sm text-text-secondary">
          Trending needs at least a few days of star-growth history to mean anything — check
          back once tracking has run a while longer.
        </p>
      ) : (
        <ol className="mt-6 flex flex-col gap-3">
          {ranked.map(({ repo, summary }, index) => {
            const primaryCategory = repo.category[0];
            return (
              <li
                key={repo.slug}
                className="relative flex items-baseline gap-4 rounded-md border border-border-subtle bg-bg-elevated p-6 shadow-elevation-1 transition-shadow duration-[var(--duration-fast)] has-[a:hover]:shadow-elevation-2 has-[a:focus-visible]:shadow-elevation-2 has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-cta-fill"
              >
                <span
                  className="font-mono text-sm text-text-secondary"
                  aria-label={`Rank ${index + 1}`}
                >
                  {index + 1}
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <h2 className="font-sans text-lg font-semibold text-text-default">
                    {/* Same "stretched link" pattern as RepoCard/GroveCard
                        (docs/design/DESIGN-SYSTEM.md's Component patterns
                        spec): the row is a single focus stop, only one <a>
                        in the DOM, whole row clickable/hoverable via the
                        after:inset-0 pseudo-element. */}
                    <Link
                      href={`/repo/${repo.slug}`}
                      className="after:absolute after:inset-0 focus:outline-none"
                    >
                      {repo.name}
                    </Link>
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm text-text-secondary">
                    <span>{reason(summary)}</span>
                    {primaryCategory && (
                      <span className="inline-flex items-center rounded-sm bg-bg-subtle p-2 font-sans text-text-secondary">
                        {primaryCategory}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
