---
github: jesseduffield/lazygit
name: LazyGit
category: [devtools, git, terminal]
license: MIT
status: active
featured: false
groves: [developer-tools]
alternatives:
  open_source: [tig, gitui]
  commercial: [GitKraken, Sourcetree]
---

# LazyGit

A simple terminal UI for git commands, so you don't have to remember every flag.

## What it does
LazyGit wraps git in a keyboard-driven terminal interface: stage individual hunks,
browse and search history, resolve conflicts, and run interactive rebases, all without
leaving the terminal or typing out the underlying git subcommands.

## Why people use it
- Visual staging and diffing without a full GUI client
- Works anywhere a terminal does, including over SSH
- Keyboard-only workflow — no mouse required
- Thin wrapper over real git, so nothing it does is "magic" you can't reproduce on the
  command line

## Pros
- Noticeably faster for everyday git operations (staging, rebasing, branch switching) once the keybindings click
- Actively maintained with a large, terminal-centric user base
- No GUI dependency — fits naturally into a terminal-first setup

## Cons
- Keybinding-heavy; some upfront learning curve versus a point-and-click GUI
- Most comfortable on a reasonably wide terminal window

## Alternatives
Tig, GitUI (terminal-based, similar niche); GitKraken and Sourcetree cover the same
job with a full GUI instead.

## Related Grove
[Developer Tools](/grove/developer-tools)
