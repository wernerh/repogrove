import type { Page } from "@/lib/grove-view";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-fill";

interface PaginationBarProps {
  /** The current page, from `paginate()` in `src/lib/grove-view.ts`. */
  view: Page<unknown>;
  perPage: number;
  perPageOptions: readonly number[];
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** Noun for the "Showing 1–6 of 14 …" summary. */
  noun?: { singular: string; plural: string };
}

/**
 * "Showing 1–6 of 14 repositories" + page buttons + per-page choice. Shared by
 * the Grove page's repo list and the homepage's Repositories section so both
 * paginate identically (extracted from `GroveRepoList` when the homepage became
 * the second caller).
 *
 * Presentational only — the owning Client Component holds the state. The pager
 * itself is hidden when everything fits on one page; the per-page choice always
 * shows. The summary is a polite live region so a screen-reader user hears the
 * range change; the current page is marked with `aria-current="page"`, and the
 * per-page buttons are `aria-pressed` toggles.
 */
export default function PaginationBar({
  view,
  perPage,
  perPageOptions,
  onPageChange,
  onPerPageChange,
  noun = { singular: "repository", plural: "repositories" },
}: PaginationBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-md border border-border-subtle bg-bg-elevated p-4 shadow-elevation-1">
      <p aria-live="polite" className="whitespace-nowrap font-mono text-sm text-text-secondary">
        Showing {view.from}–{view.to} of {view.total} {view.total === 1 ? noun.singular : noun.plural}
      </p>

      {view.totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous page"
            disabled={view.page === 1}
            onClick={() => onPageChange(view.page - 1)}
            className={`rounded-md border border-border-subtle px-3 py-1.5 font-sans text-sm text-text-default hover:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`}
          >
            <span aria-hidden="true">‹</span>
          </button>
          {Array.from({ length: view.totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Page ${n}`}
              aria-current={n === view.page ? "page" : undefined}
              onClick={() => onPageChange(n)}
              className={`min-w-9 rounded-md border px-3 py-1.5 font-mono text-sm ${FOCUS_RING} ${
                n === view.page
                  ? "border-cta-fill bg-cta-fill text-cta-text"
                  : "border-border-subtle text-text-default hover:bg-bg-subtle"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next page"
            disabled={view.page === view.totalPages}
            onClick={() => onPageChange(view.page + 1)}
            className={`rounded-md border border-border-subtle px-3 py-1.5 font-sans text-sm text-text-default hover:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`}
          >
            <span aria-hidden="true">›</span>
          </button>
        </nav>
      )}

      <div role="group" aria-label="Repositories per page" className="flex items-center gap-2">
        <span className="whitespace-nowrap font-mono text-sm text-text-secondary">Per page:</span>
        {perPageOptions.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={perPage === n}
            onClick={() => onPerPageChange(n)}
            className={`min-w-9 rounded-md border px-2 py-1 font-mono text-sm ${FOCUS_RING} ${
              perPage === n
                ? "border-cta-fill bg-cta-fill text-cta-text"
                : "border-border-subtle text-text-default hover:bg-bg-subtle"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
