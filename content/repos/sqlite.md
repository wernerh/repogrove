---
github: sqlite/sqlite
name: SQLite
category: [database, embedded]
license: Public Domain
status: active
featured: false
groves: [databases]
alternatives:
  open_source: [duckdb, postgresql]
  commercial: []
---

# SQLite

An embedded, serverless SQL database — a library your application links in, not a
separate service you connect to.

## What it does
SQLite is a small C library implementing a self-contained, file-based SQL database
engine. There's no separate server process to install, configure, or keep running — an
application links the library directly and reads/writes a single ordinary disk file
(or an in-memory database) through it. It was designed by D. Richard Hipp in 2000 and
has been in continuous development since, with the database file format itself kept
stable across two decades of releases.

## Why people use it
- Zero administration — no server to install, no connection string, no separate process
  to monitor
- A single-file database that's trivial to copy, back up, bundle with an app, or ship on
  a device
- Implements most of the SQL standard, including transactions with full ACID
  guarantees, rather than a stripped-down dialect
- Ubiquitous already — it ships inside most mobile operating systems, major browsers,
  and a huge range of desktop and embedded applications, so the runtime is usually
  already present

## Pros
- Extremely low operational overhead: a backup is a file copy, not a service restore
- Battle-tested at enormous deployment scale (phones, browsers, countless apps) and
  known for strong backward and forward file-format compatibility
- Great fit for mobile/desktop apps, local caches, and lower-traffic sites that don't
  need a dedicated database server

## Cons
- Row-oriented storage tuned for transactional (OLTP) access patterns, not for
  large-scale analytical aggregations — see DuckDB below for that workload instead
- A single writer at a time per database file: concurrent multi-process writes don't
  scale the way a client-server database's connection pool does
- No built-in network access control or multi-node replication — scaling beyond one
  machine/file means reaching for a different database

## Alternatives
**Open-source:** DuckDB (also embedded/serverless, but built for analytical queries over
row-level transactional ones — see the comparison for which fits your workload);
PostgreSQL (a full client-server database rather than an embedded library — see the
comparison for when that trade-off is worth it).
**Commercial:** none tracked yet.

## Related Grove
[Databases](/grove/databases)
