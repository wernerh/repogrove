import Link from "next/link";
import type { TrendMode } from "@/lib/trend-view";

const COPY: Record<TrendMode, { title: string; lead: string }> = {
  hot: {
    title: "Hot Right Now",
    lead: "Where developer attention is landing in raw numbers: tracked repositories ranked by absolute GitHub star growth, so the biggest movers sit at the top.",
  },
  rising: {
    title: "Rising",
    lead: "Tracked repositories ranked by star growth relative to their own size, surfacing fast movers before they become mainstream.",
  },
};

function FlameIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function SproutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  );
}

/**
 * Page header shared by `/trending` and `/rising`: the one `<h1>`, a lead
 * sentence, and a two-way switch between the absolute (Hot) and relative
 * (Rising) rankings. Server component — no state.
 */
export function TrendHeader({ mode }: { mode: TrendMode }) {
  const { title, lead } = COPY[mode];
  const tab = (target: TrendMode, href: string, label: string) => {
    const active = target === mode;
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`inline-flex items-center rounded-md px-4 py-2 font-sans text-sm font-semibold transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-fill ${
          active
            ? "bg-bg-elevated text-text-default shadow-elevation-1"
            : "text-text-secondary hover:text-text-default"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <h1 className="flex items-center gap-3 font-sans text-3xl font-semibold tracking-tight text-text-default">
          <span className={mode === "hot" ? "text-momentum-rising" : "text-cta-fill"}>
            {mode === "hot" ? <FlameIcon /> : <SproutIcon />}
          </span>
          {title}
        </h1>
        <p className="mt-3 text-base text-text-secondary">{lead}</p>
      </div>
      <nav aria-label="Ranking type" className="inline-flex gap-1 rounded-md bg-bg-subtle p-1">
        {tab("hot", "/trending", "Hot: absolute")}
        {tab("rising", "/rising", "Rising: relative")}
      </nav>
    </header>
  );
}
