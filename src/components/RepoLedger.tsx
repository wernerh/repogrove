export interface LedgerRow {
  label: string;
  value: string;
}

/** Sidebar "Repository ledger": label/value facts in mono, from real frontmatter and
 * snapshot fields only (license, status, categories, contributors, watchers, open
 * issues, tracking start). */
export default function RepoLedger({ rows }: { rows: LedgerRow[] }) {
  return (
    <section className="rounded-md border border-border-subtle bg-bg-elevated p-4 shadow-elevation-1 sm:p-6">
      <h2 className="mt-0 font-sans text-lg font-semibold text-text-default">Repository ledger</h2>
      <dl className="mt-3 divide-y divide-border-subtle">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0">
            <dt className="font-sans text-sm text-text-secondary">{row.label}</dt>
            <dd className="text-right font-mono text-sm text-text-default">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
