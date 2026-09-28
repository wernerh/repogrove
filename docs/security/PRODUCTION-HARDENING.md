# Production hardening checklist

Status legend: PASS / FAIL / PARTIAL / NOT VERIFIED. This checklist is aspirational until
a real deployment exists (ADR-002) — most items are NOT VERIFIED by design until then.

| Item | Status | Notes |
|---|---|---|
| No secrets committed to Git | PASS | `.gitignore` blocks `.env*`, key files; `scripts/factory/check.py` scans for secret-looking strings |
| No real personal data committed | PASS | No PII collected yet; policy in `SECURITY.md` |
| Dependency vulnerability scanning in CI | PASS | `.github/workflows/ci.yml` runs `npm audit --audit-level=high`; Dependabot configured for `npm` + `github-actions`. Re-ran `npm audit` fresh 2026-09-28: 0 vulnerabilities at any level (2 prior moderate findings resolved by dependabot's vitest 5.0.1 bump, PR #15) |
| Least-privilege `GITHUB_TOKEN` permissions per workflow | PARTIAL | `ingestion.yml` (`contents: write`, needed) and `ci.yml` (`contents: read`, added 2026-09-27 — see SEC-001) declare explicit permissions; `factory-guardrails.yml` still relies on the repo/org default because CLAUDE.md rule 7 forbids any lane from editing that file — owner action needed. Re-checked 2026-09-28: unchanged |
| Branch protection on `main` requiring CI | NOT VERIFIED | Recommended to the owner in the bootstrap PR; factory cannot enable it itself. Confirmed again 2026-09-28: `GET .../branches/main/protection` returns 403 (GitHub App installation isn't granted repo-admin) — the factory has no way to check this from here, only to recommend it |
| CSP / security headers | NOT VERIFIED | `src/` now exists (Phase 1) but the app builds with `output: "export"` (static export, ADR-002/RG-2 — Azure Storage static-website hosting has no server runtime), so `next.config.ts` `headers()` and middleware aren't available; CSP has to be applied at the hosting/CDN layer instead. Genuinely blocked on a live deployment target, not on app code — revisit once hosting is provisioned |
| Rate limiting on API routes | NOT VERIFIED | No API routes exist yet (Phase 3 per `docs/WORKPLAN.md` — search, newsletter signup) |
| Secrets management for deploy | NOT VERIFIED | No hosting target provisioned (ADR-002); deploy jobs stay stubbed/disabled per CLAUDE.md rule 5 |
| HTTPS enforced | NOT VERIFIED | No deployment exists |
| Dependency lockfile committed | PASS | `package-lock.json` committed (Phase 1); every workflow uses `npm ci`, not `npm install` |
| Source maps / secrets not leaked in client bundle | PASS | Checked 2026-09-27: `npm run build` output (`out/`) has no `.map` files and no `process.env`/token strings; `productionBrowserSourceMaps` is not enabled in `next.config.ts`. Re-checked 2026-09-28 after design lane's token/CSS restyle (PR #25): still clean |
| Content-rendering XSS surface | PASS | Checked 2026-09-27: `react-markdown` used with no raw-HTML plugin (`rehype-raw`, etc.) anywhere in `src/`, so Markdown body content can't inject HTML/script even though it's currently trusted (PR-reviewed) content. Re-checked 2026-09-28: still no raw-HTML plugin or `dangerouslySetInnerHTML` anywhere in `src/`/`scripts/` |
