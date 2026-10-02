---
github: jonas/tig
name: Tig
category: [devtools, git, terminal]
license: GPL-2.0
status: active
featured: false
groves: [developer-tools]
alternatives:
  open_source: [lazygit, gitui]
  commercial: [GitKraken, Sourcetree]
---

# Tig

An ncurses-based text-mode interface for exploring a Git repository's history.

## What it does
Tig is a terminal repository browser built on top of plain `git` — it renders commit
graphs, diffs, and blame views as navigable ncurses screens, and can also work as a
pager for the output of ordinary `git log`/`git diff` commands. It predates both
LazyGit and GitUI and is maintained by Jonas Fonseca.

## Why people use it
- Fast, keyboard-driven way to browse history, diffs, and blame without leaving the
  terminal
- Doubles as a `git log`/`git show` pager, so it slots into an existing git-CLI habit
  rather than replacing it
- Chunk/line-level staging for building up a commit incrementally
- Minimal dependency (ncurses + git), so it runs comfortably anywhere a terminal does,
  including older or resource-constrained machines

## Pros
- One of the longest-running, most battle-tested terminal git browsers — a stable, predictable tool rather than a fast-moving one
- Very low resource footprint; starts instantly even on large repositories' history views
- Works as both a standalone browser and a drop-in pager for other git commands

## Cons
- Interface conventions (vi-style navigation, C-era menus) feel dated next to newer Rust-based terminal UIs
- Staging and commit-authoring workflows are less central than in LazyGit or GitUI, which were designed around day-to-day staging first

## Alternatives
LazyGit and GitUI cover similar "git TUI" ground with more modern staging-first
workflows; GitKraken and Sourcetree are full GUI clients for the same job.

## Related Grove
[Developer Tools](/grove/developer-tools)
