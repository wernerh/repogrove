---
repos: [appwrite, supabase]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# Appwrite vs Supabase

## How they differ
Both are self-hostable, open-source Firebase alternatives — auth, a database, file
storage, and serverless functions behind one API — and each already lists the other as
an open-source alternative. The real difference is what's underneath the database layer.

Supabase is built on real Postgres. You get the full relational feature set (SQL, joins,
extensions, row-level security enforced by Postgres itself), which matters if you
already know SQL or need Postgres-specific tooling. It's also self-hostable or usable as
a fully managed cloud service with no self-hosting at all.

Appwrite models data as collections of documents through its own API, backed by MariaDB
internally — you work through Appwrite's SDKs and console rather than writing SQL
directly. In exchange, Appwrite's feature surface reaches further out of the box: native
push/email/SMS messaging and a broader set of first-party serverless function runtimes
ship alongside auth, database, and storage.

In short: reach for Supabase when "it's just Postgres" is the point — you want SQL,
Postgres extensions, or a managed cloud tier; reach for Appwrite when you want one
platform that also covers messaging and a wider function-runtime catalog, and you're
comfortable working through its document-style API instead of raw SQL.
