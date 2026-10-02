---
repos: [duckdb, postgresql]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# DuckDB vs PostgreSQL

## How they differ
Both are open-source SQL databases, and each already lists the other as an
open-source alternative — but they're built for different workload shapes
first, and the deployment model each uses follows from that choice rather
than being an arbitrary design decision.

PostgreSQL is a general-purpose, client-server database: a long-lived server
process that many clients connect to over a network, built around row-level
transactional reads and writes (OLTP) with full ACID guarantees and mature
multi-reader/multi-writer concurrency (MVCC). That makes it the right choice
for an application's primary datastore — the system of record that many
clients read and write small amounts of data to continuously.

DuckDB is an in-process, embedded database built for analytical queries
(OLAP) — scanning and aggregating large amounts of data, often directly from
CSV or Parquet files, without a separate load step. It runs inside the
calling process rather than as a server, with no clustering or concurrent
multi-writer story, because it's optimized for a different access pattern:
one process asking "how many, grouped by, over time" questions over a
dataset that fits on one machine.

In short: reach for PostgreSQL when the job is an application's transactional
system of record with many concurrent clients; reach for DuckDB when the job
is local or embedded analytical queries over data that already lives on one
machine, with no server to run at all. Many real systems use both — PostgreSQL
as the operational datastore, DuckDB for ad hoc or embedded analytics over an
export of that same data.
