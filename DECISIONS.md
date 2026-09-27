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
