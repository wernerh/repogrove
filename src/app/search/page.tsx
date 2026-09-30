import type { Metadata } from "next";
import { buildSearchIndex } from "@/lib/search";
import SearchBox from "@/components/SearchBox";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search RepoGrove's repositories, Groves, and paid-product alternatives by name or category.",
};

/**
 * Search v1 (issue #63, ADR-008): `buildSearchIndex()` runs once at build
 * time (this is a Server Component, like every other page) and the result
 * is passed as a prop to `SearchBox`, a Client Component — that's the whole
 * "static index" architecture ADR-008 describes; no fetch, no API route,
 * no server needed at request time, compatible with `output: "export"`.
 */
export default function SearchPage() {
  const index = buildSearchIndex();

  return (
    <div>
      <h1 className="font-sans text-2xl font-semibold tracking-tight text-text-default">Search</h1>
      <p className="mt-2 font-serif text-lg text-text-secondary">
        Find repositories, Groves, and open-source alternatives by name or category.
      </p>

      <div className="mt-6">
        <SearchBox index={index} />
      </div>
    </div>
  );
}
