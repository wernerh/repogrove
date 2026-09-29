import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Self-hosted at build time (next/font downloads the font files once during
// `next build` and serves them from our own static output — no runtime
// request to Google's CDN, compatible with the static export in
// next.config.ts). See docs/adr/ADR-006-font-loading.md and
// docs/design/DESIGN-SYSTEM.md's Typography section, which names these
// three faces and requires this ADR note per CLAUDE.md rule 7.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif-4",
  display: "swap",
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RepoGrove",
    template: "%s · RepoGrove",
  },
  description:
    "RepoGrove is a curated map of the open-source ecosystem — Groves, repository intelligence, and open-source alternatives to the software you already use.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`h-full ${inter.variable} ${sourceSerif4.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-full flex flex-col bg-bg-default text-text-default">
        <header className="border-b border-border-subtle">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              RepoGrove
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/trending"
                className="font-sans text-sm font-medium text-text-secondary hover:text-text-default hover:underline"
              >
                Trending
              </Link>
              <Link
                href="/rising"
                className="font-sans text-sm font-medium text-text-secondary hover:text-text-default hover:underline"
              >
                Rising
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-10">
          {children}
        </main>
        <footer className="border-t border-border-subtle">
          <div className="mx-auto max-w-3xl px-6 py-6 text-sm text-text-secondary">
            RepoGrove — a curated map of the open-source ecosystem.
          </div>
        </footer>
      </body>
    </html>
  );
}
