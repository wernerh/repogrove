import Link from "next/link";
import type { Grove } from "@/lib/content";

interface GroveCardProps {
  grove: Grove;
  /** Number of repos whose frontmatter lists this Grove — from
   * `getReposInGrove`, computed by the caller so this component stays a
   * pure presentational one (no content-loader import of its own). */
  repoCount: number;
  /** Names of a few repos in this Grove, shown as a one-line preview
   * ("Ollama · vLLM · LangChain"). Computed by the caller from real
   * content; omitted when empty. */
  previewNames?: string[];
}

/**
 * Grove card — the same docs/design/DESIGN-SYSTEM.md "Repo/Grove card"
 * component pattern as RepoCard, adapted for a Grove: header (name + repo
 * count badge) + body (Grove's own one-line `description` frontmatter field)
 * + footer (preview of member repo names in mono). See RepoCard's doc
 * comment for the shared "stretched link" a11y pattern and the omitted
 * momentum-chip header slot.
 */
export default function GroveCard({ grove, repoCount, previewNames = [] }: GroveCardProps) {
  return (
    <div className="relative flex h-full flex-col gap-2 rounded-md border border-border-subtle bg-bg-elevated p-6 shadow-elevation-1 transition-shadow duration-[var(--duration-fast)] has-[a:hover]:shadow-elevation-2 has-[a:focus-visible]:shadow-elevation-2 has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-cta-fill">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-sans text-lg font-semibold text-text-default">
          <Link
            href={`/grove/${grove.slug}`}
            className="after:absolute after:inset-0 focus:outline-none"
          >
            {grove.name}
          </Link>
        </h3>
        <span className="inline-flex shrink-0 items-center rounded-sm bg-bg-brand-subtle px-2 py-1 font-mono text-sm text-text-on-brand-subtle">
          {repoCount} {repoCount === 1 ? "repo" : "repos"}
        </span>
      </div>
      <p className="line-clamp-3 font-sans text-sm text-text-secondary">{grove.description}</p>
      {previewNames.length > 0 && (
        <p className="mt-auto pt-3 font-mono text-sm text-text-secondary">
          {previewNames.join(" · ")}
        </p>
      )}
    </div>
  );
}
