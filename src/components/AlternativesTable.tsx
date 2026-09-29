import Link from "next/link";
import type { Repo } from "@/lib/content";
import StatusChip from "@/components/StatusChip";

/** One open-source alternative, resolved against `/content/repos` by the caller
 * (a server component — content/snapshot reads happen there, not in this
 * presentational component). `repo`/`stars` are both `null` when the
 * frontmatter slug doesn't match any `content/repos/*.md` file yet — most of
 * today's alternatives (spec §3-4 references LM Studio, Appwrite, etc. before
 * their own pages exist). Those rows still render, honestly labeled as not
 * yet profiled, rather than being silently dropped or linked to a page that
 * 404s.
 */
export interface ResolvedAlternative {
  /** The raw frontmatter slug, e.g. "lm-studio" — shown verbatim (mono, like
   * any other slug on this site) when unresolved, since humanizing it into a
   * "nice" title would fabricate a display name this content doesn't have. */
  slug: string;
  repo: Repo | null;
  stars: number | null;
}

interface AlternativesTableProps {
  openSource: ResolvedAlternative[];
  /** Commercial alternatives are plain product names (spec §4), not GitHub
   * repos — no stars/status/link to resolve, no future Phase-3 comparison
   * page to point at yet (PROJECT_STATE.md "Not doing yet"). */
  commercial: string[];
}

const numberFormatter = new Intl.NumberFormat("en-US");

/**
 * Alternatives comparison section — docs/design/DESIGN-SYSTEM.md's
 * "Alternatives comparison table" component pattern (spec §3-4), the site's
 * stated "killer feature": every repo page should answer "what else could I
 * use?" with structured facts, not a scrape.
 *
 * Replaces `content/repos/*.md`'s hand-authored "## Alternatives" prose
 * (explicitly a placeholder — see its own text, "until Phase 3 builds
 * alternative pages") on the rendered page only; the source Markdown keeps
 * that prose untouched for anyone reading the raw file (see
 * `splitOutSection` in `src/lib/content.ts`).
 *
 * Deliberate v1 reductions from the original spec line, recorded here rather
 * than silently dropped:
 *  - **Not interactively sortable** (`aria-sort` et al.): the original spec
 *    line called for sortable stars/language/activity/hosting columns, but
 *    `language`/`hosting` aren't captured by ingestion or content yet (same
 *    "omit, don't fabricate" reasoning as the repo card's momentum/language
 *    omissions — see RepoCard.tsx), leaving only one real numeric column
 *    (stars). A one-column table doesn't need interactive sort controls —
 *    pre-sorting by stars descending, unresolved rows last, gives the same
 *    result a sort-by-stars click would, without a client component. Revisit
 *    once a second real sortable column exists.
 *  - **Momentum/"Heat" column: omitted**, not built (issue #21/ADR-004,
 *    data-gated) — same reasoning as the repo card and status chip.
 *  - **Unresolved alternatives are not links** — an alternative slug with no
 *    matching `content/repos/*.md` file yet has nowhere real to point to;
 *    linking it would 404. Shown as its raw slug (mono, secondary text) with
 *    a "not yet profiled" label instead.
 */
export default function AlternativesTable({ openSource, commercial }: AlternativesTableProps) {
  if (openSource.length === 0 && commercial.length === 0) {
    return (
      <section className="mt-6">
        <h2 className="font-sans text-xl font-semibold text-text-default">Alternatives</h2>
        <p className="mt-2 font-serif text-sm text-text-secondary">
          No alternatives documented yet.
        </p>
      </section>
    );
  }

  // Resolved-with-stars first (highest stars first), then resolved-without-
  // history, then unresolved — never a fabricated "0" for a repo that just
  // hasn't been star-tracked yet vs. one that has no page at all.
  const sorted = [...openSource].sort((a, b) => {
    if (a.stars !== null && b.stars !== null) return b.stars - a.stars;
    if (a.stars !== null) return -1;
    if (b.stars !== null) return 1;
    if (a.repo && !b.repo) return -1;
    if (!a.repo && b.repo) return 1;
    return 0;
  });

  return (
    <section className="mt-6">
      <h2 className="font-sans text-xl font-semibold text-text-default">Alternatives</h2>

      {openSource.length > 0 && (
        // overflow-x-auto is a safety net, not the primary mobile strategy: the
        // least essential column (Category) hides below Tailwind's default `sm`
        // breakpoint (640px — matches this project's own mobile screenshot
        // viewport, 390px) so the three columns that answer "what is it, is it
        // active, how big is it" fit without requiring horizontal scroll at all.
        // Verified against a real screenshot (docs/design/screenshots/
        // repo-ollama__mobile-*.png) — see DESIGN-SYSTEM.md's built-note.
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[20rem] border-collapse text-left font-sans text-sm sm:min-w-[28rem]">
            <caption className="sr-only">Open-source alternatives</caption>
            <thead>
              <tr className="border-b border-border-default">
                <th scope="col" className="py-2 pr-4 text-left font-medium text-text-secondary">
                  Project
                </th>
                <th scope="col" className="py-2 pr-4 text-left font-medium text-text-secondary">
                  Status
                </th>
                <th scope="col" className="py-2 pr-4 text-left font-medium text-text-secondary">
                  Stars
                </th>
                <th
                  scope="col"
                  className="hidden py-2 text-left font-medium text-text-secondary sm:table-cell"
                >
                  Category
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((alt) => (
                <tr
                  key={alt.slug}
                  className="border-b border-border-subtle last:border-b-0 hover:bg-bg-subtle"
                >
                  <th scope="row" className="py-2 pr-4 text-left font-normal">
                    {alt.repo ? (
                      <Link href={`/repo/${alt.repo.slug}`} className="text-text-link hover:underline">
                        {alt.repo.name}
                      </Link>
                    ) : (
                      <span className="font-mono text-text-secondary">{alt.slug}</span>
                    )}
                  </th>
                  <td className="py-2 pr-4">
                    {alt.repo ? (
                      <StatusChip status={alt.repo.status} />
                    ) : (
                      <span className="text-text-secondary">Not yet profiled</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 font-mono text-text-secondary">
                    {alt.stars !== null ? `⭐ ${numberFormatter.format(alt.stars)}` : "—"}
                  </td>
                  {/* Primary category only, same as RepoCard.tsx's card footer —
                      not the repo page header's full comma-joined list, which
                      has more room; a dense table column doesn't. Hidden below
                      sm (see the table's own comment above) — least essential
                      column, dropped first rather than forcing horizontal
                      scroll on mobile for it. */}
                  <td className="hidden py-2 text-text-secondary sm:table-cell">
                    {alt.repo ? alt.repo.category[0] ?? "—" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {commercial.length > 0 && (
        <div className="mt-4">
          <h3 className="font-sans text-sm font-medium text-text-secondary">
            Commercial alternatives
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {commercial.map((name) => (
              <li
                key={name}
                className="rounded-sm bg-bg-subtle p-2 font-sans text-sm text-text-secondary"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
