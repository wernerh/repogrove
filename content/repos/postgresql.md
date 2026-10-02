---
github: postgres/postgres
name: PostgreSQL
category: [database, relational]
license: PostgreSQL License
status: active
featured: false
groves: [databases]
alternatives:
  open_source: [sqlite, duckdb, clickhouse]
  commercial: []
---

# PostgreSQL

A general-purpose, client-server relational database with a three-decade track record
in production.

## What it does
PostgreSQL is an object-relational database management system that traces its lineage
to the POSTGRES project at the University of California, Berkeley, started in 1986; the
modern open-source project (adding SQL support and taking the name "Postgres95", later
PostgreSQL) began in 1996 after the original Berkeley team moved on. It runs as a
long-lived server process that clients connect to over a network or local socket,
rather than linking into an application the way an embedded database does, and it's
built around strict SQL standards compliance plus deep extensibility — custom data
types, functions, and index types (used by extensions like PostGIS for geospatial data)
can be added without forking the database itself.

## Why people use it
- Full ACID transactions with mature, well-understood concurrency control (MVCC), so
  many clients can read and write at once without blocking each other
- Rich, standards-compliant SQL plus advanced data types (JSON/JSONB, arrays, ranges,
  full-text search) beyond what a minimal SQL engine offers
- A large extension ecosystem (PostGIS, pgvector, TimescaleDB, and others) that adds
  specialized capabilities directly inside the database
- The default or supported choice for most managed cloud database services, which keeps
  operational tooling, drivers, and hosting options broad

## Pros
- Decades of production hardening across every major workload shape, from small apps to very large multi-tenant systems
- Genuinely extensible at the SQL and type-system level, not just through plugins bolted on from outside
- Strong data-integrity guarantees (constraints, foreign keys, strict typing) enforced by the database itself, not left to the application

## Cons
- Needs a server process to install, configure, tune, and keep running — real operational overhead compared to an embedded database with no service to manage
- Vertical scaling (one larger machine) is the primary scaling path; horizontal write-scaling across nodes isn't built in the way some distributed databases offer
- Heavier to spin up for a quick script, a mobile app, or a single-file local datastore — see SQLite below when a server isn't worth running

## Alternatives
**Open-source:** SQLite (embedded/serverless rather than client-server — see the
comparison for which fits a given workload and deployment shape); DuckDB (embedded
and built for analytical queries rather than a general-purpose transactional
server — see the comparison for the workload split); ClickHouse (a distributed,
column-oriented database built specifically for large-scale analytics — see the
comparison for when that specialization is worth the added operational overhead).
**Commercial:** none tracked yet.

## Related Grove
[Databases](/grove/databases)
