import Link from "next/link";
import { numberFormatter } from "@/lib/format";
import type { RepoStatus } from "@/lib/content";

export interface MatrixColumn {
  slug: string;
  name: string;
  isCurrent: boolean;
  stars: number | null;
  contributors: number | null;
  forks: number | null;
  status: RepoStatus;
  license: string;
}

const STATUS_LABEL: Record<RepoStatus, string> = {
  active: "Active",
  maintained: "Maintained",
  inactive: "Inactive",
};

const fmt = (n: number | null) => (n === null ? "—" : numberFormatter.format(n));

/**
 * "How it compares" matrix (the details-page mockup's decision matrix), built only from
 * facts we actually hold for every column: stars, contributors, forks, editorial status
 * and license. Deliberately no free-text "Self-hosting / Ideal workload" rows — that
 * would need new hand-authored fields (data-model work, not this lane). Renders
 * nothing unless at least one alternative resolves to a profiled repo.
 */
export default function ComparisonMatrix({ columns }: { columns: MatrixColumn[] }) {
  if (columns.length < 2) return null;
  const rows: { label: string; render: (c: MatrixColumn) => string }[] = [
    { label: "Stars", render: (c) => fmt(c.stars) },
    { label: "Contributors", render: (c) => fmt(c.contributors) },
    { label: "Forks", render: (c) => fmt(c.forks) },
    { label: "Status", render: (c) => STATUS_LABEL[c.status] },
    { label: "License", render: (c) => c.license },
  ];
  return (
    <section>
      <h2 className="mt-0 font-sans text-xl font-semibold text-text-default">How it compares</h2>
      <p className="mt-1 font-sans text-sm text-text-secondary">
        Side-by-side facts against the alternatives we&apos;ve profiled.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-left font-sans text-sm">
          <caption className="sr-only">Comparison with profiled open-source alternatives</caption>
          <thead>
            <tr className="border-b border-border-default">
              <th scope="col" className="py-2 pr-4 font-mono text-sm font-normal text-text-secondary">
                Parameter
              </th>
              {columns.map((c) => (
                <th
                  key={c.slug}
                  scope="col"
                  className={`px-3 py-2 font-sans text-sm font-semibold ${
                    c.isCurrent ? "bg-bg-brand-subtle text-text-on-brand-subtle" : "text-text-default"
                  }`}
                >
                  {c.isCurrent ? (
                    c.name
                  ) : (
                    <Link href={`/repo/${c.slug}`} className="text-text-link hover:underline">
                      {c.name}
                    </Link>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border-subtle last:border-b-0">
                <th scope="row" className="py-2 pr-4 font-sans text-sm font-normal text-text-secondary">
                  {row.label}
                </th>
                {columns.map((c) => (
                  <td
                    key={c.slug}
                    className={`px-3 py-2 font-mono text-sm text-text-default ${c.isCurrent ? "bg-bg-brand-subtle" : ""}`}
                  >
                    {row.render(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
