/**
 * Grove Heat / Momentum (spec §7, §23; issue #21; docs/adr/ADR-004-grove-heat-v1.md) —
 * pure computation kept separate from `src/lib/snapshots.ts` (SQLite reads),
 * same split `src/lib/trending.ts` (#19) and `src/lib/rising.ts` (#20)
 * already use, so it's unit-testable without a database.
 *
 * v1 SCOPE (see ADR-004 for the full reasoning): issue #21's proposed input
 * list — star growth rate, commit recency, release frequency, contributor
 * growth, issue/PR activity, GitHub-trending appearances, external mentions
 * — is mostly signals `data/repogrove.db` doesn't capture yet (commit
 * recency, release frequency, trending/mentions all need new ingestion
 * work, explicitly out of scope per the issue's own non-goals). Of what
 * *is* ingested today:
 *  - star growth is usable (3 calendar days of history per repo as of this
 *    ADR) and is what gates the label below;
 *  - open-issues counts are ingested but a raw delta doesn't reliably mean
 *    "more" or "less" active (a rising count can mean either growing
 *    attention or a growing backlog) — shown as a supplementary signal,
 *    never label-gating;
 *  - contributor counts exist in the schema but, per TECH-DEBT.md, only
 *    gained a non-null reading on the most recent snapshot for every
 *    tracked repo — a real delta isn't computable yet without treating a
 *    null->number jump as fake "growth". Reported as unavailable rather
 *    than fabricated.
 *
 * This intentionally does NOT reduce Heat to a single opaque score (spec
 * §7's explicit requirement) — `computeHeat` returns a labelled state
 * *plus* the underlying signals so a future UI can make them inspectable
 * on hover/expand, per docs/design/DESIGN-SYSTEM.md's Momentum/Heat
 * component contract.
 */
import type { SnapshotRow } from "@/lib/snapshots";
import { getGrowthBaseline, getGrowthSummary } from "@/lib/snapshots";

export type HeatLabel = "rising" | "active" | "slowing" | "dormant";

export interface HeatSignal {
  key: "star-growth" | "open-issues" | "contributor-growth";
  label: string;
  /** Human-readable value, e.g. "+0.064%/day" or "not enough data yet". */
  detail: string;
  available: boolean;
}

export interface HeatResult {
  label: HeatLabel;
  /** The signal that gates `label` — relative star growth, percent per day. */
  starGrowthPercentPerDay: number;
  /** Whole days the growth window spans (same convention as GrowthSummary.days). */
  days: number;
  /** Every input considered, available or not — for a future "inspect the
   * signals" UI (design system requirement), not just the badge alone. */
  signals: HeatSignal[];
}

/**
 * Provisional v1 thresholds (percent star growth per day, relative to each
 * repo's own baseline size — same relative-growth math `/rising` uses,
 * normalized per day so repos with different history lengths are
 * comparable). Picked against the first 5 tracked repos' real ~2-day
 * growth range (~0.024%–0.064%/day at the time this ADR was written) —
 * wide enough to produce more than one bucket on real data, not derived
 * from a sample large or varied enough to be anything but a starting
 * point. Revisit once more repos and more history accrue (see ADR-004).
 */
export const RISING_THRESHOLD_PCT_PER_DAY = 0.05;
export const ACTIVE_THRESHOLD_PCT_PER_DAY = 0.02;

/** Maps a relative daily star-growth rate to one of the four Heat states
 * docs/design/DESIGN-SYSTEM.md's Momentum/Heat component contract defines
 * (Rising/Active/Slowing/Dormant) — exported standalone so its boundary
 * behavior can be unit-tested independent of `computeHeat`'s DB-facing
 * plumbing. */
export function labelForGrowthRate(percentPerDay: number): HeatLabel {
  if (percentPerDay >= RISING_THRESHOLD_PCT_PER_DAY) return "rising";
  if (percentPerDay >= ACTIVE_THRESHOLD_PCT_PER_DAY) return "active";
  if (percentPerDay > 0) return "slowing";
  return "dormant";
}

function openIssuesSignal(baseline: SnapshotRow, latest: SnapshotRow): HeatSignal {
  const delta = latest.openIssues - baseline.openIssues;
  return {
    key: "open-issues",
    label: "Open issues",
    detail: `${delta >= 0 ? "+" : ""}${delta} since ${baseline.capturedOn}`,
    available: true,
  };
}

function contributorSignal(baseline: SnapshotRow, latest: SnapshotRow): HeatSignal {
  // See this module's doc comment: most repos only have a non-null
  // `contributors` reading on their latest snapshot today, so a delta
  // against an older `null` reading isn't a real number — report the
  // signal as unavailable ("omit, don't fabricate", the same convention
  // AlternativesTable/RepoCard use for other not-yet-ingested fields)
  // rather than showing a misleading jump from "no data" to some count.
  if (baseline.contributors === null || latest.contributors === null) {
    return {
      key: "contributor-growth",
      label: "Contributor growth",
      detail: "not enough data yet",
      available: false,
    };
  }
  const delta = latest.contributors - baseline.contributors;
  return {
    key: "contributor-growth",
    label: "Contributor growth",
    detail: `${delta >= 0 ? "+" : ""}${delta} since ${baseline.capturedOn}`,
    available: true,
  };
}

/**
 * Computes v1 Grove Heat from a repo's full snapshot history. Returns
 * `null` — never a fabricated "Dormant" — when there isn't enough history
 * to compute a real rate yet: no history at all, only one snapshot
 * (`GrowthSummary.days === 0`, same convention `/trending` and `/rising`
 * use), or a zero/negative baseline star count (would divide to
 * `Infinity`/`NaN`, the same guard `rankByRelativeGrowth` uses). Callers
 * should omit the chip entirely in that case rather than show anything,
 * matching every other "not enough data yet" signal in this codebase.
 *
 * A real `Dormant` result (flat or shrinking stars over the window) is a
 * fact worth showing, not something this function hides — same "don't
 * exclude bad news" convention `/trending`'s negative-growth repos use.
 */
export function computeHeat(unsortedHistory: SnapshotRow[]): HeatResult | null {
  const summary = getGrowthSummary(unsortedHistory);
  if (!summary || summary.days === 0) return null;

  const baselineStars = summary.currentStars - summary.deltaStars;
  if (baselineStars <= 0) return null;

  const percentPerDay = ((summary.deltaStars / baselineStars) * 100) / summary.days;
  const label = labelForGrowthRate(percentPerDay);

  // Same baseline row `getGrowthSummary` used for the star-growth delta
  // above (the oldest snapshot within the last 30 days, not necessarily
  // the absolute-earliest snapshot ever) — reusing it here, rather than
  // picking a separate "oldest" for the open-issues/contributor deltas,
  // keeps every signal on this chip describing the *same* time window. See
  // `getGrowthBaseline`'s doc comment in snapshots.ts for why that
  // otherwise silently diverges once a repo has >30 days of history.
  const baseline = getGrowthBaseline(unsortedHistory)!;
  const latest = [...unsortedHistory].sort((a, b) => a.capturedOn.localeCompare(b.capturedOn)).at(-1)!;

  const signals: HeatSignal[] = [
    {
      key: "star-growth",
      label: "Star growth",
      detail: `${percentPerDay >= 0 ? "+" : ""}${percentPerDay.toFixed(3)}%/day`,
      available: true,
    },
    openIssuesSignal(baseline, latest),
    contributorSignal(baseline, latest),
  ];

  return { label, starGrowthPercentPerDay: percentPerDay, days: summary.days, signals };
}
