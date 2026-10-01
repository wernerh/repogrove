---
repos: [gitui, tig]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# GitUI vs Tig

## How they differ
GitUI and Tig sit at opposite ends of the "terminal git UI" spectrum's age and focus.
Tig is the older of the two — an ncurses-based C tool that doubles as a `git
log`/`git diff` pager as much as a standalone repository browser, and its interface
conventions (vi-style navigation, C-era menus) reflect that long history; day-to-day
staging is supported, but wasn't the tool's original center of gravity.

GitUI is a newer, Rust-based take on the same general idea with staging placed front
and center from the start, plus a specific focus on staying fast and memory-light on
repositories with very large histories — a case Tig's older architecture handles less
comfortably.

In short: reach for Tig if you mainly want a fast, dependency-light pager/browser for
`git log`/`git diff` output and don't mind vi-style conventions; reach for GitUI if
staging is your main day-to-day activity and you're working with particularly large
repositories.
