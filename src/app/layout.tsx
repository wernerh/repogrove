import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

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
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        <header className="border-b border-zinc-200">
          <div className="mx-auto max-w-3xl px-6 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              🌱 RepoGrove
            </Link>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-10">
          {children}
        </main>
        <footer className="border-t border-zinc-200">
          <div className="mx-auto max-w-3xl px-6 py-6 text-sm text-zinc-500">
            RepoGrove — a curated map of the open-source ecosystem.
          </div>
        </footer>
      </body>
    </html>
  );
}
