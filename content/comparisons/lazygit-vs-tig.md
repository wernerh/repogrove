---
repos: [lazygit, tig]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# LazyGit vs Tig

## How they differ
LazyGit and Tig both wrap git in a full-screen terminal interface, but they were built
for different primary jobs. Tig predates LazyGit by years and was designed first as a
repository browser and `git log`/`git diff` pager — it slots into an existing git-CLI
habit rather than replacing it, and its vi-style, C-era interface conventions show
that age.

LazyGit, written in Go, was built with staging and day-to-day git operations
(interactive rebase, conflict resolution, hunk-level staging) as the primary workflow
from the start, rather than being designed first as a pager or browser.

In short: reach for Tig if you want a lightweight pager/browser that sits alongside
your existing git-CLI habits; reach for LazyGit if staging, rebasing, and resolving
conflicts through a dedicated terminal UI is your main daily workflow.
