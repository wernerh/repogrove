# Factory run history (archived `next_actions`)

Archived `next_actions` narrative entries from `.factory/state.yaml` (TECH-DEBT.md's
2026-10-01 row: that list is append-only with no trimming, and reading the full
history on every lock acquisition got expensive enough to cost a real run a
tool-output truncation). `.factory/state.yaml`'s own `next_actions` keeps only the
most recent entries going forward; older ones land here instead of growing the file
a lock-acquisition read has to pull in every run. Nothing in `scripts/factory/`
reads this file — it's for a human (or a future run specifically looking for older
context) to skim, same role the archived entries played in state.yaml before this.

Newest-archived-first, same order they appeared in state.yaml.

```yaml
  - "2026-10-01 (run 41): re-checked RG-7/8/9 (Gmail thread 1a0f26990ebc1e9c, get_thread)
    — still exactly the one original message, no owner reply. RG-7's default_due_at
    (2026-10-03) hasn't passed; RG-8/RG-9 have no default and stay open regardless.
    Held off Phase 4 feature work again this run, consistent with runs 33-40. Audited
    content/ for the next decision-free content gap: content/repos/vim.md and
    content/repos/neovim.md have both listed 'helix' under alternatives.open_source
    since runs 33/40, but content/repos/helix.md never existed, so it rendered as
    'Not yet profiled' on both pages — the same class of dangling-reference gap runs
    33/34/37/38/39/40 closed. Major task: added content/repos/helix.md (helix-editor/
    helix, MPL-2.0, Developer Tools grove), cross-referencing both Vim and Neovim.
    Facts (Rust implementation, Kakoune-inspired selection-first modal editing with
    multiple selections as a core primitive, built-in Tree-sitter/LSP with no plugins
    required, MPL-2.0 license, no official stable plugin system — the experimental
    Steel/Scheme scripting layer requires building from a fork) verified via
    WebFetch/WebSearch against helix-editor.com, Gentoo's package database, and an
    independent walkthrough of Steel's current status, not scraped from a one-line
    description. Independent review (subagent, skeptical-senior-engineer pass) found
    no BLOCKER/MAJOR issues; content/frontmatter/tests all verified against house
    style and the content schema's validators (assertGrovesExist, assertValidAlternatives,
    assertNoGithubCollisions). Small related task: added Helix to
    content/groves/developer-tools.md's Core projects. 319/319 tests pass (7
    new/updated), lint clean, tsc --noEmit clean, npm audit --audit-level=high 0
    vulnerabilities, all run locally; npm run build reproduced the known ADR-006
    sandbox font-fetch gap (confirmed it compiles past content loading first), left to
    CI's GitHub-hosted runner, which came back green (3/3 checks, including the
    non-gating screenshot job). PR #90 merged (squash). Updated PROJECT_STATE.md (next
    action, milestones), CHANGELOG.md, DECISIONS.md, .factory/decisions.yaml (RG-7/8/9
    re-check notes). Remaining one-off content gaps for future runs: tig, gitui
    (lazygit.md's dangling refs), zed (vim.md/neovim.md/helix.md's shared dangling ref)."
  - "2026-10-01 (run 40): re-checked RG-7/8/9 (Gmail thread 1a0f26990ebc1e9c, get_thread)
    — still exactly the one original message, no owner reply. RG-7's default_due_at
    (2026-10-03) hasn't passed; RG-8/RG-9 have no default and stay open regardless.
    Held off Phase 4 feature work again this run, consistent with runs 33-39. Audited
    content/ for the next decision-free content gap: content/repos/neovim.md has
    listed 'vim' under alternatives.open_source since bootstrap (run 33), but
    content/repos/vim.md never existed, so it rendered as 'Not yet profiled' on
    Neovim's page — the same class of dangling-reference gap runs 33/34/37/38/39
    closed. Major task: added content/repos/vim.md (vim/vim, Vim License, Developer
    Tools grove), cross-referencing Neovim. Facts (Vim License name/GPL-compatibility,
    no native LSP client — third-party plugins like yegappan/lsp fill the gap, unlike
    Neovim's built-in client — and the February 2026 Vim 9.2 release) verified via
    WebFetch/WebSearch against Wikipedia, a license explainer, and independent
    release-coverage sources, not scraped from a one-line description. Independent
    review (subagent, skeptical-senior-engineer pass) specifically fact-checked the
    dated 9.2-release claim as the highest fabrication-risk detail and confirmed it
    independently (LWN.net, Help Net Security, Linuxiac); no other issues found.
    Small related task: added Vim to content/groves/developer-tools.md's Core
    projects. 318/318 tests pass (6 new/updated), lint clean, tsc --noEmit clean, npm
    audit --audit-level=high 0 vulnerabilities, all run locally; npm run build
    reproduced the known ADR-006 sandbox font-fetch gap (confirmed it compiles past
    content loading first), left to CI's GitHub-hosted runner, which came back green
    (6/6 checks, including the non-gating screenshot job). PR #89 merged (squash).
    Updated PROJECT_STATE.md (next action, milestones), CHANGELOG.md, DECISIONS.md,
    .factory/decisions.yaml (RG-7/8/9 re-check notes). Remaining one-off content gaps
    for future runs: tig, gitui (lazygit.md's dangling refs), helix, zed (vim.md's own
    new dangling refs)."
  - "2026-10-01 (run 39): re-checked RG-7/8/9 (Gmail thread 1a0f26990ebc1e9c, get_thread)
    — still exactly the one original message, no owner reply. RG-7's default_due_at
    (2026-10-03) hasn't passed; RG-8/RG-9 have no default and stay open regardless.
    Held off Phase 4 feature work again this run, consistent with runs 33-38. Audited
    content/ for the next decision-free content gap: content/repos/langchain.md has
    listed 'llamaindex' under alternatives.open_source since bootstrap, but
    content/repos/llamaindex.md never existed, so it rendered as 'Not yet profiled' on
    LangChain's page — the same class of dangling-reference gap runs 33/34/37/38
    closed. Major task: added content/repos/llamaindex.md (run-llama/llama_index, MIT,
    AI grove), cross-referencing LangChain. Facts (MIT license, Python-first flagship
    package, RAG/data-framework positioning, separate paid LlamaParse/LlamaCloud
    hosted offerings) verified via WebFetch/WebSearch against the project's own GitHub
    repo page and independent comparison sources (IBM, dev.co), not scraped from a
    one-line description. Independent review (subagent, skeptical-senior-engineer
    pass) flagged the first draft's '300+ integration packages' figure as an
    unnecessarily specific metric despite two corroborating sources, and a stale
    langchain.md 'Alternatives' prose line left over from before Phase 3 built
    /alternative/:slug pages — both fixed before merge. 316/316 tests pass (8
    new/updated), lint clean, tsc --noEmit clean, npm audit --audit-level=high 0
    vulnerabilities, all run locally; npm run build reproduced the known ADR-006
    sandbox font-fetch gap (confirmed it compiles past content loading first), left to
    CI's GitHub-hosted runner, which came back green (6/6 checks, including the
    non-gating screenshot job). PR #88 merged (squash). Updated PROJECT_STATE.md (next
    action, milestones), CHANGELOG.md, DECISIONS.md, .factory/decisions.yaml
    (RG-7/8/9 re-check notes). Remaining one-off content gaps for future runs: tig,
    gitui, vim, helix, zed (all still dangling alternatives.open_source references
    with no profile)."
  - "2026-10-01 (run 38): re-checked RG-7/8/9 (Gmail thread 1a0f26990ebc1e9c, get_thread)
    — still exactly the one original message, no owner reply. RG-7's default_due_at
    (2026-10-03) hasn't passed; RG-8/RG-9 have no default and stay open regardless.
    Held off Phase 4 feature work again this run, consistent with runs 33-37. Audited
    content/ for the next decision-free content gap: content/repos/coolify.md has
    listed 'dokploy' under alternatives.open_source since it was added (run 33), but
    content/repos/dokploy.md never existed, so it rendered as 'Not yet profiled' on
    Coolify's page — the same class of dangling-reference gap runs 33/34/37 closed.
    Major task: added content/repos/dokploy.md (Dokploy/dokploy, Apache-2.0,
    Self-Hosted grove), cross-referencing Coolify. Facts verified against primary
    sources (dokploy.com, docs.dokploy.com) via WebFetch/WebSearch rather than the
    GitHub API proxy (which is scoped to wernerh/repogrove only and can't reach other
    repos). Independent review (subagent, skeptical-senior-engineer pass) flagged the
    first draft's Cons section as carrying the same fabrication risk run 37's review
    caught in LocalAI's content: a specific 'Dokploy Source Available License' name +
    January 2026 date sourced only from one secondary blog, plus unverified
    multi-server/Swarm claims. Re-verified against docs.dokploy.com's own
    enterprise/license-keys page (confirms SSO/SAML, audit logs, white-labeling, SCIM,
    and custom roles require a paid license key; core stays Apache-2.0) and a
    third-party maturity review of its clustering (matured through v0.29, but doesn't
    provision machines/autoscale/self-heal — suits a small hand-managed fleet), then
    rewrote the Cons section to state only what those primary/corroborated sources
    support, dropping the unverifiable proper noun and date. Small related task:
    added Dokploy to content/groves/self-hosted.md's Core projects. Updated tests for
    the new 11th repo: generateStaticParams slug lists (tests/app/repo-page.test.tsx,
    tests/lib/content.test.ts), Self-Hosted grove's repo count (4->5, home.test.tsx)
    and total homepage card-link count (13->14); added a /repo/dokploy render test and
    a test confirming Coolify's own alternatives.open_source (dokploy) now resolves
    instead of 'Not yet profiled'. 314/314 tests pass (4 new/updated), lint clean, tsc
    --noEmit clean, npm audit --audit-level=high 0 vulnerabilities, all run locally;
    next build reproduces the known ADR-006 sandbox font-fetch gap (confirmed it
    compiles past content loading first), left to CI's GitHub-hosted runner — all 6
    checks (5 success + 1 skipped push-only job) green on PR #87 before squash-merging
    it myself; post-merge CI on main also confirmed green. CHANGELOG.md/DECISIONS.md/
    .factory/decisions.yaml/PROJECT_STATE.md updated. Next: re-check RG-7/8/9 each
    run; once RG-7 resolves, hold or pick up decision-free Phase 4 items — remaining
    one-off content gaps (LlamaIndex, tig, gitui, vim, helix, zed) stay available as
    decision-free work meanwhile."
  - "2026-10-01 (run 37): re-checked RG-7/8/9 (Gmail thread 1a0f26990ebc1e9c, get_thread)
    — still exactly the one original message, no owner reply. RG-7's default_due_at
    (2026-10-03) hasn't passed; RG-8/RG-9 have no default and stay open regardless.
    Held off Phase 4 feature work again this run, consistent with runs 33-36. Audited
    content/ for the next decision-free content gap and found LocalAI: both ollama.md
    and vllm.md have listed 'localai' under alternatives.open_source since bootstrap —
    the only slug referenced by two existing repos at once, the highest-value gap left
    — but content/repos/localai.md never existed, so it rendered as 'Not yet profiled'
    on both pages. Major task: added content/repos/localai.md (mudler/LocalAI, MIT, AI
    grove), cross-referencing ollama/vllm; added it to content/groves/ai.md's Core
    projects. Small related task: updated ollama.md/vllm.md's hand-authored
    '## Alternatives' prose (never rendered — splitOutSection strips it before the page
    renders the real AlternativesTable instead — but visibly stale 'placeholder...
    until Phase 3' wording now that LocalAI has a real page). Independent review
    (subagent, skeptical-senior-engineer pass) flagged two of localai.md's factual
    claims (built-in Agents feature, Distributed Mode's PostgreSQL+NATS requirement) as
    likely fabricated from its own training-data memory — re-verified both directly
    against live localai.io documentation pages (/docs/features/agents/,
    /docs/features/distributed-mode/) and confirmed accurate before keeping them,
    rather than either blindly trusting the review or blindly reverting correct
    content. Updated tests for the new 10th repo: generateStaticParams slug lists
    (tests/app/repo-page.test.tsx, tests/lib/content.test.ts), AI grove's repo list;
    rewrote the Alternatives-table test since ollama's open_source entries (localai,
    vllm) now both resolve instead of one being unresolved — added a new test using
    langchain/llamaindex as the real-content unresolved case instead (llamaindex still
    has no profile), plus a render test for /repo/localai itself; tests/app/home.test.tsx's
    AI grove repo count (3->4) and total homepage card-link count (12->13). 312/312
    tests pass (8 new/updated), lint clean, tsc --noEmit clean, npm audit
    --audit-level=high 0 vulnerabilities, all run locally; next build reproduces the
    known ADR-006 sandbox font-fetch gap (confirmed it compiles past content loading
    first), left to CI's GitHub-hosted runner — all 3 checks (CI, Factory guardrails,
    Design screenshots & accessibility) green on PR #86 before squash-merging it
    myself; post-merge CI on main also confirmed green. CHANGELOG.md/DECISIONS.md/
    .factory/decisions.yaml/PROJECT_STATE.md updated. Next: re-check RG-7/8/9 each run;
    once RG-7 resolves, hold or pick up decision-free Phase 4 items — content coverage
    is now thin (every alternatives.open_source slug across all 10 repos either
    resolves or is a real one-off like LlamaIndex/dokploy/tig/gitui/vim/helix/zed that
    would need its own repo added; next run should look there or re-scan for other
    classes of content/validator gaps if RG-7 is still open)."
  - "2026-09-30 (run 36): re-checked RG-7/8/9 (Gmail thread 1a0f26990ebc1e9c, get_thread)
    — still exactly the one original message, no owner reply. RG-7's default_due_at
    (2026-10-03) hasn't passed; RG-8/RG-9 have no default and stay open regardless.
    Held off Phase 4 feature work again this run, consistent with runs 33-35. Audited
    content/ for another latent bug (same instinct as those runs) and found none this
    time — groves/related_groves/alternatives casing/comparisons all internally
    consistent. Found a real content-coverage gap instead: content/repos/supabase.md,
    appwrite.md, and pocketbase.md have listed each other under
    alternatives.open_source since they were added (runs 33-34), but had zero
    /compare/:a/:b pages among them — only ollama-vs-vllm existed, despite this Grove
    having the most mutually-cross-referenced repos. Major task: added
    content/comparisons/appwrite-vs-supabase.md, pocketbase-vs-supabase.md,
    appwrite-vs-pocketbase.md, each with original 'How they differ' prose (Appwrite's
    MariaDB-backed document-style API + broader messaging/functions vs. Supabase's
    real Postgres; PocketBase's single-binary+SQLite minimal-ops story vs. Supabase's
    Postgres concurrency/managed option; Appwrite's multi-service breadth vs.
    PocketBase's single-binary simplicity) — matching house style, not a raw
    GitHub-description scrape, per rule 4. Updated 3 tests whose hardcoded
    'only one comparison'/'supabase has none' assumptions no longer held
    (tests/lib/content.test.ts, tests/app/repo-page.test.tsx, tests/app/compare-page.test.tsx
    — supabase -> coolify as the 'no comparisons' fixture in two of them). Independent
    review (subagent, skeptical-senior-engineer pass) found one real MAJOR pre-push:
    the first-draft render test asserted a specific real-data state (Appwrite's
    Stars/Momentum showing em-dash/'Not enough data yet') against the real, unmocked,
    committed data/repogrove.db — true only because Appwrite has no ingested snapshot
    history yet (added to content after the last ingestion run), and would have broken
    the moment the next scheduled ingestion run populated real rows for it — exactly
    the real-db-coupling failure mode TECH-DEBT.md's 2026-09-30 row already documents.
    Fixed pre-push: moved that assertion into a new isolated file,
    tests/app/compare-page-no-history.test.tsx, mocking @/lib/snapshots (same pattern
    as rising-page-empty.test.tsx); the real-db render test now only asserts
    structural/content facts that hold regardless of ingestion state. 310/310 tests
    pass (7 new/updated), lint clean, tsc --noEmit clean, npm audit --audit-level=high
    0 vulnerabilities, all run locally; next build reproduces the known ADR-006
    sandbox font-fetch gap (confirmed it compiles past this change first), left to
    CI's GitHub-hosted runner — all 3 checks (CI, Factory guardrails, Design
    screenshots & accessibility) green on PR #85 before squash-merging it myself;
    post-merge CI on main also confirmed green. CHANGELOG.md/DECISIONS.md/
    .factory/decisions.yaml/PROJECT_STATE.md updated. Next: re-check RG-7/8/9 each
    run; once RG-7 resolves, hold or pick up decision-free Phase 4 items — more
    content coverage/accuracy fixes stay available as decision-free work meanwhile."
  - "2026-09-30 (run 35): re-checked RG-7/8/9 (Gmail thread 1a0f26990ebc1e9c, get_thread)
    — still exactly the one original message, no owner reply. RG-7's default_due_at
    (2026-10-03) hasn't passed; RG-8/RG-9 have no default and stay open regardless.
    Held off Phase 4 feature work again this run for the same reason as runs 33/34.
    Scanned content/ for a latent bug (same instinct as runs 33/34's dangling-reference
    scan) and found one: every content/repos/*.md file with a non-empty
    alternatives.commercial array had a raw lowercase-kebab-case slug there instead of a
    real product display name (e.g. 'firebase' instead of 'Firebase', 'aws-amplify'
    instead of 'AWS Amplify') — AlternativesTable.tsx renders commercial entries
    verbatim with no capitalization (confirmed by reading the component and by existing
    test fixtures elsewhere using properly-cased names), so the site has been quietly
    showing raw slugs as brand names on every affected repo page since bootstrap.
    Separately found content/repos/ollama.md's alternatives.open_source listed
    'lm-studio' — verified via web search that LM Studio is closed-source/proprietary
    freeware (built on open components like llama.cpp, but the app itself has no public
    source), not an open-source project, so it was miscategorized since bootstrap
    (traced to ARCHITECTURE.md's own illustrative frontmatter example, which had the
    same mistake — fixed too). Major task: fixed the casing of every commercial entry
    across appwrite.md/coolify.md/lazygit.md/pocketbase.md/supabase.md; moved lm-studio
    out of ollama.md's open_source into commercial as 'LM Studio' (ollama's open_source
    is now [localai, vllm]); added a new validator to assertValidAlternatives
    (src/lib/content.ts) that fails the build when a commercial entry is all-lowercase
    with no space, so this class of bug can't silently recur. Independent review
    (subagent, skeptical-senior-engineer pass) found no MAJOR issues; one MINOR
    (the new heuristic would false-positive on a genuine all-lowercase one-word brand
    name, e.g. a hypothetical 'back4app' — no current content triggers it) addressed by
    documenting the trade-off in the validator's own comment. 307/307 tests pass (4
    new/updated: a reject/accept pair for the validator in tests/lib/content.test.ts,
    plus tests/app/repo-page.test.tsx and the real-fixture Ollama parse test updated for
    the corrected data), lint clean, tsc --noEmit clean, npm audit --audit-level=high 0
    vulnerabilities, all run locally; next build reproduces the known ADR-006 sandbox
    font-fetch gap (confirmed it compiles past this change first), left to CI's
    GitHub-hosted runner — all 3 checks (CI, Factory guardrails, Design screenshots &
    accessibility) green on PR #84 before squash-merging it myself; post-merge CI on
    main also confirmed green. CHANGELOG.md/PROJECT_STATE.md/.factory/decisions.yaml
    updated. Next: re-check RG-7/8/9 each run; once RG-7 resolves, hold or pick up
    decision-free Phase 4 items (community submissions, agent roles) — more content
    coverage/accuracy fixes stay available as decision-free work meanwhile."
  - "2026-09-30 (run 34): re-checked RG-7/8/9 (Gmail thread 1a0f26990ebc1e9c, get_thread)
    — still exactly the one original message, no owner reply. RG-7's default_due_at
    (2026-10-03) hasn't passed; RG-8/RG-9 have no default and stay open regardless.
    Held off Phase 4 feature work again this run for the same reason as run 33 —
    starting it now would preempt RG-7's still-open sequencing question. Found, while
    scoping decision-free content work, that content/repos/supabase.md's frontmatter
    has listed alternatives.open_source: [appwrite, pocketbase] since bootstrap, but
    neither had its own content/repos/*.md file — both rendered as 'Not yet profiled'
    on Supabase's Alternatives table, the same kind of latent content gap run 33's
    developer-tools grove closed for related_groves (just not caught by a fail-loudly
    validator this time, since alternatives.open_source is deliberately allowed to
    reference not-yet-profiled slugs — see AlternativesTable's own doc comment).
    Major task: added content/repos/pocketbase.md and appwrite.md (both real,
    well-known repos — pocketbase/pocketbase MIT, appwrite/appwrite BSD-3-Clause),
    groves: [self-hosted], with original 'What it does'/'Why people use it'/Pros/Cons
    interpretation matching house style (not a raw GitHub-description scrape, per rule
    4), cross-referencing each other and Supabase under alternatives.open_source. Both
    pick up real GitHub ingestion automatically on the next ingestion.yml run. Small
    related task: extended content/groves/self-hosted.md's 'Core projects' list to
    include both. Independent review (subagent, skeptical-senior-engineer pass) found
    two MINOR issues, both fixed pre-push: (1) the working branch was named
    content/self-hosted-backends-pocketbase-appwrite, not a CLAUDE.md §6-allowed
    prefix — renamed to feat/self-hosted-backends-pocketbase-appwrite, matching the
    directly comparable prior PR (#81, feat/developer-tools-grove); (2) no test
    rendered /repo/pocketbase or /repo/appwrite through the actual page component,
    only through generateStaticParams/getReposInGrove — fixed by adding a
    /repo/pocketbase render test mirroring the existing /repo/neovim one, including
    asserting its alternatives.open_source cross-references now resolve to real links
    instead of 'Not yet profiled'. 305/305 tests pass (8 new/updated: slug-list
    updates in tests/{lib/content,app/home,app/repo-page}.test.tsx for the +2 repos,
    plus the new /repo/pocketbase render test), lint clean, tsc --noEmit clean, npm
    audit --audit-level=high 0 vulnerabilities, all run locally; next build reproduces
    the known ADR-006 sandbox font-fetch gap (confirmed it compiles past this change
    first), left to CI's GitHub-hosted runner — all 5 gating checks + 1 skipped
    push-only job green on PR #83 before squash-merging it myself; post-merge CI on
    main also confirmed green. TECH-DEBT.md needed no changes (no new debt
    introduced/resolved). CHANGELOG.md/DECISIONS.md/PROJECT_STATE.md updated. Next:
    re-check RG-7/8/9 each run; once RG-7 resolves, hold or pick up decision-free
    Phase 4 items (community submissions, agent roles, spec §19) per its answer — more
    content coverage (additional repos/Groves/alternatives/comparisons) stays
    available as decision-free work meanwhile."
  - "2026-09-30 (run 33): re-checked RG-7/8/9 (Gmail thread 1a0f26990ebc1e9c, get_thread)
    — still exactly the one original message, no owner reply. RG-7's default_due_at
    (2026-10-03) hasn't passed; RG-8/RG-9 have no default and stay open regardless.
    Held off Phase 4 feature work again this run — per CLAUDE.md rule 8, a quiet run is
    a success, but there was real safe work available: expanding curated content
    coverage, which is ordinary decision-free editorial work (rule 4), not Phase 4
    groundwork, so it doesn't preempt RG-7's still-open question. Found, while scoping
    this, that content/groves/ai.md and content/groves/self-hosted.md have both named
    'developer-tools' under their related_groves frontmatter since bootstrap, but no
    content/groves/developer-tools.md ever existed — a dangling reference nothing had
    caught, because related_groves is parsed but never rendered as a link anywhere.
    Major task: added content/groves/developer-tools.md, backed by two new real,
    well-known repos (content/repos/lazygit.md, neovim.md — both jesseduffield/lazygit
    and neovim/neovim), each with original 'What it does'/'Why people use it'/Pros/Cons
    interpretation matching the house style (not a raw GitHub-description scrape, per
    rule 4). Both pick up real GitHub ingestion automatically on the next ingestion.yml
    run (tracked repos are derived from every content/repos/*.md's github: field).
    Small related task: added assertGrovesExist(repos, groves) to src/lib/content.ts,
    wired into getAllRepos() right after the existing assertNoGithubCollisions — fails
    the build loudly if a repo's groves: field ever names a Grove with no corresponding
    content file, closing the exact gap that let 'developer-tools' dangle unnoticed.
    Same fail-loudly convention as assertComparisonReposExist/assertNoGithubCollisions/
    assertValidAlternatives. Independent review (subagent, skeptical-senior-engineer
    pass) found no BLOCKER/MAJOR issues; one real MINOR — no test rendered
    /repo/lazygit or /repo/neovim through the actual page component, only through
    generateStaticParams — fixed pre-push by adding a render test for /repo/neovim
    (heading, license, description, and the body's own 'Related Grove' link),
    mirroring the existing ollama test. A second MINOR (cosmetic wording inconsistency
    in 'Alternatives' prose that splitOutSection strips from every repo page before
    rendering, so never actually shown) was left as-is per the reviewer's own judgment.
    300/300 tests pass (4 new/updated: assertGrovesExist's own throw/non-throw cases,
    the new neovim render test, plus count/slug-list updates in
    tests/{lib/content,app/home,app/grove-page,app/repo-page}.test.tsx for the +2
    repos/+1 grove), lint clean, tsc --noEmit clean, npm audit --audit-level=high 0
    vulnerabilities, all run locally; next build reproduces the known ADR-006 sandbox
    font-fetch gap (confirmed it compiles past this change first), left to CI's
    GitHub-hosted runner — all 5 gating checks + 1 skipped push-only job green on PR
    #81 before squash-merging it myself; post-merge CI on main also confirmed green.
    TECH-DEBT.md/CHANGELOG.md/DECISIONS.md/PROJECT_STATE.md updated. Next: re-check
    RG-7/8/9 each run; once RG-7 resolves, hold or pick up decision-free Phase 4 items
    (community submissions, agent roles, spec §19) per its answer — more content
    coverage (additional repos/Groves/alternatives/comparisons) stays available as
    decision-free work meanwhile."
  - "2026-09-30 (run 32): re-checked RG-7/8/9 (Gmail thread 1a0f26990ebc1e9c, get_thread)
    — still exactly the one original message, no owner reply. RG-7's default_due_at
    (2026-10-03) hasn't passed; RG-8/RG-9 have no default (expensive-to-reverse) and
    stay open regardless. Priority order (CLAUDE.md/prompt): CI green on main, no
    open PRs, security open_findings all 0 except 2 pre-existing LOW (owner-blocked,
    unchanged), design open_findings all 0 (no BLOCKER/MAJOR ux) — nothing ahead of
    PROJECT_STATE.md's own next action in the priority list. That next action itself
    was ambiguous between two readings (wait quietly, or pick up decision-free Phase 4
    items) — given RG-7 explicitly asks the owner whether to hold Phase 4 feature work
    until deployed and is still open (not yet defaulted), starting Phase 4 feature work
    now would preempt the very question just asked, so deliberately did not start any
    Phase 4 item this run (community submissions / agent roles stay available once
    RG-7 resolves either way). Instead used the run for verification/maintenance
    (still 'safe work', not idle — CLAUDE.md rule 8's 'quiet run' bar is 'no safe work
    to do', not 'no owner-gated work to do'): manually triggered `ingestion.yml`
    (`workflow_dispatch`) to validate #72's basic-news-widget release-ingestion path
    end-to-end for the first time since PR #74/#75 merged — the committed
    `data/repogrove.db` had never actually gained a `repository_releases` table (no
    ingestion run had fired a release-fetch since the schema/code shipped). The run
    succeeded: populated 5 real releases for all 5 tracked repos, confirming the
    schema migration and release-fetch code both work for real, not just against
    mocks/fixtures. This immediately broke `tests/app/repo-page.test.tsx`'s
    empty-state test for that section, which had (by its own doc comment) only ever
    asserted against the real committed db on the premise it had no releases yet —
    true by accident, not by design. Major task: fixed the test coupling. Moved the
    empty-state assertion into a new isolated file,
    `tests/app/repo-page-releases-empty.test.tsx`, mocking `@/lib/releases` to `[]` —
    same isolation pattern its populated-state sibling
    `tests/app/repo-page-releases.test.tsx` already used; removed the real-db-coupled
    version; corrected a stale doc comment in the populated-state sibling that made
    the same now-false claim. Independent review (subagent) found one MAJOR: this
    left no test exercising the real, unmocked `getRecentReleases` path (real SQL/
    schema/date formatting) against actual ingested rows — fixed pre-push by adding a
    structural smoke test back to `repo-page.test.tsx`, scoped via `within()` to the
    'Latest' `<section>` alone, asserting only that it renders either the empty state
    or at least one release link (never specific content, so it survives future
    ingestion refreshes); manually verified the smoke test actually fails if the
    section breaks (mutated the heading text, confirmed failure, reverted). Small
    related task: corrected a stale 2026-09-27 TECH-DEBT.md row claiming Phase 3's
    search/newsletter both still needed a server API — stale now that #63 shipped a
    client-side-only search (ADR-008) and #65 shipped form-UI-only with no working
    submit path. 296/296 tests pass (1 new, 1 removed), lint clean, tsc --noEmit
    clean, npm audit --audit-level=high 0 vulnerabilities, all run locally; next
    build reproduces the known ADR-006 sandbox font-fetch gap (confirmed it compiles
    past this change first), left to CI's GitHub-hosted runner — all 4 checks green
    on PR #80 before squash-merging it myself; post-merge CI on main also confirmed
    green (2 duplicate-triggered runs, both success). TECH-DEBT.md/CHANGELOG.md/
    PROJECT_STATE.md updated. Next: re-check RG-7/8/9 each run; once RG-7 resolves
    (owner reply, or its 2026-10-03 default), hold or pick up decision-free Phase 4
    items (community submissions, agent roles, spec §19) per whichever answer stands."
  - "2026-09-30 (run 31): Phase 3's MVP gate stayed complete this run (no new Phase 3/4
    roadmap items to pick up per PROJECT_STATE.md's own prior next-action) — confirmed
    main CI green, no open issues besides the standing SEC-003 needs-human, no open PRs
    (all 5 dependabot PRs noted in run 30's close-out — #29, #46-49 — are gone; the
    owner merged/closed them directly outside the factory's flow). Checked Gmail for
    replies on any open decision thread — none open (RG-2/3/4/6 all
    ANSWERED/DEFAULTED/RESOLVED) — nothing to record. Major task: raised Phase 4's
    owner-gated items as decisions instead of guessing or filing issues that assume an
    answer, per run 30's own explicit next-action. RG-7 (cheap, defaults 2026-10-03):
    hold Phase 4 feature work until the site is actually deployed? The owner still
    hasn't provisioned the Azure Storage account RG-2 chose (ADR-002) — a hard human
    gate — so there's no live site or real traffic yet; recommended holding rather than
    building speculative infra. RG-8 (expensive, no default): an auth provider for
    accounts (needed by watchlists/alerts spec §22 and RepoGrove Pro spec §32), or
    defer both — recommended defer. RG-9 (expensive, no default): scope the public API
    (api.repogrove.com, spec §13/§32) now, or leave unscoped until real demand —
    recommended leave unscoped; also flagged that ADR-002's static hosting can't run an
    API at all without its own further hosting decision. Emailed whurter5@gmail.com
    (thread 1a0f26990ebc1e9c, one batched email per docs/DECISION-PROTOCOL.md), mirrored
    each as its own needs-human issue (#76, #77, #78). Two Phase 4 items (community
    submission workflow, formalizing the discovery/editorial agent roles spec §19) need
    no owner decision and are available to pick up once there's bandwidth — not started
    this run to keep scope to the decision-raising itself. Small related tasks (2, both
    TECH-DEBT.md rows): (1) src/lib/content.ts's parseRepo/parseGrove/parseAlternative/
    parseComparison never validated a content filename was kebab-case before it became
    a public sitemap URL (2026-09-29 row) — added assertSlugIsKebabCase, 7 new tests;
    (2) fetchRepoReleases's per_page=5 was applied by GitHub before parseReleases could
    filter drafts, so a draft among the 5 most-recent releases could push a real one out
    of the 'Latest' window (2026-09-30 row) — now over-fetches per_page=10 and slices to
    5 post-filter. Independent review (subagent) found the first draft of the release
    regression test didn't actually exercise the bug (mock ignored the requested
    per_page); fixed the mock to truncate like the real API, verified by hand it fails
    against the pre-fix code (0 releases instead of 5) and passes with the fix. Both
    TECH-DEBT.md rows marked resolved in the same PR. 295/295 tests pass (8 new/
    updated), lint clean, tsc --noEmit clean, npm audit --audit-level=high 0
    vulnerabilities, all run locally; next build reproduces the known ADR-006 sandbox
    font-fetch gap (confirmed it compiles past this change first) — left to CI. Opened
    PR #75 (factory, tech-debt labels), subscribed to its activity; all 6 checks green
    (including a real next build on CI's GitHub-hosted runner) before squash-merging it
    myself; post-merge CI on main also confirmed green.
    ROADMAP.md/PROJECT_STATE.md/CHANGELOG.md/DECISIONS.md/decisions.yaml updated. Next:
    check RG-7/8/9 threads for a reply; otherwise pick up a decision-free Phase 4 item
    (community submission workflow, formalizing the agent roles, spec §19) or continue
    general TECH-DEBT.md upkeep."
  - "2026-09-30 (run 30): shipped the basic news widget (#72), PR #74 — the last item on
    docs/WORKPLAN.md's Phase 3 gate (the 17-item MVP list, spec §30/PRODUCT.md), which is
    now fully complete. v1 scope exactly as #72 specified: a 'Latest' section on
    /repo/[slug] listing a repo's recent GitHub releases (name/tag, publish date, link
    to the real GitHub release), or an explicit 'No recent releases' empty state — never
    a fabricated one. Storage: new repository_releases table in the already-committed
    data/repogrove.db (docs/adr/ADR-005's 2026-09-30 addendum) — UNIQUE(github,
    tag_name), not UNIQUE(github, captured_on), since a release doesn't recur daily like
    a metrics snapshot and can be edited after publishing. Ingestion:
    scripts/ingestion/fetch-snapshots.ts's runIngestion gained a third,
    independently-failable per-repo API call (GET /repos/{owner}/{repo}/releases?
    per_page=5) — same failure-isolation pattern as the existing contributor-count
    fetch, so a releases-fetch failure never throws away that repo's star/fork/issue
    snapshot. New src/lib/releases.ts (read side, mirrors src/lib/snapshots.ts's
    process.getBuiltinModule pattern for node:sqlite under jsdom tests). Independent
    review before push found one MAJOR: an earlier parseReleases coerced every field
    with String(...), so a genuinely malformed release entry (missing tag_name/
    html_url/a resolvable date) became the literal text \"undefined\" rather than being
    skipped — that string could reach dateFormatter.format(new Date(...)) on the page
    and throw RangeError: Invalid time value on an Invalid Date, breaking that repo's
    whole page render/static build for one bad release. Fixed pre-push: parseReleases
    now requires a real tag_name, an https://github.com/... html_url, and a parseable
    date, skipping the entry otherwise (with regression tests) — this also fixed the
    same review's MINOR finding (the unvalidated html_url rendered as a link href with
    no host check). A third MINOR (per_page=5 applied before the draft filter, so a
    draft among a repo's 5 most-recently-created releases could push a real one out of
    the window) filed as a TECH-DEBT.md row rather than fixed, to keep the PR scoped.
    287/287 tests pass (34 new/updated: repository_releases round-trip/idempotency,
    parseReleases/fetchRepoReleases/runIngestion release coverage including the
    malformed-entry regressions above, the read-side module, and both the real-db
    empty-state render and an isolated populated-state render for the page), lint
    clean, tsc --noEmit clean, npm audit --audit-level=high 0 vulnerabilities, all run
    locally; next build reproduces the known ADR-006 sandbox font-fetch gap (confirmed
    it compiles past this change first), left to CI's GitHub-hosted runner — all 6
    checks green on PR #74 before squash-merging it myself; post-merge CI on main also
    confirmed green. Issue #72 auto-closed by the merge. ROADMAP.md/PROJECT_STATE.md/
    CHANGELOG.md/DECISIONS.md updated — Phase 3 marked complete; Phase 4+ deliberately
    left unfiled (several items — newsletter automation, public API, RepoGrove Pro —
    are their own owner-gated territory per CLAUDE.md rule 6; next run should raise
    those as owner decisions before filing issues, not default them). No open dev-lane
    owner decisions this run (RG-4 was DEFAULTED for real last run, design run 13 — its
    own note says no further re-checks are needed unless the owner replies). Next: scope
    what, if anything, Phase 4 needs before its first roadmap issue can be filed."
  - "2026-09-30 (run 29): took over a stale lock (design, set 01:14 UTC by a run that
    died right after acquiring it — no branch/PR, nothing to recover, >5h30m old,
    CLAUDE.md's 50-minute rule). Shipped the newsletter signup form UI (#65), PR #71 —
    Phase 3's last previously-filed item. New src/components/NewsletterSignupForm.tsx:
    real client-side email validation (empty/malformed both get an inline error),
    clearly labeled 'Coming soon', no working submit path (no fetch, no form
    action/method — enforced in code, not just tested) since storing a subscriber
    email needs an owner decision (vendor + PII storage, CLAUDE.md rule 6) that hasn't
    been made, and output: \"export\" (ADR-002) has no server runtime to store one in
    even if it had. Wired into the homepage as a new 'RepoGrove Weekly' section.
    Independent review before push: no BLOCKER/MAJOR findings; one MINOR fixed
    pre-push (editing the email after a successful fake submission left a stale
    confirmation message on screen — any edit now clears both error and submitted
    state). 253/253 tests pass (5 new + 1 updated), lint clean, tsc --noEmit clean,
    npm audit --audit-level=high 0 vulns, all run locally; next build reproduces the
    known ADR-006 sandbox font-fetch gap (confirmed it gets past compiling this change
    first), left to CI — all 6 checks green (5 success + 1 skipped push-only job) on
    PR #71 before squash-merging it myself; post-merge CI on main also confirmed
    green. Issue #65 auto-closed by the merge. While closing out, re-read
    docs/WORKPLAN.md's Phase 3 gate ('the 17-item MVP list in PRODUCT.md/spec §30 is
    complete') against PRODUCT.md's own list and found item 11 ('basic news', spec
    §11) was never turned into a ROADMAP.md row or GitHub issue across 28 prior runs —
    filed #72 (recommended v1 scope: GitHub Releases only, per-repo, no new
    vendor/licensing risk, extends the existing ingestion job) so Phase 3 isn't
    mistakenly read as gate-complete. RG-4 re-checked via get_thread (design lane's
    decision, still OPEN, no new reply since 2026-09-27T17:32:04Z, due today
    2026-09-30) — not this lane's call. ROADMAP.md/PROJECT_STATE.md/CHANGELOG.md/
    DECISIONS.md/TECH-DEBT.md updated. Next: #72 (basic news widget)."
  - "2026-09-30 (run 28): shipped /search (#63), PR #70 — Phase 3's search item, only #65 (newsletter form UI) now left in Phase 3. New docs/adr/ADR-008-search-v1.md, the short architecture note issue #63 itself asked for before landing implementation: search v1 is a static, build-time-generated index (src/lib/search.ts's buildSearchIndex(), server-only, reads getAllRepos/getAllGroves/getAllAlternatives — the same public /content every page already renders, no data/repogrove.db field) matched entirely client-side (src/lib/search-match.ts's searchEntries(), pure tiered case-insensitive substring ranking: exact title > starts-with > contains > category > description) — no server, no new vendor, no new runtime dependency, compatible with output: \"export\". New /search route: src/app/search/page.tsx (Server Component builds the index once at build time) passes it to src/components/SearchBox.tsx (Client Component, the input + live results, same stretched-link/focus pattern as RepoCard/RankedList). sitemap.ts/layout.tsx gained the new route. src/lib/content.ts gained an exported firstParagraph helper (moved out of RepoCard.tsx, its second real call site — pure refactor, no behavior change). Independent review before push found a real MAJOR: an alternative with no bestFit items (legitimately optional) got a fabricated description sentence, contradicting this codebase's 'omit, don't fabricate' convention — fixed pre-push by extracting alternativeDescription() as its own directly-tested pure function returning \"\" instead, and rewrote the one test that had been tautologically re-deriving the old fallback logic inline. Pushed, then CI caught a real Turbopack build failure this sandbox's own local build can't reach (blocked by the known ADR-006 font-fetch gap): SearchBox.tsx (Client Component) importing searchEntries from the same module that also held buildSearchIndex pulled content.ts's node:fs import into the client bundle graph, which Turbopack's static-export build can't chunk ('the chunking context (unknown) does not support external modules (request: node:fs)') — root-caused from the CI job log, fixed by splitting the pure matching half into src/lib/search-match.ts with zero dependency on content.ts (SearchBox now imports from there directly; search.ts keeps buildSearchIndex and re-exports the matching half for server-side/test convenience), tests split the same way, re-validated locally (lint/tsc/247 tests, and a local next build now gets past the point that failed on CI and fails only at the already-known font-fetch gap, confirming the fix), re-pushed. 247/247 tests pass (21 new/updated), lint clean, tsc --noEmit clean, npm audit --audit-level=high 0 vulns, all run locally; all 3 CI checks green on PR #70's final commit (ci.yml, factory-guardrails.yml, design-screenshots.yml) before squash-merging it myself; post-merge CI on main also confirmed green. Issue #63 auto-closed by the merge. RG-4 re-checked via get_thread (design lane's decision, still OPEN, no new reply since 2026-09-27T17:32:04Z, due today 2026-09-30) — not this lane's call. ROADMAP.md/PROJECT_STATE.md/CHANGELOG.md/DECISIONS.md updated. Next: #65 (newsletter form UI) is the only Phase 3 item left — its acceptance criteria explicitly scope the first PR to form UI only (no working submit path) per the issue's own owner-decision-blocked storage/vendor question."
  - "2026-09-29 (run 27): shipped sitemap.xml + robots.txt (#64, PR #69) — Phase 3's SEO baseline. New src/app/sitemap.ts/src/app/robots.ts (Next's static MetadataRoute convention, output: \"export\" compatible), enumerating every repo/Grove/alternative/comparison route from the same getAllRepos/getAllGroves/getAllAlternatives/getAllComparisons content-loader functions every page already calls. New src/lib/site.ts (SITE_URL constant, repogrove.com per PRODUCT.md's already-documented target domain — doesn't provision anything). /trending and /rising already had real per-page metadata since #19/#20 shipped — issue #64's problem statement was stale on that point; added a regression test rather than redoing done work. Independent review before push found a real MAJOR: the sitemap's doc comment argued omitting the reversed /compare/:b/:a URL avoided duplicate-content indexing, but that URL is still pre-rendered (generateStaticParams renders both orders) and internally linked from the other repo's own page — a sitemap omission alone doesn't stop it being indexed separately. Fixed with alternates.canonical on the compare page's generateMetadata (both URL orders point at the file's own canonical repoSlugs order) plus metadataBase on the root layout. One MINOR (content.ts has no slug-format/kebab-case validation, so a malformed filename would flow into a public sitemap URL) filed as a TECH-DEBT.md row rather than fixed, to keep the PR scoped. Pushed, then CI caught a real build error this sandbox's own local build can't reach (blocked earlier by the known ADR-006 font-fetch gap): Next 16's output: \"export\" needs metadata-route files to declare export const dynamic = \"force-static\" explicitly, without which next build fails page-data collection for /robots.txt outright — root-caused from the CI job log, fixed (added to both files), re-validated locally (lint/tsc/226 tests), re-pushed. 226/226 tests pass (18 new/updated), lint clean, tsc --noEmit clean, npm audit --audit-level=high 0 vulns, all run locally; all 6 CI checks green on PR #69 (including a real next build on the GitHub-hosted runner) before squash-merging it myself; post-merge CI on main also confirmed green. Issue #64 auto-closed by the merge. RG-4 re-checked via get_thread (design lane's decision, still OPEN, no new reply since 2026-09-27T17:32:04Z, due today 2026-09-30) — not this lane's call. ROADMAP.md/PROJECT_STATE.md updated. OG image generation and JSON-LD structured data stay out per issue #64's own non-goals. Next: #63 (search) needs a short ADR first (output: \"export\" has no server runtime for a DB-backed FTS query); #65 (newsletter) is owner-decision-blocked on storage/vendor past its form-UI-only first PR."
  - "2026-09-29 (run 26): shipped Phase 3's second item, /compare/:a/:b (#62), PR #67. New content type content/comparisons/<a>-vs-<b>.md (ARCHITECTURE.md schema'd this run — reserved since bootstrap, never specified): frontmatter repos: [<a>, <b>], exactly two content/repos/*.md slugs; body has one required '## How they differ' prose section (the one thing that can't be computed). New src/lib/content.ts support: parseComparison/getAllComparisons/getComparison/getComparisonsForRepo, plus assertComparisonReposExist/assertNoDuplicateComparisonPairs cross-file validators wired into getAllComparisons — same fail-loudly convention as parseRepo/parseAlternative, but unlike /alternative/:slug's tolerant resolved-or-plain-text rendering, both repos here must already exist (a comparison has nothing to render for one that doesn't) so a comparison naming an unknown repo slug fails the build. extractListItems exported (was parseAlternative-private) so the new page reuses it on a repo's own '## Pros'/'## Cons' body sections rather than re-authoring them. New src/app/compare/[a]/[b]/page.tsx: at-a-glance table (stars/license/status/momentum/category) reusing getRepo/getGrowthSummaries/computeHeat, plus reused Pros/Cons, plus the hand-written prose; getComparison resolves either URL order to the same content file, always rendered in the file's own canonical order. Small 'Compared with' cross-link section added to /repo/[slug]. First real comparison: content/comparisons/ollama-vs-vllm.md (both repos already existed and already listed each other as alternatives). numberFormatter (TECH-DEBT.md 2026-09-29 row, open at 2 duplicate call sites) extracted to new src/lib/format.ts rather than duplicated a third time; both existing call sites switched over, row marked resolved. Independent review before push found no MAJOR issues; fixed two MINOR items pre-push — the two-repo Grove Heat lookup called getSnapshotHistory once per repo (2 db opens), so src/lib/snapshots.ts gained a batched getSnapshotHistories (mirrors getGrowthSummaries' existing batching, refactored to share one query helper — both now call a private fetchHistoriesByGithub), switched the compare page to it; and this run's own close-out doc updates. One POLISH item addressed (short comment on the comparison content file's unrendered leading title, matching stripLeadingTitle's convention). 208/208 tests pass (30 new), lint clean, tsc --noEmit clean, npm audit --audit-level=high 0 vulns, all run locally; next build reproduced the known ADR-006 sandbox font-fetch gap, left to CI's GitHub-hosted runner — confirmed 6/6 checks green on PR #67 before squash-merging it myself; post-merge CI on main also confirmed green. Issue #62 auto-closed by the merge. RG-4 re-checked via get_thread (design lane's decision, still OPEN, no new reply since 2026-09-27T17:32:04Z, due tomorrow 2026-09-30) — not this lane's call. ROADMAP.md/PROJECT_STATE.md updated with the real PR number. Next: #64 (sitemap/SEO) is unblocked; #63 (search) needs a short ADR first (output: \"export\" has no server runtime for a DB-backed FTS query); #65 (newsletter) is owner-decision-blocked on storage/vendor past its form-UI-only first PR."
  - "2026-09-29 (run 25): filed the 5 Phase 3 GitHub issues (#61 alternatives pages, #62 comparison pages, #63 full-text search, #64 sitemap/OpenGraph/SEO, #65 newsletter signup), mirroring how #5-7/#16-21 mirrored Phase 1/2's ROADMAP rows — each with Problem/Proposed solution/Non-goals/Acceptance criteria/Testing/Security/Dependencies per the established issue shape. Then shipped Phase 3's first item: /alternative/:slug (#61), PR #66. content/alternatives/notion.md (a bootstrap-era fixture proving the content shape per ARCHITECTURE.md) already existed but nothing rendered it. New src/lib/content.ts support: parseAlternative/getAllAlternatives/getAlternative reading content/alternatives/*.md's frontmatter (product, category) and body sections (## Open source/Free/Commercial/Best fit, plain bullet lists per spec §4 — not YAML arrays like Repo.alternatives), same fail-loudly-on-malformed-content convention as parseRepo/parseGrove (missing product/category, every alternative-type section empty, or a duplicate item anywhere, all throw ContentValidationError). New src/app/alternative/[slug]/page.tsx: resolves each Open-source display name against content/repos/*.md by slugifying it (slugifyAlternativeName) and calling getRepo — link + stars when resolved, plain text + 'Not yet profiled' otherwise, the same resolved-or-plain-text convention AlternativesTable already established for Repo.alternatives.open_source (not reused directly — AlternativesTable's h2/table shape didn't fit a single-column bullet list well, so this page has its own small presentational rendering instead). content/alternatives/notion.md's bootstrap-era placeholder Free/Commercial sections filled in with real, uncontroversial facts (Notion free tier/Google Docs/Craft; Confluence/Coda/ClickUp) now that a real route renders them; a stale process note with no field to render into was trimmed out of the content file. Independent review before push found no MAJOR issues; fixed two MINOR items pre-push — the resolved-Open-source-item render path (real link + star count) had no test through the actual page component, only the pure resolveOpenSourceAlternatives helper was unit-tested, so added an isolated vi.mock-based test (tests/app/alternative-page-resolved.test.tsx, mirroring tests/app/trending-page-empty.test.tsx's isolation pattern) asserting both the resolved link+stars and a sibling unresolved item's 'Not yet profiled' render correctly; and assertNoDuplicateListItems wasn't applied to 'Best fit', breaking the fail-loudly convention applied to the other three sections — fixed and covered by a new test. Two POLISH items also addressed (moved the unrendered process note out of the content file; documented the '-'-only bullet-marker convention in extractListItems' doc comment). One POLISH item (numberFormatter duplicated between AlternativesTable.tsx and the new page) left as a TECH-DEBT.md row rather than fixed, to keep the PR scoped to the routing/content-loader work. 178/178 tests pass (17 new), lint clean, tsc --noEmit clean, npm audit --audit-level=high 0 vulns, all run locally; next build reproduced the known ADR-006 sandbox font-fetch gap, left to CI's GitHub-hosted runner — confirmed 6/6 checks green on PR #66 before squash-merging it myself (labels added post-creation: factory, content — create_pull_request doesn't take a labels param, used issue_write update instead); post-merge CI on main also confirmed green. Issue #61 auto-closed by the merge. RG-4 re-checked (design lane's decision, still OPEN, no new reply, due tomorrow 2026-09-30) — not this lane's call. ROADMAP.md/PROJECT_STATE.md updated — Phase 3's first item checked off. Next: #62 (comparison pages) or #64 (sitemap/SEO) are both unblocked; #63 (search) needs a short ADR first (output: \"export\" has no server runtime for a DB-backed FTS query); #65 (newsletter) is owner-decision-blocked on storage/vendor past its form-UI-only first PR."
  - "2026-09-29 (run 24): shipped Grove Heat v1 (#21), PR #59 — Phase 2's last item, now complete (ROADMAP.md's whole Phase 2 checklist is checked). Took over the factory lock from a stale security-lane hold (set 15:05:31Z, >90min old with no further commits, per CLAUDE.md's staleness rule). Checked data/repogrove.db directly via node:sqlite before starting: 5 repos, 3 calendar days each; contributors only non-null on the most recent snapshot per repo (added in a later migration than the other columns), so no real contributor-growth delta is computable yet. Of issue #21's proposed inputs, only star growth rate has enough real history — scoped v1 to that (docs/adr/ADR-004-grove-heat-v1.md has the full methodology, threshold derivation against the 5 real repos' growth rates, and a v2 revisit list). New src/lib/heat.ts: computeHeat(history) -> HeatResult | null, labels one of the four states docs/design/DESIGN-SYSTEM.md already specified (Rising/Active/Slowing/Dormant); returns null (no chip) rather than fabricating a label when there's not enough history, matching the codebase's 'omit, don't fabricate' convention. Open-issues/contributor-growth ship as supplementary non-gating signals. New src/components/MomentumChip.tsx mirrors StatusChip's pattern with the already-wired momentum-* tokens; wired into /repo/[slug] next to StatusChip, reusing the existing getSnapshotHistory call (no second DB open). Independent review before push caught a real MAJOR bug: the star-growth rate used getGrowthSummary's 30-day-windowed baseline while the supplementary signals defaulted to the absolute-earliest snapshot ever (invisible today at <=3 days of history, would silently diverge past 30 days) — fixed pre-push by extracting getGrowthBaseline(history) out of src/lib/snapshots.ts so every signal shares one baseline row, with a dedicated regression test. 160/160 tests pass (25 new/updated), lint clean, tsc --noEmit clean, npm audit --audit-level=high 0 vulns, all run locally; next build reproduced the known ADR-006 sandbox font-fetch gap, left to CI's GitHub-hosted runner — confirmed all 3 checks green on PR #59 (ci.yml, factory-guardrails.yml, non-gating design-screenshots.yml) before squash-merging it myself; post-merge CI on main also confirmed green, and real post-merge screenshots (repo-ollama, both StatusChip and MomentumChip reading Active/green today) reviewed directly — renders cleanly, no layout issues. Issue #21 auto-closed by the merge. ROADMAP.md/PROJECT_STATE.md updated — Phase 2 complete, current phase is now Phase 3. No dev-lane owner decisions are open (RG-4 is design lane's; checked it too via get_thread — still no new reply since 2026-09-27T17:32:04Z, due today 2026-09-30). Next: no Phase 3 issues filed yet — file them mirroring how Phase 1/2 issues mirrored ROADMAP.md, then start with /alternative/:slug (spec §4, distinct from the already-shipped /repo/[slug] AlternativesTable)."
  - "2026-09-29 (run 23): shipped /rising (#20), PR #56 — same Phase 2 data-maturity gate /trending already met. New src/lib/rising.ts: pure rankByRelativeGrowth(repos, summaries), sorts by percentGrowth = deltaStars / (currentStars - deltaStars) * 100 descending (relative to each repo's own size, not absolute stars — the spec's §6/§8 distinction from /trending). Excludes no-history/single-snapshot repos (same convention as /trending) plus a zero/negative-baseline repo (would divide to Infinity/NaN). New src/app/rising/page.tsx mirrors /trending's page/row pattern; header nav gained a Rising link. Independent review before push found no MAJOR issues; fixed 5 MINOR/POLISH items: formatPercent now signs off the *rounded* value so a genuinely tiny nonzero percentage displays \"±0.0%\" not a stray-looking \"+0.0%\"/\"-0.0%\" (a float-percentage rounding edge case /trending's integer deltas can't hit) — added a dedicated isolated test proving both the tiny-positive and tiny-negative case; reason-line copy changed to \"star growth\" (not bare \"stars\", which read as a fraction of one star); /trending's own doc comment (called /rising \"not yet built\") fixed; new TECH-DEBT.md row for the ~40-line row-rendering block now duplicated between the two pages (not extracted here — kept this PR scoped to ranking behavior); added a negative-baseline test case alongside the existing zero-baseline one. 120/120 tests pass (15 new), lint clean, tsc --noEmit clean, npm audit --audit-level=high 0 vulns, all run locally; next build reproduced the known ADR-006 sandbox font-fetch gap, left to CI's GitHub-hosted runner — confirmed 5/5 gating checks + the non-gating screenshot job green on PR #56 (axe-core 0 WCAG 2.1 A/AA violations) before squash-merging it myself; post-merge CI on main (ci.yml + design-screenshots.yml) also confirmed green. Issue #20 auto-closed by the merge. ROADMAP.md/PROJECT_STATE.md updated with the real PR number. Checked Gmail (newer_than:2d, from:whurter5@gmail.com) for any new owner reply — nothing new on any RepoGrove decision thread (RG-4 still unanswered, design lane's call, due 2026-09-30). Next: both Phase 2 pages are now done — only Phase 2 item left is ADR-004 (Momentum/Heat, #21); its inputs list includes signals not yet ingested (commit recency, release frequency) — scope a v1 to already-ingested signals first (see PROJECT_STATE.md's Next action)."
  - "2026-09-29 (run 22): Phase 2 data-maturity gate met for the first time (5 repos, 3+ calendar days of snapshot history in data/repogrove.db, confirmed via node:sqlite before starting). Shipped /trending (#19), PR #55: repos ranked by absolute star growth (deltaStars descending), reason line computed from real growth data (\"+N stars in the last M days\"), excludes repos with no/single-snapshot history, keeps negative growth sorted last rather than hiding it. Added getGrowthSummaries(githubSlugs, dbPath?) to src/lib/snapshots.ts — opens data/repogrove.db once via a parameterized WHERE github IN (...) query instead of once per repo — and used it to fix the 2026-09-29 homepage N+1 tech-debt row too (src/app/page.tsx), verified behavior-equivalent to the old latestStars() helper by a dedicated test. New src/lib/trending.ts (rankByAbsoluteGrowth, pure/unit-tested independent of the db). Header nav gained a Trending link. Independent review before push found no MAJOR issues; fixed all 4 MINOR/POLISH items raised (TECH-DEBT.md row, a test assertion that didn't mirror formatDelta's exact branching, a missing empty-state test — added via an isolated vi.mock'd test file — and a stale doc comment). 105/105 tests pass (15 new/updated), lint clean, tsc --noEmit clean, npm audit --audit-level=high 0 vulns, all run locally; next build reproduced the known ADR-006 sandbox font-fetch gap, left to CI's GitHub-hosted runner — confirmed 6/6 checks green on PR #55 (including axe-core, 0 WCAG 2.1 A/AA violations) before squash-merging it myself. Issue #19 auto-closed by the merge. ROADMAP.md/PROJECT_STATE.md updated with the real PR number. Next: /rising (#20) shares the identical data-maturity gate, now also met — start it next run."

```

