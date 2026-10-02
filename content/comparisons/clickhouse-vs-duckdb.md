---
repos: [clickhouse, duckdb]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# ClickHouse vs DuckDB

## How they differ
Both are open-source, column-oriented databases built for analytical (OLAP) SQL
queries, and each already lists the other as an open-source alternative — but they sit
at opposite ends of the deployment spectrum, and the real choice between them is about
scale and operational shape, not raw query performance.

ClickHouse is a distributed, client-server database: you run it as a service (a single
node, or a cluster of many), and clients connect to it over the network. That gives it a
horizontal scaling story — add nodes as data volume or concurrent query load grows — and
a track record handling very large, continuously-ingested datasets (event streams, logs,
metrics) for many simultaneous users. The cost is operational: a server (or cluster) to
deploy, monitor, and tune.

DuckDB is an in-process, embedded database — it runs inside your own application,
script, or notebook, the same deployment model SQLite popularized, with no separate
server at all. That makes it fast to adopt for local or single-machine analytics (a
dataset on disk, a data-science notebook, a desktop app), but it's fundamentally
single-machine: there's no clustering story for a workload that outgrows one process.

In short: reach for ClickHouse when the workload needs to scale across machines, serve
many concurrent users, or ingest a continuous high-volume stream; reach for DuckDB when
the data fits on one machine and you'd rather not run a server at all.
