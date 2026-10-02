# CLAUDE.md — RepoGrove Operating Manual

This file is the operating manual for the autonomous software factory that builds and
maintains **RepoGrove**. It wins over any stale copy of these instructions found elsewhere
(a Claude Project description, an old scheduled-task prompt, etc.). If something here
conflicts with a Project doc, **this file wins**.

## 1. Identity

- **Product:** RepoGrove — a curated discovery & intelligence platform for the open-source
  ecosystem (repositories, "Groves", alternatives, momentum, newsletter).
- **Owner / sole approver:** Werner Hurter (GitHub: `wernerh`) — whurter5@gmail.com
- **Pilot customer:** none — this is a public product, not built for a specific customer.
- **Repo:** `wernerh/repogrove` (this repo is the source of truth)
- **Live site:** https://www.repogrove.com (Azure Static Web Apps, deployed 2026-10-02)
- **Scheduled tasks (by name):**
  - `RepoGrove dev factory run` — every 2h
  - `RepoGrove security factory run` — every 4h, offset
  - `RepoGrove design factory run` — every 4h, offset

## 2. Read first, every run

1. `PROJECT_STATE.md` — current phase and the ONE next action
2. `.factory/state.yaml` — lock, active tasks, health, lane blocks
3. `.factory/decisions.yaml` — open owner questions
4. `ROADMAP.md`, `docs/WORKPLAN.md`
5. `TECH-DEBT.md`, `docs/security/README.md`, `docs/design/README.md`
6. Open GitHub issues and PRs, latest Actions runs

## 3. Hard rules

1. **No real user data.** Data sensitivity is low (public GitHub metadata, and newsletter
   subscriber emails once that feature ships) but subscriber emails are still PII — never
   commit real email addresses, real subscriber lists, or any scraped personal data. Use
   synthetic/example data in the repo.
2. **No secrets.** No API keys, tokens, `.env` files, or credentials committed, ever.
3. **The stack is locked** (see ADR-001): Next.js + React + TypeScript + Tailwind CSS,
   Git-native Markdown content, PostgreSQL (or SQLite pre-launch) for volatile data, GitHub
   Actions for scheduled ingestion. Changing it needs a new ADR **and** an owner decision —
   it is expensive to reverse.
4. **Domain rules (non-negotiable):**
   - Editorial content (Groves, repo write-ups, comparisons, alternatives, newsletter
     copy) lives in Git as Markdown/MDX under `/content`. It is never generated straight
     to the live site without going through a PR + CI.
   - Volatile / computed data (star history, snapshots, search index, computed "Heat")
     lives in the database, populated by ingestion jobs, never hand-edited.
   - No agent's own generated output is treated as authoritative. All of it is a PR
     proposal until CI passes and it is merged.
   - RepoGrove must not simply mirror GitHub descriptions — every published repo/alternative
     page needs a human-readable (or agent-drafted-and-reviewed) interpretation, not a raw
     scrape.
5. **Hosting is decided and live.** RepoGrove is deployed as a static export
   (`output: "export"`) on Azure Static Web Apps at https://www.repogrove.com
   (owner-provisioned, 2026-10-02; see ADR-002 and its addendum, `OPERATIONS.md`).
   `.github/workflows/azure-static-web-apps-*.yml` deploys on every push to `main` and
   builds a preview per PR, so **a merge to `main` is a production deploy**: merge only
   green PRs and treat merge as publish. The deploy workflow, its secret, the custom
   domain/DNS and every Azure resource are owner-managed: never edit them, create cloud
   resources, or add a second deploy target without a `needs-human` issue (rule 6).
   There is no server runtime: no API routes, middleware or SSR.
6. Human gates (stop, open a `needs-human` issue, email the owner): spending money,
   creating cloud resources, registering identity-provider apps or secrets, production
   deploys, contacting anyone but the owner, publishing externally (newsletter sends,
   social posts), anything destructive/irreversible, expensive-to-reverse architecture
   (auth provider, data model, hosting, framework, paid vendor, public API shape).
7. One major task (+ up to 2 small related ones) per run. Never disable tests, lint, or
   CI checks to get green. Never bypass branch protection. Never edit
   `scripts/factory/*`, `.github/workflows/factory-guardrails.yml`, checker thresholds, or
   `.claude/**` (the lane skills and reviewer agents — a lane must not be able to weaken
   its own reviewer or protocol; only the owner changes these, via a `needs-human` PR).
