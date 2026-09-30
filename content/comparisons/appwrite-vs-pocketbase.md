---
repos: [appwrite, pocketbase]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# Appwrite vs PocketBase

## How they differ
Both are self-hostable, open-source backends covering auth, a database, and file
storage, and each already lists the other as an open-source alternative — the real
choice between them is platform breadth versus operational simplicity.

Appwrite runs as a set of Docker services (API, database, and dedicated workers for
functions, messaging, and more) — more to stand up than a single binary, but in
exchange you get a wider feature surface out of the box: native push/email/SMS
messaging and a broad catalog of first-party serverless function runtimes, on top of
auth, a document-style database, and storage.

PocketBase is one small Go binary embedding SQLite: no separate services to run, no
Docker Compose file to maintain, and a single file to back up. That simplicity comes
with a narrower feature set — no built-in messaging, and SQLite underneath means it's
not the right fit for workloads with many concurrent writers.

In short: reach for Appwrite when you want one platform that also covers messaging and
a deep function-runtime catalog, and the extra services are worth it; reach for
PocketBase when a small-to-medium app just needs auth, data, and storage with as little
to operate as possible.
