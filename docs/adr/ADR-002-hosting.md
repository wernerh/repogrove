# ADR-002: Hosting

**Status:** Accepted — target chosen (RG-2 answered); deploy jobs stay stubbed/disabled
pending provisioning (hard human gate, `CLAUDE.md` rule 6)
**Date:** 2026-09-27 (proposed); updated 2026-09-27 (owner answered)

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

## Owner's answer (RG-2, 2026-09-27)
Reply on the decision-email thread: *"can we host as a static app on azure storage"* —
option 3, the owner's existing cloud account, specifically **Azure Storage static-website
hosting**.

## Technical consequence worth flagging back to the owner
Azure Storage static-website hosting serves pre-built static files only — no
server-side rendering, no API routes, no server runtime. That's a narrower target than
Azure Static Web Apps (which pairs static hosting with an Azure Functions backend) or
Vercel/Cloudflare Pages (which both support Next.js SSR/ISR and API routes).
- **Phase 1** (this run): fully compatible. The walking skeleton has no API routes —
  static export (`next build` with `output: "export"`) is the target from the start so
  the app never grows a dependency on a Node server it won't have.
- **Phase 2** (ingestion/metrics): compatible — ingestion runs in GitHub Actions and
  writes committed data files; pages read them at build time, same static-export model.
- **Phase 3** (search, newsletter signup): needs a design that doesn't assume a server.
  Search can likely stay client-side (a small static search index shipped to the
  browser — Lunr/FlexSearch-style — fits a content-sized catalog). Newsletter signup
  needs *some* backend to receive submissions; options to revisit then: add Azure
  Static Web Apps (adds a Functions layer without leaving Azure), a third-party
  form-endpoint service, or reopen hosting. Not a blocker now — recorded here so Phase 3
  planning doesn't get surprised by it.

Provisioning the actual Azure Storage account/static-website config is still a human
action: creating cloud resources is a hard gate (`CLAUDE.md` rule 6) regardless of RG-2
being answered. The factory's deploy job stays a disabled/no-op stub until the owner (or
a future decision) says the account exists and is ready to receive a build.

## Consequences
- Next.js app is scaffolded with `output: "export"` from Phase 1 onward (see
  `next.config`), so no page relies on `next/image`'s default loader, middleware, or
  route handlers that static export can't serve.
- Deploy-related work (env var management, preview deployments, custom domain, DNS,
  the actual `az storage blob` upload step) stays stubbed in code (a disabled/manual
  workflow, or simply absent) rather than half-built against unconfirmed credentials.
- `.factory/decisions.yaml` RG-2 is `ANSWERED`; `TECH-DEBT.md` carries the Phase 3
  search/newsletter caveat above as an open item.
