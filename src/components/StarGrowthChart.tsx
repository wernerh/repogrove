import { getGrowthSummary, type SnapshotRow } from "@/lib/snapshots";

interface StarGrowthChartProps {
  history: SnapshotRow[];
}

const CHART_WIDTH = 320;
const CHART_HEIGHT = 64;
const CHART_PADDING = 4;

const numberFormatter = new Intl.NumberFormat("en-US");

/** SVG `points` for a `<polyline>` sparkline, oldest-first, scaled to fill the
 * chart's viewBox. Flat history (every value equal) still renders a flat
 * line across the middle rather than dividing by zero — `span` falls back
 * to `1` to avoid the division, but every point's fraction is then `0/1`,
 * which would otherwise pin the line to the bottom edge, not the middle;
 * the `isFlat` case below renders the midpoint explicitly instead. */
function buildSparklinePoints(history: SnapshotRow[]): string {
  const stars = history.map((row) => row.stars);
  const min = Math.min(...stars);
  const max = Math.max(...stars);
  const isFlat = max === min;
  const span = max - min || 1;
  const stepX = history.length > 1 ? (CHART_WIDTH - CHART_PADDING * 2) / (history.length - 1) : 0;

  return history
    .map((row, i) => {
      const x = CHART_PADDING + i * stepX;
      const y = isFlat
        ? CHART_HEIGHT / 2
        : CHART_HEIGHT - CHART_PADDING - ((row.stars - min) / span) * (CHART_HEIGHT - CHART_PADDING * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${numberFormatter.format(delta)}`;
  if (delta < 0) return numberFormatter.format(delta); // already carries "-"
  return "±0";
}

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
        ⭐ Star history isn&apos;t available yet — tracking begins with the next ingestion run.
      </p>
    );
  }

  const latest = history[history.length - 1];
  const summary = getGrowthSummary(history);

  if (!summary || summary.days === 0) {
    return (
      <p className="mt-6 font-sans text-sm text-text-secondary">
        ⭐ {numberFormatter.format(latest.stars)} stars — tracking started{" "}
        <time dateTime={latest.capturedOn}>{latest.capturedOn}</time>. Check back in a few days for growth history.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <p className="font-sans text-sm text-text-secondary">
        ⭐ {numberFormatter.format(summary.currentStars)} stars · {formatDelta(summary.deltaStars)} stars /{" "}
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
        <polyline points={buildSparklinePoints(history)} fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
