"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { searchEntries, type SearchEntry, type SearchEntryType } from "@/lib/search-match";

/**
 * `/search` (issue #63, ADR-008) — the client half of the static-index
 * search. `index` is built once at build time by the server component
 * (`src/app/search/page.tsx`) and passed in as a prop; everything here is
 * in-memory filtering over that already-fetched data, which is exactly what
 * `output: "export"` (no server runtime) allows — no request is ever made
 * for search results themselves.
 */
const TYPE_LABEL: Record<SearchEntryType, string> = {
  repo: "Repo",
  grove: "Grove",
  alternative: "Alternative",
};

export default function SearchBox({ index }: { index: SearchEntry[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchEntries(index, query), [index, query]);
  const trimmedQuery = query.trim();

  return (
    <div>
      <label htmlFor="search-input" className="sr-only">
        Search repositories, Groves and alternatives
      </label>
      <input
        id="search-input"
        type="search"
        autoComplete="off"
        placeholder="Search repositories, products, alternatives and groves…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full rounded-sm border border-border-default bg-bg-elevated px-4 py-3 font-sans text-base text-text-default placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-cta-fill"
      />

      <div aria-live="polite" className="mt-6">
        {trimmedQuery === "" ? (
          <p className="font-sans text-sm text-text-secondary">
            Start typing a repository name, product name, or category — e.g. &ldquo;ollama&rdquo;,
            &ldquo;notion&rdquo;, or &ldquo;self-hosted&rdquo;.
          </p>
        ) : results.length === 0 ? (
          <p className="font-sans text-sm text-text-secondary">
            No matches for &ldquo;{trimmedQuery}&rdquo;.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {results.map((result) => (
              <SearchResultRow key={`${result.type}-${result.slug}`} result={result} />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function SearchResultRow({ result }: { result: SearchEntry }) {
  return (
    <li className="relative flex flex-col gap-1 rounded-md border border-border-subtle bg-bg-elevated p-6 shadow-elevation-1 transition-shadow duration-[var(--duration-fast)] has-[a:hover]:shadow-elevation-2 has-[a:focus-visible]:shadow-elevation-2 has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-cta-fill">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="font-sans text-lg font-semibold text-text-default">
          {/* Same "stretched link" pattern as RepoCard/RankedList: one
              real <a>, whole row clickable, a screen reader announces
              just the title. */}
          <Link href={result.url} className="after:absolute after:inset-0 focus:outline-none">
            {result.title}
          </Link>
        </h2>
        <span className="inline-flex items-center rounded-sm bg-bg-subtle p-2 font-mono text-xs text-text-secondary">
          {TYPE_LABEL[result.type]}
        </span>
      </div>
      {result.description && (
        <p className="line-clamp-2 font-serif text-sm text-text-secondary">{result.description}</p>
      )}
    </li>
  );
}
