import Link from "next/link";
import StarIcon from "@/components/StarIcon";
import { formatDelta, numberFormatter } from "@/lib/format";
import type { GroveRow } from "@/lib/grove-view";
import { buildSparklinePoints } from "@/lib/sparkline";
import type { RepoStatus } from "@/lib/content";

const MAX_ALTERNATIVES_SHOWN = 3;
const SPARK_W = 72;
const SPARK_H = 24;

const STATUS: Record<RepoStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "text-success-text" },
  maintained: { label: "Maintained", className: "text-warning-text" },
  inactive: { label: "Inactive", className: "text-text-secondary" },
};

/**
 * One repository row on a Grove page (`/grove/[slug]`).
 *
 * Same single-focus-stop pattern as `RepoCard` (DESIGN-SYSTEM.md "Repo/Grove
 * card"): the only `<a>` wraps the repo name and its `after:absolute
 * after:inset-0` pseudo-element stretches the click target over the whole
 * card, so a screen reader announces one concise link rather than the card's
 * text run and no interactive element is nested inside another. That is also
 * why the alternatives are plain chips and not links, and why "View
 * intelligence" is a decorative affordance (`aria-hidden`) rather than a
 * second link to the same URL.
 *
 * Every field is real data. The status is the editorial `status` frontmatter
 * (icon swatch + label — colour is never the only signal). The sparkline and
 * delta come from the repo's own snapshot history and are omitted until two
 * snapshots exist; stars are omitted (not shown as 0) when untracked.
 */
export default function GroveRepoRow({ row }: { row: GroveRow }) {
  const status = STATUS[row.status];
  const shownAlternatives = row.alternatives.slice(0, MAX_ALTERNATIVES_SHOWN);
  const hiddenAlternatives = row.alternatives.length - shownAlternatives.length;
  const hasTrend = row.trend.length >= 2 && row.days > 0 && row.deltaStars !== null;

  return (
    <div className="relative rounded-md border border-border-subtle bg-bg-elevated p-4 shadow-elevation-1 transition-shadow duration-[var(--duration-fast)] has-[a:hover]:shadow-elevation-2 has-[a:focus-visible]:shadow-elevation-2 has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-cta-fill sm:p-6">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-bg-brand-subtle font-mono text-sm font-semibold text-text-on-brand-subtle"
        >
          {row.initials}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-sans text-base font-semibold text-text-default">
            <Link href={`/repo/${row.slug}`} className="after:absolute after:inset-0 focus:outline-none">
              {row.owner} / {row.repoName}
            </Link>
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-sm text-text-secondary">
            {/* Pill on `bg.subtle` — the same surface StatusChip uses: the dark-mode
                success/warning text colours only reach 4.5:1 there, not on the
                lighter `bg.elevated` card behind it (caught by the axe scan). */}
            <span
              className={`inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-subtle px-2 py-0.5 ${status.className}`}
            >
              <span aria-hidden="true" className="h-2 w-2 rounded-none bg-current" />
              {status.label}
            </span>
            <span aria-hidden="true">·</span>
            <span>{row.license}</span>
          </p>
        </div>
        {row.stars !== null && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-border-subtle bg-bg-subtle px-2 py-1 font-mono text-sm text-text-default"
            aria-label={`${numberFormatter.format(row.stars)} stars`}
          >
            <StarIcon />
            {numberFormatter.format(row.stars)}
          </span>
        )}
      </div>

      {row.description && (
        <p className="mt-4 line-clamp-2 font-sans text-sm text-text-secondary">{row.description}</p>
      )}

      {shownAlternatives.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-text-secondary">Alternative to:</span>
          {shownAlternatives.map((name) => (
            <span
              key={name}
              className="rounded-sm border border-border-subtle bg-bg-subtle px-2 py-1 font-mono text-sm text-text-default"
            >
              {name}
            </span>
          ))}
          {hiddenAlternatives > 0 && (
            <span className="font-mono text-sm text-text-secondary">+{hiddenAlternatives} more</span>
          )}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border-subtle pt-3">
        <ul className="flex list-none flex-wrap gap-2 p-0 font-mono text-sm text-text-secondary">
          {row.categories.map((tag) => (
            <li key={tag} className="rounded-sm bg-bg-brand-subtle px-2 py-1 text-text-on-brand-subtle">
              {tag}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          {hasTrend && (
            <span className="inline-flex items-center gap-2 font-mono text-sm text-text-secondary">
              <svg
                aria-hidden="true"
                viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
                preserveAspectRatio="none"
                className="h-6 w-[72px] text-cta-fill"
              >
                <polyline
                  points={buildSparklinePoints(row.trend, SPARK_W, SPARK_H, 2)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <span>
                {formatDelta(row.deltaStars as number)} / {row.days}d
              </span>
            </span>
          )}
          <span aria-hidden="true" className="font-sans text-sm font-medium text-text-link">
            View intelligence →
          </span>
        </div>
      </div>
    </div>
  );
}
