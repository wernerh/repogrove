---
github: duckdb/duckdb
name: DuckDB
category: [database, analytics]
license: MIT
status: active
featured: false
groves: [databases]
alternatives:
  open_source: [clickhouse, sqlite, postgresql]
  commercial: []
---

# DuckDB

An in-process SQL database built for fast analytical queries.

## What it does
DuckDB is an embedded, column-oriented SQL database — it runs inside your own process
(a script, a notebook, an application) rather than as a separate server you connect to,
the same deployment model SQLite popularized but aimed at analytical ("how many, grouped
by, over time") queries instead of transactional ones. It was originally created by Mark
Raasveldt and Hannes Mühleisen at the Centrum Wiskunde & Informatica (CWI) research
institute in the Netherlands.

## Why people use it
- No server to install, configure, or keep running — `import duckdb` (or the CLI) and
  query straight away
- Fast at scanning and aggregating large local files (CSV, Parquet) without a separate
  data-loading step
- A single-file storage format that's easy to copy, back up, or ship alongside an app

## Pros
- Genuinely zero-dependency: builds and runs with just a C++17 compiler, no external services
- Strong SQL support, including window functions and complex joins, not a stripped-down dialect
- Can run entirely in the browser via WebAssembly for client-side analytics

## Cons
- Single-machine by design — there's no clustering story for datasets or workloads that outgrow one process
- Built for analytical (read-heavy, aggregation-heavy) queries, not as a general-purpose transactional database for an application's primary datastore
- Multi-user concurrent write access isn't its design center the way a client-server database's is

## Alternatives
**Open-source:** ClickHouse (distributed, server-based OLAP rather than embedded —
see the comparison for which fits your scale); SQLite (also embedded, but built for
transactional row-level access rather than analytical aggregations — see the
comparison for which fits your workload); PostgreSQL (a general-purpose,
client-server database rather than an embedded analytical engine — see the
comparison for when a transactional system of record is the actual job).
**Commercial:** none tracked yet.

## Related Grove
[Databases](/grove/databases)
