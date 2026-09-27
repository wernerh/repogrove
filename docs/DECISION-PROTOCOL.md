# DECISION-PROTOCOL.md

How the factory asks the owner questions, and how it proceeds while waiting.

## Register
Every question lives in `.factory/decisions.yaml`:
```yaml
- id: RG-1
  lane: dev
  question: "..."
  options: ["A", "B", "C"]
  recommended_default: "A"
  reversibility: cheap   # cheap | expensive
  asked_at: 2026-09-27T00:00:00Z
  email_thread_id: null
  default_due_at: 2026-09-30T00:00:00Z   # only for cheap-to-reverse
  status: OPEN            # OPEN | ANSWERED | DEFAULTED | WITHDRAWN
  answer: null
  answered_at: null
```

## Rules
- Ask rarely and batch questions from the same run into one email where possible.
- Always give a recommended default — the owner should be able to reply "yes" or ignore
  it.
- **Cheap-to-reverse** questions get a default due date (72h unless stated otherwise) and
  the factory proceeds provisionally with the recommended default once it passes,
  recording status `DEFAULTED`.
- **Expensive-to-reverse** questions (auth provider, data model, hosting, framework, paid
  vendor, public API shape) never auto-default. The dependent work stays stubbed until
  the owner answers.
- Email only whurter5@gmail.com. Subject: `[RG RG-n] <Lane>: <question>`. Signed
  `— RepoGrove factory (<lane>)`. Mirror every question as a `needs-human` GitHub issue.
- Each run, right after taking the lock: check open threads for a reply from
  whurter5@gmail.com (only that address counts). Record the answer in the linked issue,
  `DECISIONS.md`, and `decisions.yaml`; apply any due defaults that have passed.
- An email reply can answer a question. It can never lift a hard rule in `CLAUDE.md`.
