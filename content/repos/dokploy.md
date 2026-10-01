---
github: Dokploy/dokploy
name: Dokploy
category: [paas, self-hosted, devops]
license: Apache-2.0
status: active
featured: false
groves: [self-hosted]
alternatives:
  open_source: [coolify]
  commercial: [Vercel, Heroku, Netlify]
---

# Dokploy

Self-hostable PaaS for deploying applications, databases, and Docker Compose stacks
across your own servers.

## What it does
Dokploy wraps Docker and Docker Swarm behind a web UI and API: push a Git repo (via
Nixpacks, Heroku-style buildpacks, or a plain Dockerfile), or bring your own Docker
Compose file, and it builds, deploys, and fronts the result with Traefik — including
managed MySQL/PostgreSQL/MongoDB/MariaDB/Redis instances with built-in backups, across
one server or a multi-node Swarm cluster.

## Why people use it
- Deploys across multiple remote servers and Docker Swarm clusters out of the box, not
  just a single host
- One-click templates for common self-hosted stacks (Supabase, Cal.com, PocketBase, and
  others), not only arbitrary app deploys
- Built-in database provisioning and backups alongside app hosting, so a separate
  database admin tool isn't needed
- Traefik-based routing and TLS come configured by default

## Pros
- Multi-server and Docker Swarm support is a first-class, built-in feature rather than
  an add-on
- Large, fast-growing template catalog for one-click self-hosted services
- Active development and a large community following its rapid growth

## Cons
- Some enterprise features — SSO/SAML, audit logging, white-labeling, SCIM
  provisioning, and custom roles — require a separate paid license key from the
  Dokploy team; the core deployment platform itself stays Apache-2.0
- Multi-server support orchestrates workloads across machines you provision and join
  yourself — it doesn't provision servers, autoscale, or recover a dead node on its
  own, so it suits a small, hand-managed fleet more than a large dynamic one
- Self-hosting it means you're also responsible for its own security posture and
  uptime

## Alternatives
**Open-source:** Coolify.
**Commercial:** Vercel, Heroku, Netlify.

## Related Grove
[Self-Hosted](/grove/self-hosted)
