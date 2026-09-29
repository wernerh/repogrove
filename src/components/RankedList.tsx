import Link from "next/link";
import type { Repo } from "@/lib/content";

/**
 * Shared row/list rendering for `/trending` (#19) and `/rising` (#20) —
 * extracted per `docs/design/DESIGN-SYSTEM.md`'s Component patterns
 * "Next major task" note (design run 10/11): both pages copied a
 * near-identical ~40-line row block (rank span, stretched-link `<h2>`,
 * reason/category row, identical Tailwind classes down to the
 * `has-[a:...]` chain) rather than sharing it, since `/rising` was the
 * second consumer, not the first (see `TECH-DEBT.md`). Each page still
 * owns its own ranking math (`src/lib/trending.ts`/`rising.ts`) and its
 * own `reason(...)` formatting (the delta-vs-percent distinction between
 * the two pages is real content, not layout) — only the row/list chrome
 * moves here, unchanged pixel-for-pixel from both pages' prior markup so
 * every existing `/trending`/`/rising` test keeps passing unmodified.
 */
export interface RankedEntry {
  repo: Repo;
  /** Pre-formatted reason string — e.g. "+142 stars in the last 7 days"
   * or "+12.4% star growth in the last 7 days". Each page computes this
   * itself; this component just renders it. */
  reason: string;
}

export function RankedList({
  entries,
  emptyMessage,
}: {
  entries: RankedEntry[];
  /** Shown instead of the list when `entries` is empty — each page's own
   * wording (e.g. "Trending needs..." vs "Rising needs..."), not a
   * generic shared string. */
  emptyMessage: string;
}) {
  if (entries.length === 0) {
    return <p className="mt-6 font-sans text-sm text-text-secondary">{emptyMessage}</p>;
  }

  return (
    <ol className="mt-6 flex flex-col gap-3">
      {entries.map(({ repo, reason }, index) => (
        <RankingRow key={repo.slug} repo={repo} rank={index + 1} reason={reason} />
      ))}
    </ol>
  );
}

function RankingRow({ repo, rank, reason }: { repo: Repo; rank: number; reason: string }) {
  const primaryCategory = repo.category[0];

  return (
    <li
      className="relative flex items-baseline gap-4 rounded-md border border-border-subtle bg-bg-elevated p-6 shadow-elevation-1 transition-shadow duration-[var(--duration-fast)] has-[a:hover]:shadow-elevation-2 has-[a:focus-visible]:shadow-elevation-2 has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-cta-fill"
    >
      <span className="font-mono text-sm text-text-secondary" aria-label={`Rank ${rank}`}>
        {rank}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <h2 className="font-sans text-lg font-semibold text-text-default">
          {/* Same "stretched link" pattern as RepoCard/GroveCard
              (docs/design/DESIGN-SYSTEM.md's Component patterns spec):
              the row is a single focus stop, only one <a> in the DOM,
              whole row clickable/hoverable via the after:inset-0
              pseudo-element. */}
          <Link href={`/repo/${repo.slug}`} className="after:absolute after:inset-0 focus:outline-none">
            {repo.name}
          </Link>
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm text-text-secondary">
          <span>{reason}</span>
          {primaryCategory && (
            <span className="inline-flex items-center rounded-sm bg-bg-subtle p-2 font-sans text-text-secondary">
              {primaryCategory}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
