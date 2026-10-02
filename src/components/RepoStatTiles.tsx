import { numberFormatter } from "@/lib/format";

export interface StatTile {
  label: string;
  /** Pre-formatted display value. `null` renders an em dash ("not tracked yet"), never a fake 0. */
  value: number | null;
  /** Optional small mono context line, e.g. "+233 / 5 days". */
  hint?: string;
}

/**
 * Hero stat strip on `/repo/:slug` (the details-page mockup's "stargazers /
 * forks / velocity / health" row). Only fields ingestion really captures
 * are fed in by the page — no invented "Health Index" — and a tile whose
 * value is unknown shows an em dash rather than 0.
 */
export default function RepoStatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border-subtle pt-6 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label}>
          <dt className="font-mono text-sm text-text-secondary">{tile.label}</dt>
          <dd className="mt-1 font-sans text-2xl font-semibold tracking-tight text-text-default">
            {tile.value === null ? "—" : numberFormatter.format(tile.value)}
            {tile.hint && (
              <span className="ml-2 font-mono text-sm font-normal text-text-secondary">{tile.hint}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