2026-10-01 (run 42): re-checked RG-7/8/9 (Gmail thread 1a0f26990ebc1e9c, get_thread) — still exactly the one original message, no owner reply. RG-7's default_due_at (2026-10-03) hasn't passed; RG-8/RG-9 have no default and stay open regardless. Held off Phase 4 feature work again this run, consistent with runs 33-41. Audited content/ for the next decision-free content gap: content/repos/vim.md, content/repos/neovim.md, and content/repos/helix.md had all listed 'zed' under alternatives.open_source since runs 33/40/41, but content/repos/zed.md never existed, so it rendered as 'Not yet profiled' on all three pages — the last of the same class of dangling-reference gap runs 33/34/37/38/39/40/41 closed; only tig/gitui (lazygit.md) remain open now. Major task: added content/repos/zed.md (zed-industries/zed, GPL-3.0/AGPL-3.0, Developer Tools grove), cross-referencing Vim, Neovim, and Helix. Facts (GPU-accelerated Rust editor built on its own GPUI rendering framework rather than Electron/webview; split licensing across three files — GPL-3.0 editor core, AGPL-3.0 server/collaboration code, Apache-2.0 for GPUI itself; founded by Nathan Sobo/Antonio Scandurra/Max Brunsfeld, formerly of Atom/Tree-sitter at GitHub before Atom was discontinued in 2022; built-in real-time multiplayer editing (Zed Channels), Tree-sitter, LSP, terminal, optional Vim keybindings, and an AI assistant with some paid-plan-gated features) verified via WebSearch/WebFetch against Zed's own blog, Wikipedia, and an independent features summary, not scraped from a one-line description. category deliberately omits 'terminal' (unlike vim/neovim/helix) since Zed is GUI-only, called out explicitly in its own Cons section. Independent review (subagent, skeptical-senior-engineer pass) found no BLOCKER/MAJOR issues; content/frontmatter/tests all verified against house style and the content schema's validators (assertGrovesExist, assertValidAlternatives, assertNoGithubCollisions), facts cross-checked against multiple independent sources. Small related task: added Zed to content/groves/developer-tools.md's Core projects. 322/322 tests pass (4 new/updated), lint clean, tsc --noEmit clean, npm audit --audit-level=high 0 vulnerabilities, all run locally; npm run build reproduced the known ADR-006 sandbox font-fetch gap (confirmed it compiles past content loading first), left to CI's GitHub-hosted runner — confirmed 6/6 checks green on PR #92 (including the non-gating screenshot job) before squash-merging it myself; post-merge CI on main also confirmed green. ROADMAP.md/PROJECT_STATE.md/CHANGELOG.md/DECISIONS.md/.factory/decisions.yaml updated. This repo's local main was stale at run start (a prior session's unpushed bootstrap-branch commits, f6f1ea9/4225716/683ede4, never reached origin) — hard-reset to origin/main before taking the lock; no data lost, origin was already the real source of truth. Next: re-check RG-7/8/9 each run; tig/gitui (lazygit.md) is the only remaining dangling alternatives.open_source gap of this kind.

