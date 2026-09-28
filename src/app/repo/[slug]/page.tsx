import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { getAllRepos, getRepo } from "@/lib/content";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  active: "🟢 Active",
  maintained: "🟡 Maintained",
  inactive: "⚪ Inactive",
};

export function generateStaticParams() {
  return getAllRepos().map((repo) => ({ slug: repo.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const repo = getRepo(slug);
  if (!repo) return {};
  return { title: repo.name, description: `${repo.name} (${repo.github}) on RepoGrove` };
}

export default async function RepoPage({ params }: PageProps) {
  const { slug } = await params;
  const repo = getRepo(slug);
  if (!repo) notFound();

  return (
    <article>
      <p className="font-sans text-sm font-medium text-text-link">Repository</p>
      <h1 className="font-sans text-2xl font-semibold tracking-tight text-text-default">
        {repo.name}
      </h1>
      <a
        href={`https://github.com/${repo.github}`}
        className="font-mono text-sm text-text-secondary hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        github.com/{repo.github}
      </a>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-sans text-sm text-text-secondary">
        <div>
          <dt className="inline font-medium text-text-default">Status: </dt>
          <dd className="inline">{STATUS_LABEL[repo.status] ?? repo.status}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-text-default">License: </dt>
          <dd className="inline">📜 {repo.license}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-text-default">Category: </dt>
          <dd className="inline">{repo.category.join(", ")}</dd>
        </div>
      </dl>

      <div className="mt-6">
        {/* The body's own "## Related Grove" section (hand-authored in
            content/repos/*.md) already links back to the Grove — rendering
            a second, computed one here would just duplicate it. */}
        <Markdown>{repo.body}</Markdown>
      </div>
    </article>
  );
}
