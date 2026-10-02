"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { compactNumberFormatter, numberFormatter } from "@/lib/format";
import {
  SIZE_BUCKETS,
  categoryStats,
  sizeBucket,
  type SizeBucket,
  type TrendItem,
  type TrendMode,
} from "@/lib/trend-view";

/**
 * Shared board for `/trending` and `/rising`: top-three cards, the rest of the
 * ranking as a ledger, category (and, on Rising, size) filters and a sidebar
 * summary. Each page still owns its ranking math and reason strings; this
 * component only lays out and filters the entries it is given, so a filter
 * never changes a repo's rank number.
 *
 * Every repo appears exactly once, with one `<a>` per row/card (the same
 * stretched-link pattern as RepoCard), so keyboard users get one focus stop
 * per repo and the document order always matches the ranking order.
 */
const focusRing =
  "has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-cta-fill";

function chipClass(active: boolean) {
  return `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-sans text-sm font-medium transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-fill ${
    active
      ? "border-cta-fill bg-cta-fill text-cta-text"
      : "border-border-subtle bg-bg-elevated text-text-default hover:border-border-default"
  }`;
}

function CategoryTag({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-sm bg-bg-brand-subtle px-2 py-1 font-sans text-sm font-medium text-text-on-brand-subtle">
      {category}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      aria-label={`Rank ${rank}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-cta-fill font-sans text-base font-semibold text-cta-text"
    >
      {rank}
    </span>
  );
}

function TopCard({ item }: { item: TrendItem }) {
  return (
    <li
      className={`relative flex min-w-0 flex-col gap-4 rounded-md border border-border-subtle bg-bg-elevated p-6 shadow-elevation-1 transition-shadow duration-[var(--duration-fast)] has-[a:hover]:shadow-elevation-2 ${focusRing}`}
    >
      <div className="flex items-center justify-between gap-3">
        <RankBadge rank={item.rank} />
        {item.category && <CategoryTag category={item.category} />}
      </div>
      <div className="min-w-0">
        <h2 className="font-sans text-xl font-semibold tracking-tight text-text-default">
          <Link href={`/repo/${item.slug}`} className="after:absolute after:inset-0 focus:outline-none">
            {item.name}
          </Link>
        </h2>
        <p className="mt-1 font-mono text-sm text-text-secondary">{item.github}</p>
        {item.blurb && <p className="mt-3 line-clamp-3 text-base text-text-secondary">{item.blurb}</p>}
      </div>
      <div className="mt-auto rounded-md bg-bg-subtle p-4">
        <p className="font-sans text-2xl font-semibold tracking-tight text-text-link">{item.metric}</p>
        <p className="mt-1 text-sm text-text-secondary">{item.metricNote}</p>
        <p className="mt-3 font-mono text-sm text-text-secondary">
          <span>{item.reason}</span>
        </p>
      </div>
      <p className="font-mono text-sm text-text-default">
        {numberFormatter.format(item.totalStars)} <span className="font-sans text-text-secondary">stars total</span>
      </p>
    </li>
  );
}

function LedgerRow({ item, maxValue }: { item: TrendItem; maxValue: number }) {
  const width = maxValue > 0 ? Math.max(3, Math.min(100, (Math.max(0, item.value) / maxValue) * 100)) : 3;
  return (
    <li
      className={`relative flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border-subtle px-5 py-4 first:border-t-0 transition-colors duration-[var(--duration-fast)] has-[a:hover]:bg-bg-subtle ${focusRing}`}
    >
      <span className="w-6 font-mono text-sm text-text-secondary" aria-label={`Rank ${item.rank}`}>
        {item.rank}
      </span>
      <div className="min-w-[14rem] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-sans text-base font-semibold text-text-default">
            <Link href={`/repo/${item.slug}`} className="after:absolute after:inset-0 focus:outline-none">
              {item.name}
            </Link>
          </h2>
          {item.category && <CategoryTag category={item.category} />}
        </div>
        <p className="mt-1 font-mono text-sm text-text-secondary">
          <span>{item.reason}</span>
        </p>
      </div>
      <div className="w-40" aria-hidden="true">
        <div className="h-1.5 rounded-full bg-bg-subtle">
          <div className="h-1.5 rounded-full bg-cta-fill" style={{ width: `${width}%` }} />
        </div>
      </div>
      <span className="w-16 text-right font-mono text-sm text-text-secondary">
        {compactNumberFormatter.format(item.totalStars)}
      </span>
    </li>
  );
}

function Sidebar({ items, mode }: { items: TrendItem[]; mode: TrendMode }) {
  const stats = categoryStats(items, mode);
  const max = Math.max(...stats.map((s) => s.value), 0);
  const fmt = (v: number) => (mode === "hot" ? `${Math.round(v)}%` : `${v.toFixed(1)}%`);
  return (
    <aside className="flex flex-col gap-6" aria-label="Summary">
      <section className="rounded-md border border-border-subtle bg-bg-elevated p-6 shadow-elevation-1">
        <h2 className="font-sans text-lg font-semibold tracking-tight text-text-default">
          {mode === "hot" ? "Where the stars went" : "Average growth by category"}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {mode === "hot"
            ? "Each category's share of all stars gained by tracked repos."
            : "Mean star growth over the tracking window, per category."}
        </p>
        <ul className="mt-4 flex flex-col gap-4">
          {stats.map((stat) => (
            <li key={stat.category}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-text-default">{stat.category}</span>
                <span className="font-mono text-text-secondary">{fmt(stat.value)}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-bg-subtle" aria-hidden="true">
                <div
                  className="h-2 rounded-full bg-cta-fill"
                  style={{ width: `${max > 0 ? Math.max(4, (stat.value / max) * 100) : 4}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-md border border-border-subtle bg-bg-brand-subtle p-6">
        <h2 className="font-sans text-lg font-semibold tracking-tight text-text-on-brand-subtle">
          {mode === "hot" ? "Looking for smaller projects?" : "Prefer the biggest movers?"}
        </h2>
        <p className="mt-2 text-sm text-text-on-brand-subtle">
          {mode === "hot"
            ? "Raw star counts favour projects that are already famous. Rising ranks growth against each repo's own size."
            : "Rising divides growth by size. Hot ranks by raw stars gained."}
        </p>
        <Link
          href={mode === "hot" ? "/rising" : "/trending"}
          className="mt-4 inline-flex font-sans text-sm font-semibold text-text-on-brand-subtle underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-fill"
        >
          {mode === "hot" ? "See what's rising" : "See what's hot"}
        </Link>
      </section>
    </aside>
  );
}

export function TrendBoard({
  mode,
  items,
  emptyMessage,
}: {
  mode: TrendMode;
  items: TrendItem[];
  emptyMessage: string;
}) {
  const [category, setCategory] = useState<string>("all");
  const [size, setSize] = useState<SizeBucket | "all">("all");

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category ?? "uncategorised"))).sort(),
    [items],
  );

  if (items.length === 0) {
    return <p className="mt-8 font-sans text-sm text-text-secondary">{emptyMessage}</p>;
  }

  const visible = items.filter(
    (i) =>
      (category === "all" || (i.category ?? "uncategorised") === category) &&
      (size === "all" || sizeBucket(i.totalStars) === size),
  );
  const top = visible.slice(0, 3);
  const rest = visible.slice(3);
  const maxValue = Math.max(...visible.map((i) => i.value), 0);

  return (
    <div className="mt-8 flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div role="group" aria-label="Filter by category" className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-sans text-sm font-medium text-text-secondary">Category</span>
          <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")} className={chipClass(category === "all")}>
            All
          </button>
          {categories.map((c) => (
            <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={chipClass(category === c)}>
              {c}
            </button>
          ))}
        </div>
        {mode === "rising" && (
          <div role="group" aria-label="Filter by repository size" className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-sans text-sm font-medium text-text-secondary">Size</span>
            <button type="button" aria-pressed={size === "all"} onClick={() => setSize("all")} className={chipClass(size === "all")}>
              Any size
            </button>
            {SIZE_BUCKETS.map((b) => (
              <button key={b.id} type="button" aria-pressed={size === b.id} onClick={() => setSize(b.id)} className={chipClass(size === b.id)}>
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-border-default p-6 font-sans text-sm text-text-secondary">
          Nothing matches that combination yet. Try a different category or size.
        </p>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-8">
            <ol className="grid gap-5 md:grid-cols-3">
              {top.map((item) => (
                <TopCard key={item.slug} item={item} />
              ))}
            </ol>
            {rest.length > 0 && (
              <section aria-labelledby="ledger-heading">
                <h2 id="ledger-heading" className="font-sans text-xl font-semibold tracking-tight text-text-default">
                  The rest of the ranking
                </h2>
                <ol className="mt-4 overflow-hidden rounded-md border border-border-subtle bg-bg-elevated shadow-elevation-1">
                  {rest.map((item) => (
                    <LedgerRow key={item.slug} item={item} maxValue={maxValue} />
                  ))}
                </ol>
              </section>
            )}
          </div>
          <Sidebar items={items} mode={mode} />
        </div>
      )}
    </div>
  );
}
