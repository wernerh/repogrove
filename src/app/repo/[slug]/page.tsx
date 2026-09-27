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
      <p className="text-sm font-medium text-emerald-700">Repository</p>
      <h1 className="text-3xl font-semibold tracking-tight">{repo.name}</h1>
      <a
        href={`https://github.com/${repo.github}`}
        className="text-sm text-zinc-500 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        github.com/{repo.github}
      </a>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600">
        <div>
          <dt className="inline font-medium text-zinc-900">Status: </dt>
          <dd className="inline">{STATUS_LABEL[repo.status] ?? repo.status}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-zinc-900">License: </dt>
          <dd className="inline">📜 {repo.license}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-zinc-900">Category: </dt>
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
