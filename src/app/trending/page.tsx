import type { Metadata } from "next";
import { getAllRepos } from "@/lib/content";
import { getGrowthSummaries, type GrowthSummary } from "@/lib/snapshots";
import { rankByAbsoluteGrowth } from "@/lib/trending";
import { TrendBoard } from "@/components/TrendBoard";
import { TrendHeader } from "@/components/TrendHeader";
import { leadParagraph, type TrendItem } from "@/lib/trend-view";

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

  const items: TrendItem[] = ranked.map(({ repo, summary }, index) => ({
    rank: index + 1,
    slug: repo.slug,
    name: repo.name,
    github: repo.github,
    category: repo.category[0] ?? null,
    blurb: leadParagraph(repo.body),
    reason: reason(summary),
    metric: formatDelta(summary.deltaStars),
    metricNote: "stars gained",
    value: summary.deltaStars,
    totalStars: summary.currentStars,
    days: summary.days,
  }));

  return (
    <div>
      <TrendHeader mode="hot" />
      <TrendBoard
        mode="hot"
        items={items}
        emptyMessage="Trending needs at least a few days of star-growth history to mean anything — check back once tracking has run a while longer."
      />
    </div>
  );
}
