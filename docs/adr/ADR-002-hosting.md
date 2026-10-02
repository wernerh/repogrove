# ADR-002: Hosting

**Status:** Accepted and **deployed** — live at https://www.repogrove.com on Azure Static
Web Apps since 2026-10-02 (see the addendum at the end; sections above it are the
historical record up to the owner's answer)
**Date:** 2026-09-27 (proposed); updated 2026-09-27 (owner answered); addendum 2026-10-02

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

## Addendum — Deployed (2026-10-02)
The owner provisioned the Azure resources (the hard human gate, `CLAUDE.md` rule 6) and the
site is live at **https://www.repogrove.com**.

**Deviation from RG-2's answer.** RG-2 asked for *Azure Storage static-website hosting*;
what was provisioned is **Azure Static Web Apps** (`.github/workflows/azure-static-web-apps-orange-sea-032472e10.yml`).
Both serve pre-built static files, so nothing in the app changes: `output: "export"` and the
"no server runtime" constraints in ADR-005/006/007/008 still hold. Static Web Apps is the
option this ADR already named as the escape hatch, since it can pair static hosting with
managed Azure Functions. No Functions are in use, and adding any is a new decision
(CLAUDE.md rule 6), not implied by this deployment.

**How it deploys**
- Trigger: push to `main` builds and deploys to production; PRs against `main` get a preview
  environment that is closed when the PR closes.
- Build: the Azure action builds the app itself (`app_location: "/"`, no `skip_app_build`) and
  publishes `out/` (`output_location: "out"`). CI (`ci.yml`) still runs lint/test/build separately.
- Auth: OIDC id-token plus the repo secret `AZURE_STATIC_WEB_APPS_API_TOKEN_ORANGE_SEA_032472E10`
  (owner-managed; never committed).
- Domain: `www.repogrove.com` (registered at GoDaddy). Verified 2026-10-02 that it serves the
  RepoGrove homepage. Not verified: apex `repogrove.com` handling, HTTP-to-HTTPS redirect,
  security headers.

**Consequences**
- A merge to `main` is a production deploy (see `CLAUDE.md` rule 5, `OPERATIONS.md`).
- Commits pushed by `ingestion.yml` and `design-screenshots.yml` use the workflow
  `GITHUB_TOKEN`, which does not trigger other workflows, so they may not redeploy the site.
  Open item in `TECH-DEBT.md`; the daily metrics refresh may only reach production when
  something else deploys.
- Headers/CSP and routing can now be set via `staticwebapp.config.json` (none in the repo yet;
  `docs/security/PRODUCTION-HARDENING.md`).
- The Phase 3 newsletter-signup backend and any public API (RG-9) keep their own pending
  decisions; managed Functions is one option that stays inside the same Azure service.
- RG-2 stays `ANSWERED`; the RG-7 premise ("not deployed") changed (`.factory/decisions.yaml`).
