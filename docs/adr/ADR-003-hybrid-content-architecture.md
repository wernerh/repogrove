# ADR-003: Hybrid Git-content + database-metrics architecture

**Status:** Accepted
**Date:** 2026-09-27

## Context
The spec lays out three options (§15–17): a traditional database (Option A), a pure
Git-native content database (Option B), or a hybrid. The spec itself recommends
investigating the hybrid, and gives the underlying reason: editorial knowledge benefits
from version control (author, diff, review per change) while GitHub metrics change too
fast and too mechanically to belong in Git.

## Decision
Adopt the hybrid architecture described in spec §17 and `ARCHITECTURE.md`:
- Git (`/content`) owns editorial content and curated relationships (Grove membership,
  alternatives, pros/cons, comparisons).
- The database owns computed/volatile data (snapshots, news cache, search index,
  computed momentum).
- The database's copies of editorial relationships (e.g. a `RepositoryGrove` join table)
  are **denormalised mirrors for query performance**, refreshed from `/content` by CI —
  never edited directly, never the authority.

## Consequences
- Every editorial change is a reviewable PR by construction — this is also how the
  "autonomous agents must not treat their own output as authoritative" rule (spec §20,
  §33) gets enforced mechanically rather than by policy alone.
- Adds one moving part (a content→DB sync step) that must run in ingestion/build and be
  tested for drift (content says X, DB still shows old Y) — tracked as tech debt if it's
  not built by the time Phase 2 needs it.
