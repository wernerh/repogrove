import Link from "next/link";
import type { Grove } from "@/lib/content";

interface GroveCardProps {
  grove: Grove;
  /** Number of repos whose frontmatter lists this Grove — from
   * `getReposInGrove`, computed by the caller so this component stays a
   * pure presentational one (no content-loader import of its own). */
  repoCount: number;
}

/**
 * Grove card — the same docs/design/DESIGN-SYSTEM.md "Repo/Grove card"
 * component pattern as RepoCard, adapted for a Grove: header (name) + body
 * (Grove's own one-line `description` frontmatter field, already the right
 * shape — no extraction needed) + footer (repo count, in place of a repo
 * card's stars/category, since neither applies to a Grove). See RepoCard's
 * doc comment for the shared "stretched link" a11y pattern and the omitted
 * momentum-chip header slot.
 */
export default function GroveCard({ grove, repoCount }: GroveCardProps) {
  return (
    <div
      className="relative flex flex-col gap-2 rounded-md border border-border-subtle bg-bg-elevated p-6 shadow-elevation-1 transition-shadow duration-[var(--duration-fast)] has-[a:hover]:shadow-elevation-2 has-[a:focus-visible]:shadow-elevation-2 has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-cta-fill"
    >
      <h3 className="font-sans text-lg font-semibold text-text-default">
        <Link href={`/grove/${grove.slug}`} className="after:absolute after:inset-0">
          {grove.name}
        </Link>
      </h3>
      <p className="line-clamp-2 font-serif text-sm text-text-secondary">{grove.description}</p>
      <p className="mt-auto pt-2 font-mono text-sm text-text-secondary">
        {repoCount} {repoCount === 1 ? "repo" : "repos"}
      </p>
    </div>
  );
}
