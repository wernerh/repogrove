---
github: ClickHouse/ClickHouse
name: ClickHouse
category: [database, analytics]
license: Apache-2.0
status: active
featured: false
groves: [databases]
alternatives:
  open_source: [duckdb, sqlite, postgresql]
  commercial: []
---

# ClickHouse

A distributed, column-oriented database built for real-time analytics at scale.

## What it does
ClickHouse is a column-oriented database management system built for online analytical
processing (OLAP) — running SQL aggregations over very large volumes of data and
returning results fast enough for interactive dashboards and real-time reporting. It was
built at Yandex, open-sourced in 2016, and is now developed by ClickHouse, Inc. alongside
the open-source project.

## Why people use it
- Scans and aggregates billions of rows with sub-second to low-second query times
- Scales horizontally across a cluster of nodes as data volume and query load grow
- Handles continuous, high-volume data ingestion (event streams, logs, metrics) well

## Pros
- Proven at very large scale — in production at companies including Uber, eBay, and Comcast for analytics and reporting workloads
- Column-oriented storage with strong compression, which keeps both storage costs and scan times down on analytical workloads
- Runs as a single node for smaller workloads just as well as it does as a cluster

## Cons
- A server to deploy and operate (or a managed/cloud offering to pay for), not an embeddable library — more operational overhead than a single-file database
- Transactional, multi-row-update workloads aren't what it's built for; it's optimized for append-heavy analytical data, not OLTP
- Tuning a cluster (sharding, replication, resource limits) for production has a real learning curve

## Alternatives
**Open-source:** DuckDB (embedded and single-machine rather than a server/cluster —
see the comparison for which fits your scale); SQLite (embedded, row-oriented, and
built for OLTP rather than analytical aggregation — see the comparison for how
little the two actually compete for the same job); PostgreSQL (a general-purpose,
row-oriented client-server database rather than a column-oriented analytical one —
see the comparison for the workload split between them).
**Commercial:** none tracked yet.

## Related Grove
[Databases](/grove/databases)
