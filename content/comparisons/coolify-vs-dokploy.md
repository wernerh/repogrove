---
repos: [coolify, dokploy]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# Coolify vs Dokploy

## How they differ
Both are self-hostable, Heroku/Vercel-style PaaS tools that wrap Docker behind a web
UI and a Git-push deploy workflow, and each lists the other as its open-source
alternative — the split is mainly in how each handles more than one server.

Dokploy builds multi-server deployment on Docker Swarm: it's a first-class, built-in
feature, letting you join multiple machines into a Swarm cluster and deploy across
them, alongside managed MySQL/PostgreSQL/MongoDB/MariaDB/Redis instances with built-in
backups and Traefik-based routing/TLS out of the box.

Coolify deploys the same application image to multiple connected servers too, but
without Swarm orchestration underneath: each server runs the deployed container
standalone, and Coolify expects an external, provider-managed load balancer to direct
traffic to the healthy instances. Per Coolify's own docs, its Docker Swarm support is
already deprecated and slated for removal in Coolify v5, with native Docker Compose
scaling and a Coolify-built scaling mechanism planned as the replacement. Coolify's own
catalog of one-click templates for databases and other self-hosted services is broad,
but that multi-server story currently leans more on external infrastructure than
Dokploy's built-in Swarm clustering.

In short: reach for Dokploy if you want multi-server orchestration (Swarm) and
database provisioning built into the platform itself; reach for Coolify if you're
comfortable pairing its one-click template catalog with your own external load
balancer for multi-server setups, or are running on a single server where this
difference doesn't come up.
