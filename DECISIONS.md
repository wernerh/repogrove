# DECISIONS.md

Append-only decision log. Each lane appends its own entries; never rewrite another lane's
rows. Cross-reference `.factory/decisions.yaml` for the machine-readable owner-question
register and email/issue links.

| Date | ID | Decision | Lane | Reversibility | Status |
|---|---|---|---|---|---|
| 2026-09-27 | RG-0 | Adopt hybrid Git-content + DB-metrics architecture (spec §17) | dev | expensive | LOCKED |
| 2026-09-27 | RG-1 | Stack: Next.js/React/TS + Tailwind + SQLite→Postgres (ADR-001) | dev | expensive | LOCKED |
| 2026-09-27 | RG-2 | Hosting target left undecided; deploy jobs disabled until owner provisions an account (ADR-002) | dev | expensive | OPEN — see decisions.yaml |
| 2026-09-27 | RG-3 | Repo visibility: public (no PII risk in content-only repo; supports future community PRs per spec §21) | dev | cheap | PROVISIONAL |
| 2026-09-27 | RG-4 | Visual direction: proceeding on recommended default (editorial/content-forward) — no owner reply yet, checked at design-lane run 1; auto-defaults 2026-09-30 if still unanswered | design | cheap | OPEN — see decisions.yaml |
| 2026-09-27 | RG-2 | Owner replied on the decision thread: host as a static app on Azure Storage (owner's existing cloud account). ADR-002 updated; Next.js scaffolded with static export from Phase 1 so it stays compatible. Actual account provisioning is still a human action (hard gate). Phase 3 search/newsletter will need a non-server-dependent design — flagged in TECH-DEBT.md | dev | expensive | ANSWERED |
| 2026-09-27 | RG-3 | Owner replied "happy with public" — repo visibility confirmed public | dev | cheap | ANSWERED |
| 2026-09-27 | ADR-005 | `RepositorySnapshot` history stored as a committed SQLite file (`data/repogrove.db`), updated incrementally by a daily GitHub Actions ingestion job — not regenerated at `next build` time. Implementation choice inside the already-locked stack/hosting decisions (ADR-001, RG-2), not a new owner-gated pivot | dev | cheap | LOCKED |
| 2026-09-27 | RG-5 | Excluded Open WebUI from tracked repos despite being an obvious AI-grove candidate — its 2025 license change (v0.6.6+) moved it off an OSI-approved license to a modified source-available license with a branding clause; not a fit for an "open-source ecosystem" site without an explicit callout. Editorial call, not an owner-gated decision; revisit if the owner wants it included with a caveat | dev | cheap | PROVISIONAL |
| 2026-09-28 | RG-4 | Re-checked the email thread (1a0e3c35fae4b534) this run — no new reply from whurter5@gmail.com since the ambiguous "happy with public and suggestions" already recorded 2026-09-27. Still proceeding on the recommended default (editorial/content-forward); this run wired the resulting tokens into code. Auto-defaults 2026-09-30 if still unanswered | design | cheap | OPEN — see decisions.yaml |
