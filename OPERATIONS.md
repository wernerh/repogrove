# OPERATIONS.md

## Current state
RepoGrove is **live** at https://www.repogrove.com, deployed as a static export on Azure
Static Web Apps (owner-provisioned 2026-10-02; ADR-002 and its addendum). The domain
`repogrove.com` is registered at GoDaddy. The owner is the only human operator.

## Deployment
- **Workflow:** `.github/workflows/azure-static-web-apps-orange-sea-032472e10.yml` (generated
  by Azure; owner-managed).
- **Production:** every push to `main` builds the app and uploads `out/`. A merge to `main`
  is therefore a production deploy; there is no separate release step.
- **Previews:** every PR against `main` gets a preview environment, closed when the PR closes.
- **Credentials:** repo secret `AZURE_STATIC_WEB_APPS_API_TOKEN_ORANGE_SEA_032472E10` plus
  an OIDC id-token. Rotation and Azure-side settings are done by the owner in the Azure
  portal; the factory never touches them (`CLAUDE.md` rules 5-6).
- **Runtime limits:** static files only. No API routes, middleware, SSR or `next start`.
  Anything needing a server (newsletter submissions, a public API) needs a new decision
  first (ADR-002 addendum, RG-9).
- **Known gap:** commits pushed by the ingestion and screenshot workflows use `GITHUB_TOKEN`
  and may not trigger a redeploy, so daily metrics may lag until the next merge
  (`TECH-DEBT.md`). Not yet verified against the live site.

## CI
`.github/workflows/ci.yml` runs the guardrail check, lint, test, build and a dependency
vulnerability scan on every PR and on `main`. `factory-guardrails.yml` runs
`scripts/factory/check.py` on every PR. `design-screenshots.yml` runs the Playwright
screenshot and accessibility harness (ADR-007). The Azure workflow above is the only job
that deploys.

## Local development
```
npm ci
npm run lint
npm test
npm run dev      # local dev server
npm run build    # static export into out/
```

## Ingestion
`.github/workflows/ingestion.yml` runs daily (04:17 UTC) and on demand. It fetches public
GitHub metrics for every repo in `/content` and commits updates to `data/repogrove.db`
(ADR-005). It uses only the default `GITHUB_TOKEN`.

## Rollback and incident response
- **Bad deploy:** revert the offending commit on `main` through a PR; the merge redeploys.
  Re-running the Azure workflow for a known-good commit from the Actions tab is the faster
  manual option. Restoring from the Azure portal is owner-only.
- **Outage or Azure/DNS problem:** owner-only. The factory cannot touch Azure or DNS.
- **Security issue on the live site:** see `SECURITY.md` (private email to the owner).
- No monitoring, alerting or analytics exist yet; nothing pages anyone. Detection today is
  the owner noticing.
