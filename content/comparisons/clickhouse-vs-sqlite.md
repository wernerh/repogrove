---
repos: [clickhouse, sqlite]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# ClickHouse vs SQLite

## How they differ
Both are open-source SQL databases, and each already lists the other as an
open-source alternative — but they sit at opposite ends of nearly every axis
that matters for picking one: deployment model, storage layout, and the
workload each is built to serve.

SQLite is an embedded, serverless, row-oriented database: a library an
application links directly, reading and writing a single ordinary file with
no separate process at all. It's built for OLTP — fast reads and writes of
individual rows with full ACID guarantees — and its single-writer-at-a-time
model keeps it simple to operate but limited to one machine, one process at
a time, for writes.

ClickHouse is a distributed, client-server, column-oriented database built
specifically for OLAP — scanning and aggregating billions of rows fast
enough for interactive dashboards, scaling horizontally across a cluster of
nodes as data volume and query load grow. It needs a server (or cluster) to
deploy and operate, real infrastructure SQLite has no equivalent of.

In short: reach for SQLite when the job is a small-footprint, zero-admin
datastore for an application, device, or script; reach for ClickHouse when
the job is aggregating a continuously-growing, very large volume of data —
event streams, logs, metrics — across potentially many servers. The two
rarely compete for the same job in practice; a project outgrowing SQLite's
single-machine OLTP model for an analytical workload is a candidate for
ClickHouse, not a direct swap.
