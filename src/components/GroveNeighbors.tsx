import Link from "next/link";
import StarIcon from "@/components/StarIcon";
import { numberFormatter } from "@/lib/format";

export interface Neighbor {
  slug: string;
  name: string;
  /** Primary category label, or undefined. */
  category?: string;
  stars: number | null;
}

/** Sidebar "Grove neighbors": other repos that share a Grove with this one, by stars. Real
 * Grove membership only; renders nothing when the repo has no neighbors. */
export default function GroveNeighbors({ neighbors }: { neighbors: Neighbor[] }) {
  if (neighbors.length === 0) return null;
  return (
    <section className="rounded-md border border-border-subtle bg-bg-elevated p-4 shadow-elevation-1 sm:p-6">
      <h2 className="mt-0 font-sans text-lg font-semibold text-text-default">Grove neighbors</h2>
      <p className="mt-1 font-sans text-sm text-text-secondary">Other repos in the same Groves.</p>
      <ul className="mt-3 flex list-none flex-col gap-3 p-0">
        {neighbors.map((n) => (
          <li key={n.slug} className="flex items-center justify-between gap-3">
            <div>
              <Link href={`/repo/${n.slug}`} className="font-sans text-sm font-medium text-text-link hover:underline">
                {n.name}
              </Link>
              {n.category && <p className="font-mono text-sm text-text-secondary">{n.category}</p>}
            </div>
            {n.stars !== null && (
              <span className="inline-flex items-center gap-1 font-mono text-sm text-text-secondary">
                <StarIcon />
                {numberFormatter.format(n.stars)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
