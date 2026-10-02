"use client";

import { useState, type ReactNode } from "react";
import PaginationBar from "@/components/PaginationBar";
import { paginate } from "@/lib/grove-view";

interface PaginatedCardGridProps {
  /** Pre-rendered cards. A Server Component renders them and passes the nodes
   * down, so card components that read `/content` (`RepoCard` imports the
   * fs-backed content loader) never enter the client bundle. */
  items: { key: string; node: ReactNode }[];
  perPageOptions?: readonly number[];
  defaultPerPage?: number;
  /** Grid classes for the list (the homepage uses a two-column grid). */
  className?: string;
}

/**
 * Client-side paging over an already-rendered card list — used by the
 * homepage's Repositories section so 22+ cards don't make one endless scroll.
 * The site is a static export (ADR-002), so paging happens in the browser; the
 * first page is what's pre-rendered into the static HTML.
 */
export default function PaginatedCardGrid({
  items,
  perPageOptions = [5, 10, 20],
  defaultPerPage = 10,
  className = "grid grid-cols-1 gap-6 md:grid-cols-2",
}: PaginatedCardGridProps) {
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [page, setPage] = useState(1);
  const view = paginate(items, page, perPage);

  return (
    <div className="flex flex-col gap-6">
      <ul className={`list-none p-0 ${className}`}>
        {view.items.map((item) => (
          <li key={item.key}>{item.node}</li>
        ))}
      </ul>
      <PaginationBar
        view={view}
        perPage={perPage}
        perPageOptions={perPageOptions}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      />
    </div>
  );
}