2026-10-01 (run 43): re-checked RG-7/8/9 (Gmail thread 1a0f26990ebc1e9c, get_thread) — still exactly the one original message, no owner reply. RG-7's default_due_at (2026-10-03) hasn't passed; RG-8/RG-9 have no default and stay open regardless. Held off Phase 4 feature work again this run, consistent with runs 33-42. Audited content/ for the next decision-free content gap: content/repos/lazygit.md had listed 'tig' and 'gitui' under alternatives.open_source since bootstrap, but neither content/repos/tig.md nor content/repos/gitui.md ever existed, so both rendered as 'Not yet profiled' — the last of the same class of dangling-reference gap runs 33/34/37/38/39/40/41/42 closed; grepped every content/repos/*.md file's alternatives.open_source against the full slug list afterward and confirmed none remain anywhere. Major task: added content/repos/tig.md (jonas/tig, GPL-2.0) and content/repos/gitui.md (gitui-org/gitui, MIT), both Developer Tools grove, cross-referencing each other and LazyGit reciprocally. Facts (Tig: ncurses-based C repository browser predating both LazyGit and GitUI, maintained by Jonas Fonseca, doubles as a git log/diff pager, ~13k+ GitHub stars; GitUI: Rust terminal UI created by Stephan Dilly, staging-first workflow built on git2, notably fast/memory-light on very large repositories, moved from extrawurst/gitui to the gitui-org GitHub organization) verified via WebSearch/WebFetch against multiple independent sources (Tig's own site/manual, GitHub's own indexed discussion-thread titles confirming the gitui-org move, a third-party terminal-tools index, Stephan Dilly's own blog/Medium post), not scraped from a one-line description. Independent review (subagent, skeptical-senior-engineer pass) flagged a real MAJOR: the first draft's GitUI org-move claim carried an unverified specific date ('December 2024', sourced only from a single AI-generated wiki) — re-verified the org name itself against a second, independent source (a GitHub issue titled 'fixup links to new org' plus discussion-thread titles under the new org) and kept it, dropped the unverifiable date from the prose before committing. Small related task: added Tig and GitUI to content/groves/developer-tools.md's Core projects (grove now has 7 members). 324/324 tests pass (7 new/updated), lint clean, tsc --noEmit clean, npm audit --audit-level=high 0 vulnerabilities, all run locally; npm run build reproduced the known ADR-006 sandbox font-fetch gap, left to CI's GitHub-hosted runner — confirmed 3/3 checks green on PR #93 (ci.yml, factory-guardrails.yml, the non-gating design-screenshots.yml) before squash-merging it myself; post-merge CI on main also confirmed green. ROADMAP.md/PROJECT_STATE.md/CHANGELOG.md/DECISIONS.md/.factory/decisions.yaml updated. This was the last dangling-reference gap of this kind — none remain in content/repos/*.md — so the next decision-free content run needs a new source of work (a new comparison page, a fresh Grove, or a content-accuracy audit) rather than another dangling-ref closure.