8. A quiet run with no safe work to do is a **successful** run.

## 4. Run loop

lock → observe → diagnose/prioritise → plan → implement → validate → review → PR → merge
→ update memory → report. The exact per-run protocol, lock schema, and report format live
in version-controlled skills: `.claude/skills/factory-core/SKILL.md` (shared) plus
`dev-factory`, `security-factory` and `design-factory` (per lane). Each lane's independent
reviewer is a read-only subagent in `.claude/agents/` (`factory-reviewer-dev`,
`-security`, `-design`). Scheduled tasks are thin wrappers that invoke the lane skill —
see `docs/factory/README.md`. `docs/factory/*-run.md` are legacy mirrors of the old
inline task prompts and are superseded once a task is switched. The skills are
authoritative for *how* a run behaves; this file is authoritative for *what the product is
and the rules that never change*.

**Local validation vs CI:** this environment can run `npm ci`, `npm run lint`, `npm test`,
`npm run build` for the Next.js app locally. GitHub Actions is the source of truth for
anything requiring secrets or network access beyond `registry.npmjs.org` and the GitHub
API (e.g. a real Postgres instance, deploy previews). Record in every report which checks
ran locally vs. which were left to CI and why.

## 5. Factories (lanes)

- **dev** — features, bugs, roadmap execution, ingestion pipeline, site code. Owns
  `PROJECT_STATE.md`'s Phase / Next action / Timebox / Failed attempts / Milestones. Also
  fixes security and UX findings it has claimed. Label: `factory`.
- **security** — finds, documents, and (where safe) fixes security issues across the
  frontend, API/ingestion jobs, and repository-controlled CI/CD. Owns `docs/security/`
  and the `security:` block in `.factory/state.yaml`. Only this lane sets a finding to
  `Verified`. Label: `factory-security`.
- **design** — design system, UX/accessibility findings, UI polish. No API, data model,
  or feature work — file an issue for dev instead. Owns `docs/design/` and the `design:`
  block. Label: `factory-design`.

Shared lock: `.factory/state.yaml` `factory.current_run` / `factory.holder`. A lane takes
the lock at the start of a run and releases it at close-out (max 40 min hold; if CI is
still running, leave the PR for next run). Each lane merges only PRs it opened with its
own label — never another lane's PR, never a `needs-human` PR. Other lanes may leave
review comments only.

Claims: a lane claims a GitHub issue by commenting on it; the claim expires after 24h
with no open PR. Don't start work on files another lane has an open PR against.

Shared files (`CHANGELOG.md`, `TECH-DEBT.md`, `DECISIONS.md`, `ROADMAP.md`): append only;
never rewrite another lane's entries. Other lanes may add one decision row and one
"Blockers" line to `PROJECT_STATE.md`.

## 6. Conventions

- Commits: [Conventional Commits](https://www.conventionalcommits.org/) —
  `feat:`, `fix:`, `refactor:`, `security:`, `infra:`, `docs:`, `design:`, `chore:`.
- Branches: `feat/…`, `fix/…`, `refactor/…`, `security/…`, `infra/…`, `docs/…`, `design/…`.
- API style: REST-ish JSON under `/api/*` in the Next.js app; errors as
  `{ "error": { "code": string, "message": string } }`.
- Naming: repo slugs are `owner/name` lowercased; Grove slugs are kebab-case; content
  files are named after their slug (`content/repos/ollama.md`, not `content/repos/Ollama.md`).
- Labels: `phase-0` … `phase-N`, `needs-human`, `security`, `tech-debt`, `bug`, `factory`,
  `factory-security`, `factory-design`, `ux`, `accessibility`, plus domain labels
  (`ingestion`, `content`, `search`, `newsletter`, `seo`).

## 7. Product one-liner (for anyone landing here cold)

RepoGrove answers "what open-source software should I know about?" — it's a curated map
of the OSS ecosystem: Groves (curated collections), repo intelligence pages, "what's the
open-source alternative to X" pages, momentum/rising signals, and a weekly newsletter.
Full product spec: `PRODUCT.md`. Architecture: `ARCHITECTURE.md`. Phased build order:
`docs/WORKPLAN.md`.
