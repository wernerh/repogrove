---
repos: [dokploy, portainer]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# Dokploy vs Portainer

## How they differ
Both let you manage containerized workloads across your own servers from a web UI, and
independent writeups (e.g. saashub's "Dokploy vs Portainer") compare them directly —
but Dokploy deploys applications for you, while Portainer manages whatever is already
deployed.

Dokploy wraps Docker and Docker Swarm behind a Git-push deploy workflow: point it at a
repo or a Compose file and it builds, deploys, provisions managed databases (MySQL,
PostgreSQL, MongoDB, MariaDB, Redis) with backups, and fronts everything with Traefik
routing and TLS, including across a multi-node Swarm cluster out of the box.

Portainer doesn't build or deploy anything on its own — it's a management and
visibility layer over containers, Swarm services, and Kubernetes workloads that already
exist, with broader orchestrator coverage (Docker, Swarm, Kubernetes, and Azure
Container Instances all through one interface) and role-based access control included
in its free Community Edition.

In short: reach for Dokploy if you want Git-push deploys with managed databases and
routing handled for you; reach for Portainer if you want a single GUI and API to
operate and audit containers or clusters you're deploying some other way, especially
across more than one orchestrator.
