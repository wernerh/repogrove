---
github: IceWhaleTech/CasaOS
name: CasaOS
category: [self-hosted, nas, home-server]
license: Apache-2.0
status: active
featured: false
groves: [self-hosted]
alternatives:
  open_source: []
  commercial: [Synology DSM]
---

# CasaOS

A personal cloud operating system that turns a Raspberry Pi, an old PC, or a mini server
into a self-hosted home server with a polished web dashboard — no command line required.

## What it does
CasaOS installs on top of Linux with a single shell-script command and gives you a
browser-based dashboard for running self-hosted apps as Docker containers, managing
files, and configuring the box the way you would a consumer NAS — all through
point-and-click, not hand-written `docker run` commands or Compose files. It ships its
own curated app store (Nextcloud, Jellyfin, Pi-hole, AdGuard, Plex, and more), so adding
a new self-hosted service is a few clicks rather than editing YAML.

## Why people use it
- Turns commodity hardware (a Raspberry Pi, an old laptop, a ZimaBoard) into a usable home server without first needing to know Docker
- A built-in app store covers the most commonly self-hosted services out of the box, rather than leaving you to find and configure Compose files yourself
- A purpose-built dashboard rather than a bare terminal or a generic container-management GUI
- Apache-2.0 licensed with no paywalled tier — the dashboard and app store are both free

## Pros
- Lowest barrier to entry in this Grove for someone new to self-hosting — no Docker or Linux command-line knowledge assumed
- Curated app store covers the services most home-server users actually want, out of the box
- Backed by IceWhaleTech, which also sells ZimaBoard hardware designed around it, giving the project a funded maintainer with a commercial incentive to keep it working

## Cons
- Abstracts Docker away rather than exposing it the way Portainer does — someone who already knows Docker and wants direct control may find it limiting
- No built-in clustering, failover, or RAID management the way TrueNAS or Unraid offer — built for one home server, not redundant enterprise-grade storage
- Commercial ties to ZimaBoard hardware mean some documentation and community attention skews toward that hardware, even though CasaOS itself runs on any compatible Linux box

## Alternatives
No open-source alternative in RepoGrove's catalog yet.
**Commercial:** Synology DSM.

## Related Grove
[Self-Hosted](/grove/self-hosted)
