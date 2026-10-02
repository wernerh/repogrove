---
repos: [clickhouse, postgresql]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# ClickHouse vs PostgreSQL

## How they differ
Both are open-source, client-server SQL databases, and each already lists the
other as an open-source alternative — a real-world question people actually
ask ("can I just use Postgres instead of standing up ClickHouse?"), not an
invented pairing. The answer turns on what kind of workload each engine's
storage is built around.

PostgreSQL is row-oriented and built for OLTP: many clients reading and
writing individual rows with full ACID transactions and mature concurrency
control (MVCC). That's the right shape for an application's primary
datastore, and it can run reasonable analytical queries at modest scale —
but a row store has to touch whole rows to answer an aggregation over a few
columns, which gets slower as both data volume and query complexity grow.

ClickHouse is column-oriented and built specifically for OLAP: it stores
each column separately, which lets an aggregation query read only the
columns it needs and compress them well, and it scales horizontally across a
cluster as data volume or concurrent query load grows. That specialization
is also its limit — it isn't built for the single-row transactional updates
and strict referential integrity an application's system of record usually
needs.

In short: reach for PostgreSQL when the primary job is transactional reads
and writes with occasional reporting on the side; reach for ClickHouse when
the primary job is aggregating very large volumes of data — event streams,
logs, metrics — fast enough for interactive dashboards. It's common to run
both together: PostgreSQL as the operational database, ClickHouse fed from it
(or from the same event stream) for analytics at a scale Postgres alone
would struggle with.
