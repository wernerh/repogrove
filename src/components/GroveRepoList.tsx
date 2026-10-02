"use client";

import { useMemo, useState } from "react";
import GroveRepoRow from "@/components/GroveRepoRow";
import {
  DEFAULT_PER_PAGE,
  PER_PAGE_OPTIONS,
  SORT_OPTIONS,
  deriveTabs,
  filterRows,
  paginate,
  sortRows,
  type GroveRow,
  type SortKey,
} from "@/lib/grove-view";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-fill";

const CHIP_BASE = `inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-sans text-sm font-medium transition-colors duration-[var(--duration-fast)] ${FOCUS_RING}`;
const CHIP_IDLE = "border-border-subtle bg-bg-elevated text-text-secondary hover:text-text-default";
const CHIP_ACTIVE = "border-cta-fill bg-cta-fill text-cta-text";

/**
 * The Grove page's filterable, sortable, paginated repository list.
 *
 * A Client Component only because filtering/sorting/paging are interactive;
 * the site is a static export (ADR-002) so all of it happens in the browser
 * over the already-built `rows`. The first render (page 1, "All", sorted by
 * stars) is what gets pre-rendered into the static HTML, so the list is
 * fully readable and indexable without JS.
 *
 * Accessibility: the category tabs are a labelled group of toggle buttons
 * (`aria-pressed`) rather than an ARIA tablist — they filter one list, they
 * don't switch between separate panels, so tab semantics would over-promise
 * arrow-key navigation. The result summary is a polite live region so a
 * screen-reader user hears the count change as they type or filter.
 */
export default function GroveRepoList({ rows, groveName }: { rows: GroveRow[]; groveName: string }) {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("stars");
  const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);
  const [page, setPage] = useState(1);

  const tabs = useMemo(() => deriveTabs(rows), [rows]);
  const visible = useMemo(
    () => sortRows(filterRows(rows, { tab, query }), sort),
    [rows, tab, query, sort],
  );
  const view = paginate(visible, page, perPage);
  const activeTab = tabs.find((t) => t.key === tab);

  function resetTo(next: { tab?: string; query?: string; sort?: SortKey; perPage?: number }) {
    if (next.tab !== undefined) setTab(next.tab);
    if (next.query !== undefined) setQuery(next.query);
    if (next.sort !== undefined) setSort(next.sort);
    if (next.perPage !== undefined) setPerPage(next.perPage);
    setPage(1);
  }

  const filtersActive = tab !== "all" || query.trim() !== "";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-border-subtle bg-bg-elevated p-4 shadow-elevation-1 sm:p-6">
        {tabs.length > 1 && (
          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={tab === t.key}
                onClick={() => resetTo({ tab: t.key })}
                className={`${CHIP_BASE} ${tab === t.key ? CHIP_ACTIVE : CHIP_IDLE}`}
              >
                {t.label}
                <span className="font-mono text-sm opacity-80">{t.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className={`${tabs.length > 1 ? "mt-4" : ""} flex flex-col gap-3 sm:flex-row sm:items-center`}>
          <div className="flex-1">
            <label htmlFor="grove-filter" className="sr-only">
              Filter repositories in {groveName}
            </label>
            <input
              id="grove-filter"
              type="search"
              value={query}
              onChange={(event) => resetTo({ query: event.target.value })}
              placeholder={`Filter repos in ${groveName}…`}
              autoComplete="off"
              className="w-full rounded-sm border border-border-default bg-bg-default px-3 py-2 font-sans text-sm text-text-default placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-cta-fill"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="grove-sort" className="font-sans text-sm text-text-secondary">
              Sort by
            </label>
            <select
              id="grove-sort"
              value={sort}
              onChange={(event) => resetTo({ sort: event.target.value as SortKey })}
              className="rounded-sm border border-border-default bg-bg-default px-3 py-2 font-sans text-sm text-text-default focus:outline-none focus:ring-2 focus:ring-cta-fill"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {view.total === 0 ? (
        <div className="rounded-md border border-border-subtle bg-bg-elevated p-6 text-center shadow-elevation-1 sm:p-8">
          <p className="font-sans text-base font-medium text-text-default">
            No repositories match
            {query.trim() !== "" && <> &ldquo;{query.trim()}&rdquo;</>}
            {tab !== "all" && activeTab && <> in {activeTab.label}</>}.
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={() => resetTo({ tab: "all", query: "" })}
              className={`mt-4 rounded-md border border-border-default bg-bg-default px-4 py-2 font-sans text-sm font-medium text-text-default hover:bg-bg-subtle ${FOCUS_RING}`}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <ul className="flex list-none flex-col gap-4 p-0">
          {view.items.map((row) => (
            <li key={row.slug}>
              <GroveRepoRow row={row} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-md border border-border-subtle bg-bg-elevated p-4 shadow-elevation-1">
        <p aria-live="polite" className="whitespace-nowrap font-mono text-sm text-text-secondary">
          Showing {view.from}–{view.to} of {view.total} {view.total === 1 ? "repository" : "repositories"}
        </p>

        {view.totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={view.page === 1}
              onClick={() => setPage(view.page - 1)}
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
                onClick={() => setPage(n)}
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
              onClick={() => setPage(view.page + 1)}
              className={`rounded-md border border-border-subtle px-3 py-1.5 font-sans text-sm text-text-default hover:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`}
            >
              <span aria-hidden="true">›</span>
            </button>
          </nav>
        )}

        <div role="group" aria-label="Repositories per page" className="flex items-center gap-2">
          <span className="whitespace-nowrap font-mono text-sm text-text-secondary">Per page:</span>
          {PER_PAGE_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={perPage === n}
              onClick={() => resetTo({ perPage: n })}
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
    </div>
  );
}
