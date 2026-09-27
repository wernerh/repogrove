# RepoGrove

> A curated map of the open-source ecosystem.

RepoGrove helps developers answer questions GitHub itself doesn't: what's hot right now,
what's rising before it's mainstream, what's the open-source alternative to this paid
tool, and what actually happened recently with a project.

This repository is being built and maintained by an autonomous software factory (see
`CLAUDE.md`) under a single human owner. It is not yet deployed anywhere.

## Status
**Phase 0 complete.** Phase 1 (walking skeleton — static homepage, one Grove page, one
repo page from hand-written content) is next. See `PROJECT_STATE.md` for the live state
and `docs/WORKPLAN.md` for the full phased plan.

## Repository map
| Path | What |
|---|---|
| `PRODUCT.md` | What RepoGrove is and why |
| `ARCHITECTURE.md` | How it's built (hybrid Git-content + DB-metrics) |
| `ROADMAP.md` | Phased feature roadmap → GitHub issues |
| `docs/WORKPLAN.md` | Phased build plan with gates |
| `docs/adr/` | Architecture decision records |
| `content/` | The Git-native content database (Groves, repo write-ups, alternatives) |
| `src/` | The Next.js application (Phase 1+) |
| `docs/security/`, `docs/design/` | Security and design factory lanes' working docs |
| `CLAUDE.md` | Operating manual for the autonomous factory |

## Contributing
Not yet open for external contribution (see `docs/WORKPLAN.md` for when that changes,
per spec §21). All changes currently go through PR + CI regardless of author, human or
agent.

## License
Not yet decided — see `docs/adr/` once an ADR is added for this.
