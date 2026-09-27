# /agents

Design-time role definitions for the content/research agents described in spec §19 —
Discovery, Classification, Research, Comparison, News, Trend, Editorial, Security, SEO,
Newsletter. These are **not yet implemented as running processes**; this directory holds
their prompts/specs as they're formalised (Phase 4+, see `ROADMAP.md`).

Until then, the three factory lanes (dev/security/design — see `CLAUDE.md`) do this work
directly. Splitting into the finer-grained agents above is a Phase 4+ concern once there's
enough real content flow to justify the extra process.

No agent here — present or future — has authority to publish directly. All output is a PR
proposal, reviewed and merged like any other change (spec §20, §33).
