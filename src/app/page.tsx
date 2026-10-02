import Link from "next/link";
import { getAllGroves, getAllRepos, getRepo, getReposInGrove } from "@/lib/content";
import { getGrowthSummaries } from "@/lib/snapshots";
import GroveCard from "@/components/GroveCard";
import PaginatedCardGrid from "@/components/PaginatedCardGrid";
import RepoCard from "@/components/RepoCard";
import NewsletterSignupForm from "@/components/NewsletterSignupForm";

const GROVE_PREVIEW_COUNT = 3;

export default function Home() {
  const groves = getAllGroves();
  const repos = getAllRepos();
  // Opens data/repogrove.db once for every repo card, rather than the
  // previous per-card getSnapshotHistory() call (TECH-DEBT.md, 2026-09-29
  // N+1 row) — getGrowthSummary's currentStars is the same "latest known
  // star count" the old latestStars() helper computed, so this is a
  // behavior-preserving swap, not a UI change.
  const growthByRepo = getGrowthSummaries(repos.map((repo) => repo.github));

  return (
    <div className="flex flex-col gap-16">
      <section aria-labelledby="hero-heading">
        <p className="inline-flex items-center gap-2 rounded-sm bg-bg-brand-subtle px-2 py-1 font-mono text-sm text-text-on-brand-subtle">
          {repos.length} curated repositories
        </p>
        <h1
          id="hero-heading"
          className="mt-4 max-w-3xl font-sans text-4xl font-semibold tracking-tight text-text-default"
        >
          Discover the projects shaping open source.
        </h1>
        <p className="mt-4 max-w-2xl font-sans text-lg text-text-secondary">
          RepoGrove is a curated map of the open-source ecosystem — what a
          project actually does, whether it&apos;s active, and what else you
          could use instead.
        </p>

        <Link
          href="/search"
          className="mt-8 flex max-w-2xl items-center gap-3 rounded-md border border-border-default bg-bg-elevated px-4 py-3 font-sans text-base text-text-secondary shadow-elevation-1 transition-shadow duration-[var(--duration-fast)] hover:shadow-elevation-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-fill"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="4.5" />
            <path d="m10.5 10.5 3 3" />
          </svg>
          Search repositories, products, alternatives and groves…
        </Link>
      </section>

      <section id="groves">
        <p className="font-mono text-sm text-text-secondary">
          Taxonomy · {groves.length} collections
        </p>
        <h2 className="mt-1 font-sans text-2xl font-semibold tracking-tight">Groves</h2>
        <p className="mt-1 font-sans text-sm text-text-secondary">
          Curated collections of repositories around a problem or ecosystem.
        </p>
        <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {groves.map((grove) => {
            const members = getReposInGrove(grove.slug);
            return (
              <li key={grove.slug}>
                <GroveCard
                  grove={grove}
                  repoCount={members.length}
                  previewNames={members.slice(0, GROVE_PREVIEW_COUNT).map((repo) => repo.name)}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <p className="font-mono text-sm text-text-secondary">
          Intelligence map · {repos.length} indexed
        </p>
        <h2 className="mt-1 font-sans text-2xl font-semibold tracking-tight">Repositories</h2>
        <p className="mt-1 font-sans text-sm text-text-secondary">
          Repository intelligence pages — what it is, why people use it, and
          what to use instead.
        </p>
        <div className="mt-6">
          <PaginatedCardGrid
            items={repos.map((repo) => ({
              key: repo.slug,
              node: (
                <RepoCard
                  repo={repo}
                  stars={growthByRepo.get(repo.github)?.currentStars ?? null}
                  alternatives={repo.alternatives.open_source.map(
                    (altSlug) => getRepo(altSlug)?.name ?? altSlug,
                  )}
                />
              ),
            }))}
          />
        </div>
      </section>

      <section className="rounded-md border border-border-subtle bg-bg-elevated p-8 shadow-elevation-1">
        <h2 className="font-sans text-2xl font-semibold tracking-tight">RepoGrove Weekly</h2>
        <div className="mt-2 max-w-2xl">
          <NewsletterSignupForm />
        </div>
      </section>
    </div>
  );
}
