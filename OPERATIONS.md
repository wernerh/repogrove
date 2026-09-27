# OPERATIONS.md

## Current state
No production deployment exists. Hosting is undecided (see ADR-002 and decision RG-2 in
`.factory/decisions.yaml`). This document will be filled in once a hosting target is
chosen and CI has a real deploy job to describe.

## CI
`.github/workflows/ci.yml` runs lint, test, and build for the Next.js app on every PR and
on `main`, plus a dependency vulnerability scan. `.github/workflows/factory-guardrails.yml`
runs `scripts/factory/check.py` on every PR to enforce the factory's own guard rails
(state file shape, no secrets, no data exports, findings file headers).

## Local development
```
npm ci
npm run lint
npm test
npm run dev      # local dev server
npm run build    # production build check
```
See `README.md` for first-time setup once `/src` has an app in it (Phase 1).

## Ingestion
GitHub Actions on a schedule calls the GitHub API to refresh `RepositorySnapshot` rows
for every repo referenced in `/content`. Not yet implemented — see `docs/WORKPLAN.md`
Phase 2.

## Incident response
No production system exists yet, so there is no live incident process. When one exists,
this section will define on-call ownership (the owner is the only human in this project),
rollback procedure, and where alerts land.
