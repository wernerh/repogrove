import Link from "next/link";
import { getAllGroves, getAllRepos } from "@/lib/content";

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
        <h2 className="text-xl font-semibold">🌳 Groves</h2>
        <p className="text-sm text-text-secondary">
          Curated collections of repositories around a problem or ecosystem.
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {groves.map((grove) => (
            <li key={grove.slug}>
              <Link
                href={`/grove/${grove.slug}`}
                className="font-medium text-text-link hover:underline"
              >
                {grove.name}
              </Link>
              <span className="text-text-secondary"> — {grove.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">📦 Repositories</h2>
        <p className="text-sm text-text-secondary">
          Repository intelligence pages — what it is, why people use it, and
          what to use instead.
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {repos.map((repo) => (
            <li key={repo.slug}>
              <Link
                href={`/repo/${repo.slug}`}
                className="font-medium text-text-link hover:underline"
              >
                {repo.name}
              </Link>
              <span className="text-text-secondary">
                {" "}
                — <span className="font-mono text-sm">{repo.github}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
