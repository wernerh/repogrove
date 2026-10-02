---
github: gitui-org/gitui
name: GitUI
category: [devtools, git, terminal]
license: MIT
status: active
featured: false
groves: [developer-tools]
alternatives:
  open_source: [lazygit, tig]
  commercial: [GitKraken, Sourcetree]
---

# GitUI

A terminal UI for git written in Rust, built for speed on very large repositories.

## What it does
GitUI gives git a keyboard-driven terminal interface — staging and unstaging files or
individual hunks, branch and stash management, commit history browsing and search,
and commit rewording — without leaving the terminal. It was created by Stephan Dilly
(originally hosted at `extrawurst/gitui`); the project has since moved to the
`gitui-org` GitHub organization, which is what this page links to.

## Why people use it
- Staging individual hunks is first-class, not an afterthought
- Built in Rust on `git2`, so it's notably fast and memory-light even on repositories
  with very long histories
- Keyboard-only, terminal-native workflow — no mouse, no GUI dependency
- GPG commit signing, fuzzy commit search, and customizable themes/keybindings

## Pros
- Handles very large repository histories smoothly, which is a known weak point for some other terminal git UIs
- Actively maintained with an org-backed GitHub project rather than a single maintainer's side project
- Clear tabbed layout (status, log, stashing) makes everyday staging and committing fast once the keybindings are learned

## Cons
- Younger and less feature-complete than Tig for pure history archaeology (blame across renames, complex log filters)
- Rust toolchain/binary distribution means it's a heavier install on some older or minimal systems than a plain ncurses tool

## Alternatives
LazyGit and Tig cover the same "git TUI" niche with different trade-offs (LazyGit:
broader feature set and larger community; Tig: older, lighter, doubles as a git
pager); GitKraken and Sourcetree are full GUI clients instead.

## Related Grove
[Developer Tools](/grove/developer-tools)
