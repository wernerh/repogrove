---
github: pocketbase/pocketbase
name: PocketBase
category: [backend, database, self-hosted]
license: MIT
status: active
featured: false
groves: [self-hosted]
alternatives:
  open_source: [supabase, appwrite]
  commercial: [firebase]
---

# PocketBase

Open-source backend in a single file: SQLite database, auth, file storage, and a
realtime API.

## What it does
PocketBase ships as one small Go binary embedding SQLite, a REST/realtime API, file
storage, and an admin dashboard — download it, run it, and you have a working backend
with no separate services to install or wire together.

## Why people use it
- One binary, one process — nothing else to install or operate
- Admin dashboard for managing collections, records, and users out of the box
- Also usable as a Go framework, not just a standalone server, for apps that need
  custom server-side logic

## Pros
- Extremely fast to get a backend running for a small-to-medium app
- Low operational overhead — a single SQLite file is easy to back up and move
- Active development, responsive maintainer

## Cons
- SQLite underneath means it doesn't suit high-write-concurrency or multi-writer-node
  workloads the way a client-server database does
- Smaller ecosystem and fewer managed/hosted options than Supabase or Firebase

## Alternatives
**Open-source:** Supabase, Appwrite.
**Commercial:** Firebase.

## Related Grove
[Self-Hosted](/grove/self-hosted)
