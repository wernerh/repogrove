---
repos: [postgresql, sqlite]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# PostgreSQL vs SQLite

## How they differ
Both are mature, open-source, ACID-compliant SQL databases, and each already lists the
other as an open-source alternative — but the real choice between them is about
deployment shape and concurrency, not raw SQL feature coverage.

PostgreSQL is a client-server database: you run it as a long-lived server process,
and every application connects to it over a network or local socket. That gives it
mature multi-reader/multi-writer concurrency control (MVCC), a large extension
ecosystem (PostGIS, pgvector, and others), and the deep standards-compliant SQL and
data-type support that comes from decades of production use at every scale, from
small apps to large multi-tenant systems. The cost is operational: a server to
install, configure, back up, and keep running.

SQLite is an embedded, serverless database: it's a library an application links
directly, reading and writing a single ordinary file with no separate process at all.
That makes it close to zero-administration — a backup is a file copy — and it's
already present inside most mobile OSes, browsers, and countless desktop apps. The
trade-off is concurrency: only one writer at a time can write to a SQLite database
file, so it isn't built for many processes writing concurrently the way a
client-server database's connection pool is.

In short: reach for PostgreSQL when an application needs a dedicated server handling
many concurrent writers, rich extensions, or large multi-tenant data; reach for SQLite
when a single file with no server to manage is enough — a mobile/desktop app, a local
cache, or a lower-traffic site.
