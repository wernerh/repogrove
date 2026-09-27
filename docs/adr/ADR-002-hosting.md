# ADR-002: Hosting

**Status:** Proposed — deploy jobs disabled pending owner decision (RG-2)
**Date:** 2026-09-27

## Context
The spec (§28) names "Cloudflare + modern cloud hosting" as a target, but no account is
provisioned yet. Creating cloud resources or spending money is a hard human gate
(`CLAUDE.md` rule 6) — the factory cannot provision hosting on its own initiative.

## Decision
Hosting stays **undecided** for now. CI (`ci.yml`) validates lint/test/build only; no
deploy job exists. The question is registered as `RG-2` in `.factory/decisions.yaml` and
emailed to the owner once (see the bootstrap PR / Step 5 email).

## Options put to the owner
1. **Cloudflare Pages** (matches the spec's stated preference) — good fit for a
   static/ISR Next.js content site, generous free tier.
2. **Vercel** — first-party Next.js hosting, simplest DX, but a second vendor beyond the
   spec's stated preference.
3. **Owner's own existing cloud account**, if one exists, for full control.

**Recommended default:** Cloudflare Pages, matching the spec, once the owner confirms an
account. This default does not auto-apply — hosting is expensive to reverse, so it stays
stubbed until answered (per `docs/DECISION-PROTOCOL.md`).

## Consequences
Until answered, deploy-related work (env var management, preview deployments, custom
domain, DNS) is stubbed in code (feature-flagged or simply absent) rather than half-built
against a guessed target.
