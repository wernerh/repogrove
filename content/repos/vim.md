---
github: vim/vim
name: Vim
category: [devtools, editor, terminal]
license: Vim License
status: active
featured: false
groves: [developer-tools]
alternatives:
  open_source: [neovim, helix, zed]
  commercial: []
---

# Vim

A modal, keyboard-driven text editor descended from vi, still actively developed more
than three decades after it started.

## What it does
Vim edits text through composable modal commands — switch into Normal mode to move
and manipulate text with short keystroke combinations (`dw`, `ci"`, `.` to repeat),
Insert mode to type, Visual mode to select — rather than relying on a mouse. It ships
as a single, highly portable binary, extends through Vimscript (and, since Vim9, the
faster Vim9script), and can run as a terminal program or a GUI (gVim).

## Why people use it
- Available by default or via a one-line install on nearly every Unix-like system,
  including remote servers accessed only over SSH
- Modal editing becomes very fast for experienced users once the command vocabulary
  is muscle memory
- Decades of plugins, colorschemes, and documentation (`:help` is itself a respected
  reference)
- A single lightweight binary with no runtime dependencies to manage

## Pros
- Extremely fast startup and responsiveness, even on constrained or remote machines
- Stable, backwards-compatible scripting surface built up over 30+ years
- Works identically across macOS, Linux, BSD, and Windows
- Active upstream development continued by its core maintainers; Vim 9.2 shipped in
  February 2026

## Cons
- Steep learning curve for anyone unfamiliar with modal editing
- No built-in Language Server Protocol client — LSP support comes from third-party
  plugins (for example `yegappan/lsp`), unlike Neovim's built-in client
- Vimscript (even Vim9script) is a narrower, less general-purpose language than Lua,
  so some modern plugin ecosystems target Neovim first

## Alternatives
Neovim is the actively-developed fork that rebuilt Vim's plugin model around Lua and
a built-in LSP client; Helix takes a different, more opinionated approach to modal
editing with LSP and tree-sitter built in from the start; Zed offers a GUI-first
editor built around similar speed and LSP-centric goals.

## Related Grove
[Developer Tools](/grove/developer-tools)
