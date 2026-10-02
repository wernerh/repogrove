---
repos: [coolify, portainer]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# Coolify vs Portainer

## How they differ
Both are self-hostable web UIs for managing containers on your own servers, and
multiple independent comparisons (e.g. oneuptime.com's "Portainer vs Coolify") frame
them as a real either/or choice — but they sit at different layers of the stack.

Coolify is a Heroku/Vercel-style PaaS: push a Git repo (or a Compose file) and it
builds, deploys, fronts the result with routing/TLS, and offers one-click templates
for databases and other self-hosted services. It assumes you want an opinionated
deploy workflow, not direct control over the underlying containers.

Portainer is a general-purpose management layer over infrastructure you already run.
It doesn't build or deploy from a Git push — instead it gives you a GUI and API to
inspect, start, stop, and reconfigure whatever's already running, across Docker,
Swarm, Kubernetes, and Azure Container Instances, with role-based access control built
into even the free Community Edition. It has no opinion about how your containers got
there, and no automatic SSL/routing of its own.

In short: reach for Coolify if you want a Git-push deploy experience that provisions
and routes new services for you; reach for Portainer if you already have containers
or clusters running (via Docker Compose, Swarm, or Kubernetes) and want a GUI, API, and
team access control layered over them, or if you need visibility across more than one
orchestrator at once.
