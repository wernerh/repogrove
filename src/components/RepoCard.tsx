import Link from "next/link";
import { firstParagraph, type Repo } from "@/lib/content";
import StarIcon from "@/components/StarIcon";

interface RepoCardProps {
  repo: Repo;
  /**
   * Latest known star count (from `data/repogrove.db`, computed by the
   * caller via `getGrowthSummaries`' `currentStars`), or `null` if no
   * snapshot history exists yet for this repo. The card omits the stat
   * rather than showing a fabricated "0 stars" — same "no data yet"
   * convention StarGrowthChart already uses on the repo page.
   */
  stars: number | null;
  /**
   * Display names of this repo's open-source alternatives (resolved by the
   * caller from `repo.alternatives.open_source`; an unresolved slug passes
   * through as-is). Rendered as a one-line "alt:" footer — the site's core
   * "what else could I use?" question, answered on the card itself. Omitted
   * when empty.
   */
  alternatives?: string[];
}

const numberFormatter = new Intl.NumberFormat("en-US");
const MAX_ALTERNATIVES_SHOWN = 2;

/**
 * Repo card — docs/design/DESIGN-SYSTEM.md's "Repo/Grove card" component
 * pattern (spec §8, §25), Precision Editorial refresh: `bg.elevated`,
 * `radius-md`, `elevation-1`, `space-3` interior padding; header (name +
 * primary-category badge, top-right) + body (one-line description, clamped
 * 2 lines) + footer (amber star count, "alt:" line in mono).
 *
 * The entire card is a single focus stop (WCAG requirement, not a style
 * choice — see the pattern spec): the visible `<Link>` wraps only the name,
 * and its `after:absolute after:inset-0` pseudo-element stretches the real
 * click/hover target to the full card (the "stretched link" pattern) — so a
 * screen reader announces one concise link ("Ollama"), not the whole card's
 * text run, while the whole card is still clickable and only one `<a>`
 * exists in the DOM (no nested interactive elements).
 *
 * No momentum/"Heat" chip yet (component pattern spec's header-row slot) —
 * that signal is computed and isn't wired into cards; wire it in once the
 * per-card data path exists (see issue #52 for the icon-collision note).
 * "language" and a "why interesting" one-liner remain omitted, not
 * fabricated: no ingestion field or content-model field holds them.
 */
export default function RepoCard({ repo, stars, alternatives = [] }: RepoCardProps) {
  const description = firstParagraph(repo.body);
  const primaryCategory = repo.category[0];
  const shownAlternatives = alternatives.slice(0, MAX_ALTERNATIVES_SHOWN);

  return (
    <div className="relative flex h-full flex-col gap-2 rounded-md border border-border-subtle bg-bg-elevated p-6 shadow-elevation-1 transition-shadow duration-[var(--duration-fast)] has-[a:hover]:shadow-elevation-2 has-[a:focus-visible]:shadow-elevation-2 has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-cta-fill">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-sans text-lg font-semibold text-text-default">
          <Link
            href={`/repo/${repo.slug}`}
            className="after:absolute after:inset-0 focus:outline-none"
          >
            {repo.name}
          </Link>
        </h3>
        {primaryCategory && (
          <span className="inline-flex shrink-0 items-center rounded-sm bg-bg-brand-subtle px-2 py-1 font-mono text-sm text-text-on-brand-subtle">
            {primaryCategory}
          </span>
        )}
      </div>
      {description && (
        <p className="line-clamp-2 font-sans text-sm text-text-secondary">{description}</p>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-3 font-mono text-sm text-text-secondary">
        {stars !== null ? (
          <span className="inline-flex items-center gap-1">
            <StarIcon />
            {numberFormatter.format(stars)}
          </span>
        ) : (
          <span />
        )}
        {shownAlternatives.length > 0 && <span>alt: {shownAlternatives.join(", ")}</span>}
      </div>
    </div>
  );
}
