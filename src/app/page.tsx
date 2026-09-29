import { getAllGroves, getAllRepos, getReposInGrove } from "@/lib/content";
import { getSnapshotHistory, type SnapshotRow } from "@/lib/snapshots";
import GroveCard from "@/components/GroveCard";
import RepoCard from "@/components/RepoCard";

function latestStars(history: SnapshotRow[]): number | null {
  return history.length > 0 ? history[history.length - 1].stars : null;
}

export default function Home() {
  const groves = getAllGroves();
  const repos = getAllRepos();

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
        <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
          {groves.map((grove) => (
            <GroveCard
              key={grove.slug}
              grove={grove}
              repoCount={getReposInGrove(grove.slug).length}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Repositories</h2>
        <p className="text-sm text-text-secondary">
          Repository intelligence pages — what it is, why people use it, and
          what to use instead.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
          {repos.map((repo) => (
            <RepoCard
              key={repo.slug}
              repo={repo}
              stars={latestStars(getSnapshotHistory(repo.github))}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
