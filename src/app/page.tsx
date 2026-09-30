import { getAllGroves, getAllRepos, getReposInGrove } from "@/lib/content";
import { getGrowthSummaries } from "@/lib/snapshots";
import GroveCard from "@/components/GroveCard";
import RepoCard from "@/components/RepoCard";
import NewsletterSignupForm from "@/components/NewsletterSignupForm";

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
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">
          Discover the projects shaping open source.
        </h1>
        <p className="mt-3 font-serif text-lg text-text-secondary">
          RepoGrove is a curated map of the open-source ecosystem — what a
          project actually does, whether it&apos;s active, and what else you
          could use instead.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Groves</h2>
        <p className="text-sm text-text-secondary">
          Curated collections of repositories around a problem or ecosystem.
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
          {groves.map((grove) => (
            <li key={grove.slug}>
              <GroveCard grove={grove} repoCount={getReposInGrove(grove.slug).length} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Repositories</h2>
        <p className="text-sm text-text-secondary">
          Repository intelligence pages — what it is, why people use it, and
          what to use instead.
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
          {repos.map((repo) => (
            <li key={repo.slug}>
              <RepoCard repo={repo} stars={growthByRepo.get(repo.github)?.currentStars ?? null} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">RepoGrove Weekly</h2>
        <NewsletterSignupForm />
      </section>
    </div>
  );
}
