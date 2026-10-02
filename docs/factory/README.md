# docs/factory

How the autonomous factory is wired. Before this layout, each lane's run protocol existed
only as a prompt pasted into a scheduled task, with a mirror in this directory that could
drift. Now the protocol is in the repo.

## Layout

| Path | What it is |
|---|---|
| `.claude/skills/factory-core/SKILL.md` | Shared run protocol: lock, owner decisions, anti-drift, task selection, validation, independent review, merge rules, close-out, report. |
| `.claude/skills/dev-factory/SKILL.md` | Dev lane parameters and priorities. |
| `.claude/skills/security-factory/SKILL.md` | Security lane parameters and priorities. |
| `.claude/skills/design-factory/SKILL.md` | Design lane parameters and priorities. |
| `.claude/agents/factory-reviewer-{dev,security,design}.md` | Independent reviewers. Read-only (`Read`, `Grep`, `Glob`; no shell, no edit), so they cannot fix or merge what they review, and they work in a fresh context from the author. |
| `*-run.md` (this directory) | **Legacy** mirrors of the old inline task prompts. Superseded once the task is switched. |
| `run-history.md` | Archived `next_actions` from `.factory/state.yaml`. |

`CLAUDE.md` still wins over all of these for hard rules. `.claude/**` is protected like
`scripts/factory/*` (`CLAUDE.md` rule 7): lanes never edit it; the owner changes it via a
`needs-human` PR.

## Cutting over a scheduled task

The skills live in the repo, so the task prompt must first get the repo onto disk. Replace
each task's prompt with the matching wrapper (keep the existing cron):

```text
Attach and clone wernerh/repogrove if it is not already attached (one shallow clone,
generous timeout). Then run the dev factory: follow
.claude/skills/dev-factory/SKILL.md, which loads .claude/skills/factory-core/SKILL.md.
If the skill does not load automatically, read those two files directly and follow them.
```

Use `security-factory` and `design-factory` for the other two tasks. Switch one lane first
and read its next report before switching the others. To roll back, restore the old prompt
from the matching `*-run.md` mirror plus the bootstrap template it references.

## Known limits

- Reviewer tool restrictions are enforced by the harness, but the *rule* that lanes must
  not edit `.claude/**` is a prompt rule plus `.github/CODEOWNERS`. CODEOWNERS only blocks
  a merge once branch protection requires code-owner review (SEC-005 records that branch
  protection on `main` is currently absent), so today this is advisory.
- The legacy mirrors were summaries of the live prompts, not the full text. The skills were
  written from those summaries, `CLAUDE.md`, `docs/DECISION-PROTOCOL.md`,
  `scripts/factory/check.py` and the run history. Compare the first report from a switched
  lane against a recent one before trusting the new protocol fully.
