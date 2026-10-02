import type { Metadata } from "next";
import Link from "next/link";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Self-hosted at build time (next/font downloads the font files once during
// `next build` and serves them from our own static output — no runtime
// request to Google's CDN, compatible with the static export in
// next.config.ts). See docs/adr/ADR-006-font-loading.md and
// docs/design/DESIGN-SYSTEM.md's Typography section. The Precision Editorial
// refresh retired Source Serif 4: Inter carries headlines and body, IBM Plex
// Mono carries labels, stats and slugs.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  // Lets every page's relative `alternates.canonical` (e.g. the compare
  // page's canonical-order URL, issue #64) resolve to a real absolute URL
  // without each call site re-importing SITE_URL to build one by hand.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RepoGrove",
    template: "%s · RepoGrove",
  },
  description:
    "RepoGrove is a curated map of the open-source ecosystem — Groves, repository intelligence, and open-source alternatives to the software you already use.",
};

const NAV_LINKS = [
  { href: "/trending", label: "Trending" },
  { href: "/rising", label: "Rising" },
] as const;

/** Wordmark tile: three linked nodes (a "map"), deliberately not a leaf —
 * see docs/design/findings/UX-2026-001-brand-mark-leaf-emoji.md. */
function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-cta-fill text-cta-text"
    >
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="3.5" r="1.75" fill="currentColor" stroke="none" />
        <circle cx="3.5" cy="12" r="1.75" fill="currentColor" stroke="none" />
        <circle cx="12.5" cy="12" r="1.75" fill="currentColor" stroke="none" />
        <path d="M8 5.5 4.4 10.4M8 5.5l3.6 4.9M5.5 12h5" />
      </svg>
    </span>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-full flex flex-col bg-bg-subtle text-text-default">
        <header className="sticky top-0 z-10 border-b border-border-subtle bg-bg-default/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 font-sans text-lg font-semibold tracking-tight"
              >
                <BrandMark />
                RepoGrove
              </Link>
              <nav aria-label="Primary" className="flex items-center gap-6">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="font-sans text-sm font-medium text-text-secondary transition-colors duration-[var(--duration-fast)] hover:text-text-default"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-md border border-border-default bg-bg-elevated px-3 py-1.5 font-sans text-sm text-text-secondary transition-colors duration-[var(--duration-fast)] hover:text-text-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-fill"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="7" cy="7" r="4.5" />
                <path d="m10.5 10.5 3 3" />
              </svg>
              Search
            </Link>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
        <footer className="border-t border-border-subtle bg-bg-default">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 font-sans text-sm font-semibold">
                <BrandMark />
                RepoGrove
              </p>
              <p className="mt-2 font-sans text-sm text-text-secondary">
                A curated map of the open-source ecosystem.
              </p>
            </div>
            <nav aria-label="Footer" className="flex gap-6 font-sans text-sm text-text-secondary">
              <Link href="/trending" className="hover:text-text-default">
                Trending
              </Link>
              <Link href="/rising" className="hover:text-text-default">
                Rising
              </Link>
              <Link href="/search" className="hover:text-text-default">
                Search
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
