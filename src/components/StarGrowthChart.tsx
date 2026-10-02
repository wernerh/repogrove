import { getGrowthSummary, type SnapshotRow } from "@/lib/snapshots";
import StarIcon from "@/components/StarIcon";
import { formatDelta, numberFormatter } from "@/lib/format";
import { buildSparklinePoints } from "@/lib/sparkline";

interface StarGrowthChartProps {
  history: SnapshotRow[];
}

const CHART_WIDTH = 320;
const CHART_HEIGHT = 64;
const CHART_PADDING = 4;

/**
 * Star-growth chart for a repo page (issue #18). Degrades gracefully
 * through three states rather than assuming rich history exists:
 *  - no snapshots at all (before the first ingestion run, or a brand-new
 *    repo not yet captured) — a short explanatory line, no chart, no error;
 *  - exactly one snapshot — current count + when tracking started, no
 *    delta (a "+0" reading would misrepresent one data point as a trend);
 *  - two or more snapshots — the sparkline plus a growth figure computed
 *    over whatever span of history actually exists (see `getGrowthSummary`).
 */
export default function StarGrowthChart({ history }: StarGrowthChartProps) {
  if (history.length === 0) {
    return (
      <p className="mt-6 font-sans text-sm text-text-secondary">
        Star history isn&apos;t available yet — tracking begins with the next ingestion run.
      </p>
    );
  }

  const latest = history[history.length - 1];
  const summary = getGrowthSummary(history);

  if (!summary || summary.days === 0) {
    return (
      <p className="mt-6 font-sans text-sm text-text-secondary">
        <StarIcon className="mr-1 inline" />
        {numberFormatter.format(latest.stars)} stars — tracking started{" "}
        <time dateTime={latest.capturedOn}>{latest.capturedOn}</time>. Check back in a few days for growth history.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <p className="font-sans text-sm text-text-secondary">
        <StarIcon className="mr-1 inline" />
        {numberFormatter.format(summary.currentStars)} stars · {formatDelta(summary.deltaStars)} stars /{" "}
        {summary.days} day{summary.days === 1 ? "" : "s"} · tracking since{" "}
        <time dateTime={summary.trackingSince}>{summary.trackingSince}</time>
      </p>
      <svg
        role="img"
        aria-label={`Star history from ${history[0].capturedOn} (${numberFormatter.format(
          history[0].stars,
        )} stars) to ${latest.capturedOn} (${numberFormatter.format(latest.stars)} stars)`}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        className="mt-2 h-16 w-full max-w-xs text-cta-fill"
      >
        <polyline points={buildSparklinePoints(history.map((row) => row.stars), CHART_WIDTH, CHART_HEIGHT, CHART_PADDING)} fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
