---
repos: [pocketbase, supabase]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# PocketBase vs Supabase

## How they differ
Both are open-source backends you can self-host instead of paying for a proprietary
BaaS, and each already lists the other as an open-source alternative — but they sit at
opposite ends of "how much are you operating?"

PocketBase ships as a single small Go binary that embeds SQLite: download it, run it,
and auth, a database, file storage, and a realtime API are all there in one process, one
file. There's no separate database service to provision or keep up — backing it up is
copying the file. The tradeoff is SQLite itself: it doesn't suit workloads with many
concurrent writers the way a client-server database does, and PocketBase has no managed
cloud tier — self-hosting (or running it yourself some other way) is the only option.

Supabase is built on real Postgres, either self-hosted or as a fully managed cloud
service. That gets you Postgres's concurrency model, SQL, and extension ecosystem, plus
the option to not operate anything at all — but self-hosting the full stack means
running several services (Postgres, Auth, Storage, Realtime, and more), not one binary.

In short: reach for PocketBase for a small-to-medium app where minimal operational
overhead matters most and SQLite's limits aren't a concern; reach for Supabase when you
need Postgres's concurrency and ecosystem, or want a managed option without giving up
self-hosting later.
