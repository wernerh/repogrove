import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { getAllGroves, getGrove } from "@/lib/content";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllGroves().map((grove) => ({ slug: grove.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const grove = getGrove(slug);
  if (!grove) return {};
  return { title: grove.name, description: grove.description };
}

export default async function GrovePage({ params }: PageProps) {
  const { slug } = await params;
  const grove = getGrove(slug);
  if (!grove) notFound();

  return (
    <article>
      <p className="font-sans text-sm font-medium text-text-link">Grove</p>
      <h1 className="font-sans text-2xl font-semibold tracking-tight text-text-default">
        {grove.name}
      </h1>
      <p className="mt-2 font-serif text-lg text-text-secondary">
        {grove.description}
      </p>

      <div className="mt-6">
        {/* The body's own "## Related Groves" section (hand-authored in
            content/groves/*.md) already covers this — no need to repeat
            grove.relatedGroves here too. */}
        <Markdown>{grove.body}</Markdown>
      </div>
    </article>
  );
}
