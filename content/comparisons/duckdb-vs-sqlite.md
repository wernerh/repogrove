---
repos: [duckdb, sqlite]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# DuckDB vs SQLite

## How they differ
Both are embedded, serverless databases — no separate server process, just a library
your application links in and a file (or in-memory store) on disk — and each already
lists the other as an open-source alternative. The real difference is the workload
each is built for, not the deployment model they share.

SQLite is built for OLTP: fast reads and writes of individual rows, with full ACID
transaction guarantees, using a row-oriented storage engine. That's the right shape for
an application's primary datastore — a mobile app's local data, a desktop app's
settings and records, a low-traffic site's backend — where most queries touch a few
rows at a time. It has been in continuous production use since 2000, with an
unusually stable on-disk file format.

DuckDB is built for OLAP: columnar, vectorized storage and execution aimed at scanning
and aggregating large amounts of data quickly — "how many, grouped by, over time"
queries rather than individual-row lookups. It can also query CSV/Parquet/Arrow files
directly without a separate load step, which fits data-science and analytics workflows
SQLite was never designed for.

In short: reach for SQLite when the job is a general-purpose application database with
frequent small reads and writes; reach for DuckDB when the job is analytical queries
over a larger dataset, even if that dataset lives entirely on one machine.
