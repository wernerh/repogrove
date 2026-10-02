import type { GroveRow } from "@/lib/grove-view";

/** Shared test fixture: a fully-populated `GroveRow` with per-test overrides. */
export function makeRow(overrides: Partial<GroveRow> & { slug: string }): GroveRow {
  const repoName = overrides.repoName ?? overrides.slug;
  return {
    github: `acme/${repoName}`,
    owner: "acme",
    repoName,
    name: repoName,
    initials: repoName.slice(0, 2).toUpperCase(),
    description: `${repoName} does a thing.`,
    status: "active",
    license: "MIT",
    categories: ["devtools"],
    alternatives: [],
    stars: 100,
    deltaStars: 10,
    days: 2,
    trend: [90, 100],
    latestCapturedOn: "2026-10-02",
    ...overrides,
  };
}
