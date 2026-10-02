# RepoGrove

> A curated map of the open-source ecosystem.

RepoGrove helps developers answer questions GitHub itself doesn't: what's hot right now,
what's rising before it's mainstream, what's the open-source alternative to this paid
tool, and what actually happened recently with a project.

This repository is being built and maintained by an autonomous software factory (see
`CLAUDE.md`) under a single human owner. The site is live at https://www.repogrove.com (Azure Static
Web Apps).

## Status
**Phase 3 complete** (the 17-item MVP gate is met) and **deployed**: a static export hosted
on Azure Static Web Apps at https://www.repogrove.com. Phase 4 (accounts, alerts, API,
newsletter automation) waits on owner decisions RG-7/8/9. See `PROJECT_STATE.md` for the
live state, `OPERATIONS.md` for how deploys work, and `docs/WORKPLAN.md` for the phased plan.

## Repository map
| Path | What |
|---|---|
| `PRODUCT.md` | What RepoGrove is and why |
| `ARCHITECTURE.md` | How it's built (hybrid Git-content + DB-metrics) |
| `ROADMAP.md` | Phased feature roadmap → GitHub issues |
| `docs/WORKPLAN.md` | Phased build plan with gates |
| `docs/adr/` | Architecture decision records |
| `content/` | The Git-native content database (Groves, repo write-ups, alternatives) |
| `src/` | The Next.js application (static export, deployed to Azure Static Web Apps) |
| `OPERATIONS.md` | Deployment, CI, ingestion and rollback runbook |
| `docs/security/`, `docs/design/` | Security and design factory lanes' working docs |
| `CLAUDE.md` | Operating manual for the autonomous factory |

## Contributing
Not yet open for external contribution (see `docs/WORKPLAN.md` for when that changes,
per spec §21). All changes currently go through PR + CI regardless of author, human or
agent.

## License
Not yet decided — see `docs/adr/` once an ADR is added for this.
