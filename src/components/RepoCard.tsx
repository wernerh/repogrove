import Link from "next/link";
import { firstParagraph, type Repo } from "@/lib/content";

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
}

const numberFormatter = new Intl.NumberFormat("en-US");

/**
 * Repo card — docs/design/DESIGN-SYSTEM.md's "Repo/Grove card" component
 * pattern (spec §8, §25): `bg.elevated`, `radius-md`, `elevation-1`,
 * `space-3` interior padding; header (name) + body (one-line description,
 * clamped 2 lines) + footer (stars, category tag).
 *
 * The entire card is a single focus stop (WCAG requirement, not a style
 * choice — see the pattern spec): the visible `<Link>` wraps only the name,
 * and its `after:absolute after:inset-0` pseudo-element stretches the real
 * click/hover target to the full card (the "stretched link" pattern) — so a
 * screen reader announces one concise link ("Ollama"), not the whole card's
 * text run, while the whole card is still clickable and only one `<a>`
 * exists in the DOM (no nested interactive elements).
 *
 * No momentum/"Heat" chip yet (component pattern spec's header-row
 * top-right slot) — that signal is computed, not hand-authored, and isn't
 * built yet (issue #21/ADR-004, data-gated per PROJECT_STATE.md). Wire it
 * into this header row once it exists, rather than a placeholder now — see
 * issue #52 for the icon-collision note to review at that point. Two more
 * footer fields the spec lists are likewise omitted, not fabricated:
 * "language" isn't captured by ingestion yet (see TECH-DEBT.md), and the
 * "why interesting" one-liner has no content-model field to draw from —
 * `content/repos/*.md`'s "Why people use it" is a bullet list, not a single
 * line, and this lane doesn't add data-model fields to invent one.
 */
export default function RepoCard({ repo, stars }: RepoCardProps) {
  const description = firstParagraph(repo.body);
  const primaryCategory = repo.category[0];

  return (
    <div
      className="relative flex flex-col gap-2 rounded-md border border-border-subtle bg-bg-elevated p-6 shadow-elevation-1 transition-shadow duration-[var(--duration-fast)] has-[a:hover]:shadow-elevation-2 has-[a:focus-visible]:shadow-elevation-2 has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-cta-fill"
    >
      <h3 className="font-sans text-lg font-semibold text-text-default">
        <Link
          href={`/repo/${repo.slug}`}
          className="after:absolute after:inset-0 focus:outline-none"
        >
          {repo.name}
        </Link>
      </h3>
      {description && (
        <p className="line-clamp-2 font-serif text-sm text-text-secondary">{description}</p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 font-mono text-sm text-text-secondary">
        {stars !== null && <span>⭐ {numberFormatter.format(stars)}</span>}
        {primaryCategory && (
          <span className="inline-flex items-center rounded-sm bg-bg-subtle p-2 font-sans text-text-secondary">
            {primaryCategory}
          </span>
        )}
      </div>
    </div>
  );
}
