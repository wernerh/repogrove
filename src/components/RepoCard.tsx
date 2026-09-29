import Link from "next/link";
import type { Repo } from "@/lib/content";

interface RepoCardProps {
  repo: Repo;
  /**
   * Latest known star count (from `data/repogrove.db`, computed by the
   * caller via `getSnapshotHistory`), or `null` if no snapshot history
   * exists yet for this repo. The card omits the stat rather than showing
   * a fabricated "0 stars" — same "no data yet" convention StarGrowthChart
   * already uses on the repo page.
   */
  stars: number | null;
}

const numberFormatter = new Intl.NumberFormat("en-US");

/**
 * `content/repos/*.md` bodies conventionally open with a one-sentence
 * plain-English description ("Run large language models locally.") before
 * their "## What it does" section — exactly the "one-line plain-English
 * description" docs/design/DESIGN-SYSTEM.md's Repo/Grove card spec calls
 * for. Pulling just that first paragraph keeps the card in sync with the
 * hand-authored editorial copy (never a second, competing description) —
 * the full body, headings included, still renders in full on the repo page
 * itself, unmodified.
 */
function firstParagraph(body: string): string {
  const paragraph = body.split(/\n\s*\n/)[0] ?? "";
  return paragraph.replace(/\s+/g, " ").trim();
}

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
 * issue #52 for the icon-collision note to review at that point. `language`
 * is likewise omitted: it isn't captured by ingestion yet (see TECH-DEBT.md)
 * and this lane doesn't add data-model fields to get one.
 */
export default function RepoCard({ repo, stars }: RepoCardProps) {
  const description = firstParagraph(repo.body);
  const primaryCategory = repo.category[0];

  return (
    <div
      className="relative flex flex-col gap-2 rounded-md border border-border-subtle bg-bg-elevated p-6 shadow-elevation-1 transition-shadow duration-[var(--duration-fast)] has-[a:hover]:shadow-elevation-2 has-[a:focus-visible]:shadow-elevation-2 has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-cta-fill"
    >
      <h3 className="font-sans text-lg font-semibold text-text-default">
        <Link href={`/repo/${repo.slug}`} className="after:absolute after:inset-0">
          {repo.name}
        </Link>
      </h3>
      {description && (
        <p className="line-clamp-2 font-serif text-sm text-text-secondary">{description}</p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 font-mono text-sm text-text-secondary">
        {stars !== null && <span>⭐ {numberFormatter.format(stars)}</span>}
        {primaryCategory && (
          <span className="inline-flex items-center rounded-sm bg-bg-subtle px-2 py-1 font-sans text-text-secondary">
            {primaryCategory}
          </span>
        )}
      </div>
    </div>
  );
}
