import Link from "next/link";
import NewsletterSignupForm from "@/components/NewsletterSignupForm";
import { formatDelta } from "@/lib/format";
import type { GroveRow } from "@/lib/grove-view";

export interface RelatedGrove {
  slug: string;
  name: string;
  repoCount: number;
}

const CARD = "rounded-md border border-border-subtle bg-bg-elevated p-4 shadow-elevation-1 sm:p-6";
const DOT_CLASSES = ["bg-cta-fill", "bg-accent-star", "bg-info-text", "bg-success-text"];

/**
 * Right-hand column of the Grove page: Trendspotting, Related Groves and the
 * newsletter signup. Each card renders only when it has real content —
 * Trendspotting needs at least one repo with a positive star gain, Related
 * Groves needs resolvable `related_groves` frontmatter — so a sparse Grove
 * degrades to fewer cards rather than empty ones.
 *
 * (The mockup's "Maintainer Radar" is not built: no ingestion field or
 * content-model field holds maintainers — see DESIGN-SYSTEM.md's "Still not
 * built" list. It's a dev-lane/owner item, not something to fake here.)
 */
export default function GroveSidebar({
  gainers,
  related,
}: {
  gainers: GroveRow[];
  related: RelatedGrove[];
}) {
  return (
    <aside aria-label="Grove highlights" className="flex flex-col gap-6">
      {gainers.length > 0 && (
        <section className={CARD}>
          <h2 className="font-sans text-lg font-semibold text-text-default">Trendspotting</h2>
          <p className="mt-1 font-sans text-sm text-text-secondary">
            Biggest star gains in this Grove over each repo&apos;s tracked window.
          </p>
          <ol className="mt-4 flex list-none flex-col gap-3 p-0">
            {gainers.map((row) => (
              <li key={row.slug} className="flex items-center gap-3 rounded-sm bg-bg-subtle p-3">
                <span
                  aria-hidden="true"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-bg-brand-subtle font-mono text-sm font-semibold text-text-on-brand-subtle"
                >
                  {row.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/repo/${row.slug}`}
                    className="block break-words font-sans text-sm font-semibold text-text-default hover:underline"
                  >
                    {row.owner} / {row.repoName}
                  </Link>
                  <div className="mt-0.5 flex items-baseline justify-between gap-3 font-mono text-sm">
                    <span className="min-w-0 truncate text-text-secondary">
                      {row.categories.slice(0, 3).join(" · ")}
                    </span>
                    <span className="shrink-0 text-success-text">
                      <span aria-hidden="true">↗ </span>
                      {formatDelta(row.deltaStars as number)}
                      <span className="text-text-secondary"> / {row.days}d</span>
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {related.length > 0 && (
        <section className={CARD}>
          <h2 className="font-sans text-lg font-semibold text-text-default">Related Groves</h2>
          <ul className="mt-4 flex list-none flex-col gap-3 p-0">
            {related.map((grove, i) => (
              <li key={grove.slug} className="flex items-center justify-between gap-3">
                <Link
                  href={`/grove/${grove.slug}`}
                  className="inline-flex items-center gap-3 font-sans text-sm font-medium text-text-default hover:underline"
                >
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 rounded-full ${DOT_CLASSES[i % DOT_CLASSES.length]}`}
                  />
                  {grove.name}
                </Link>
                <span className="font-mono text-sm text-text-secondary">
                  {grove.repoCount} {grove.repoCount === 1 ? "repo" : "repos"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={CARD}>
        <h2 className="font-sans text-lg font-semibold text-text-default">Grove Digest</h2>
        <div className="mt-1">
          <NewsletterSignupForm />
        </div>
      </section>
    </aside>
  );
}
