import type { Metadata } from "next";
import { getAllRepos } from "@/lib/content";
import { getGrowthSummaries } from "@/lib/snapshots";
import { rankByRelativeGrowth, type RisingEntry } from "@/lib/rising";
import { RankedList } from "@/components/RankedList";

export const metadata: Metadata = {
  title: "Rising",
  description:
    "Repositories RepoGrove tracks, ranked by relative GitHub star growth — spec §6's \"Rising Repositories\", surfacing fast movers rather than just the biggest.",
};

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Signs off the *rounded, displayed* value, not the raw one — `percent` is
 * a float (unlike `/trending`'s integer `deltaStars`), so a genuinely tiny
 * but nonzero value (e.g. 0.02%) would otherwise round to a display string
 * that still carries a "+"/"-" sign in front of "0.0%", reading like a
 * stray negative-zero glitch rather than the intended "no meaningful
 * change yet" signal. Rounding first and branching on the rounded value
 * keeps the sign and the digits consistent with each other.
 */
function formatPercent(percent: number): string {
  const rounded = Number(percentFormatter.format(percent));
  if (rounded > 0) return `+${percentFormatter.format(rounded)}%`;
  if (rounded < 0) return `${percentFormatter.format(rounded)}%`; // already carries "-"
  return "±0.0%";
}

/**
 * The spec's "one-line reason it's interesting" (§8), computed from real
 * growth data rather than an editorial claim this lane would have to
 * invent — no Grove Heat/momentum score exists yet to draw a richer reason
 * from (issue #21/ADR-004, separately data-gated). "star growth", not bare
 * "stars" (contrast `/trending`'s "+142 stars"): a percentage in front of
 * "stars" reads as a fraction of one star, not as a growth rate.
 */
function reason(entry: RisingEntry): string {
  return `${formatPercent(entry.percentGrowth)} star growth in the last ${entry.summary.days} day${
    entry.summary.days === 1 ? "" : "s"
  }`;
}

export default function RisingPage() {
  const repos = getAllRepos();
  const summaries = getGrowthSummaries(repos.map((repo) => repo.github));
  const ranked = rankByRelativeGrowth(repos, summaries);

  return (
    <div className="max-w-3xl">
      <h1 className="font-sans text-2xl font-semibold tracking-tight text-text-default">
        🌱 Rising
      </h1>
      <p className="mt-2 text-lg text-text-secondary">
        Tracked repositories ranked by star growth relative to their own size —
        surfacing fast movers, not just the biggest.
      </p>

      <RankedList
        entries={ranked.map((entry) => ({ repo: entry.repo, reason: reason(entry) }))}
        emptyMessage="Rising needs at least a few days of star-growth history to mean anything — check back once tracking has run a while longer."
      />
    </div>
  );
}
