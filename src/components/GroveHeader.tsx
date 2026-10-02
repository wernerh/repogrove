import { compactNumberFormatter, formatDelta, numberFormatter } from "@/lib/format";
import type { GroveStats } from "@/lib/grove-rows";
import type { RepoStatus } from "@/lib/content";

const MAX_LICENSES_SHOWN = 3;

const STATUS_SEGMENTS: { key: RepoStatus; label: string; barClassName: string }[] = [
  { key: "active", label: "active", barClassName: "bg-success-text" },
  { key: "maintained", label: "maintained", barClassName: "bg-warning-text" },
  { key: "inactive", label: "inactive", barClassName: "bg-text-secondary" },
];

/** Three-node "map" glyph on a brand tile — the same mark as the wordmark
 * (UX-2026-001: deliberately not a leaf), sized up as the Grove's avatar. */
function GroveGlyph() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-cta-fill text-cta-text"
    >
      <svg viewBox="0 0 16 16" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.25">
        <circle cx="8" cy="3.5" r="1.75" fill="currentColor" stroke="none" />
        <circle cx="3.5" cy="12" r="1.75" fill="currentColor" stroke="none" />
        <circle cx="12.5" cy="12" r="1.75" fill="currentColor" stroke="none" />
        <path d="M8 5.5 4.4 10.4M8 5.5l3.6 4.9M5.5 12h5" />
      </svg>
    </span>
  );
}

function Stat({ label, children, caption }: { label: string; children: React.ReactNode; caption?: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-sm text-text-secondary">{label}</dt>
      <dd className="mt-1">
        <span className="font-sans text-2xl font-semibold tracking-tight text-text-default">{children}</span>
        {caption && <span className="mt-1 block font-mono text-sm text-text-secondary">{caption}</span>}
      </dd>
    </div>
  );
}

/**
 * Grove header card: avatar + title + editorial description, a license-mix
 * line, and a four-figure stat strip. Every figure comes from `GroveStats`
 * (real content + snapshot data); a figure with nothing behind it renders an
 * em dash, never a made-up number.
 */
export default function GroveHeader({
  name,
  description,
  stats,
}: {
  name: string;
  description: string;
  stats: GroveStats;
}) {
  const shownLicenses = stats.licenses.slice(0, MAX_LICENSES_SHOWN);
  const hiddenLicenses = stats.licenses.length - shownLicenses.length;
  const statusTotal = STATUS_SEGMENTS.reduce((sum, s) => sum + stats.statusCounts[s.key], 0);

  return (
    <section
      aria-labelledby="grove-heading"
      className="rounded-md border border-border-subtle bg-bg-elevated p-4 shadow-elevation-1 sm:p-6"
    >
      <div className="flex items-start gap-4">
        <GroveGlyph />
        <div className="min-w-0">
          <h1
            id="grove-heading"
            className="font-sans text-2xl font-semibold tracking-tight text-text-default sm:text-3xl"
          >
            {name}
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-base text-text-secondary">{description}</p>
          {shownLicenses.length > 0 && (
            <p className="mt-3 font-mono text-sm text-text-secondary">
              Licenses:{" "}
              {shownLicenses.map((l, i) => (
                <span key={l.license}>
                  {i > 0 && " · "}
                  {l.license} <span className="text-text-default">×{l.count}</span>
                </span>
              ))}
              {hiddenLicenses > 0 && ` · +${hiddenLicenses} more`}
            </p>
          )}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-border-subtle pt-6 md:grid-cols-4">
        <Stat label="Total repositories">{stats.repoCount}</Stat>

        <Stat
          label="Collective stars"
          caption={
            stats.collectiveStars !== null && stats.trackedCount < stats.repoCount
              ? `${stats.trackedCount} of ${stats.repoCount} tracked`
              : undefined
          }
        >
          {stats.collectiveStars !== null ? (
            <span title={numberFormatter.format(stats.collectiveStars)}>
              {compactNumberFormatter.format(stats.collectiveStars)}
            </span>
          ) : (
            <span aria-label="not tracked yet">—</span>
          )}
        </Stat>

        <Stat
          label="Median star gain"
          caption={
            stats.medianDailyGain !== null
              ? `across ${stats.growthSampleSize} ${stats.growthSampleSize === 1 ? "repo" : "repos"}`
              : "Not enough history yet"
          }
        >
          {stats.medianDailyGain !== null ? (
            <>
              {formatDelta(Math.round(stats.medianDailyGain))}
              <span className="ml-1 font-mono text-sm font-normal text-text-secondary">/ day</span>
            </>
          ) : (
            <span aria-label="not enough history yet">—</span>
          )}
        </Stat>

        <div className="min-w-0">
          <dt className="font-mono text-sm text-text-secondary">Maintenance status</dt>
          <dd className="mt-3">
            <div
              role="img"
              aria-label={STATUS_SEGMENTS.filter((s) => stats.statusCounts[s.key] > 0)
                .map((s) => `${stats.statusCounts[s.key]} ${s.label}`)
                .join(", ")}
              className="flex h-2 w-full overflow-hidden rounded-sm bg-bg-subtle"
            >
              {STATUS_SEGMENTS.filter((s) => stats.statusCounts[s.key] > 0).map((s) => (
                <span
                  key={s.key}
                  className={s.barClassName}
                  style={{ width: `${(stats.statusCounts[s.key] / statusTotal) * 100}%` }}
                />
              ))}
            </div>
            <p className="mt-2 flex flex-wrap gap-x-3 font-mono text-sm">
              {STATUS_SEGMENTS.filter((s) => stats.statusCounts[s.key] > 0).map((s) => (
                <span key={s.key} className="inline-flex items-center gap-1 text-text-secondary">
                  {/* Swatch carries the colour; the label stays a body-contrast
                      colour (success/warning text fails 4.5:1 on bg.elevated in
                      dark mode) — and colour is never the only signal. */}
                  <span aria-hidden="true" className={`h-2 w-2 rounded-none ${s.barClassName}`} />
                  {stats.statusCounts[s.key]} {s.label}
                </span>
              ))}
            </p>
          </dd>
        </div>
      </dl>
    </section>
  );
}
