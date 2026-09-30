---
github: appwrite/appwrite
name: Appwrite
category: [backend, database, self-hosted]
license: BSD-3-Clause
status: active
featured: false
groves: [self-hosted]
alternatives:
  open_source: [supabase, pocketbase]
  commercial: [firebase, aws-amplify]
---

# Appwrite

Self-hostable backend-as-a-service: auth, databases, storage, functions, and
messaging behind one API.

## What it does
Appwrite packages the pieces a typical app backend needs — authentication, a document
database, file storage, serverless functions, and messaging — into one platform you
either self-host via Docker or run on Appwrite's managed cloud, all behind a single set
of client SDKs.

## Why people use it
- One consistent API surface across auth, database, storage, and functions
- Runs the same self-hosted or on Appwrite's managed cloud, so teams can start managed
  and migrate later without a rewrite
- Broad SDK coverage across web, mobile, and server-side languages

## Pros
- Wide feature surface for a single platform (auth, DB, storage, functions, messaging)
- Active development and a large contributor base
- Self-hosting via Docker is well documented

## Cons
- More moving parts to operate self-hosted than a single-binary alternative like
  PocketBase
- Its own document-style database, not raw SQL, unlike Supabase's Postgres

## Alternatives
**Open-source:** Supabase, PocketBase.
**Commercial:** Firebase, AWS Amplify.

## Related Grove
[Self-Hosted](/grove/self-hosted)
