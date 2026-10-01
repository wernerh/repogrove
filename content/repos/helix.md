---
github: helix-editor/helix
name: Helix
category: [devtools, editor, terminal]
license: MPL-2.0
status: active
featured: false
groves: [developer-tools]
alternatives:
  open_source: [vim, neovim, zed]
  commercial: []
---

# Helix

A modal terminal text editor built in Rust, with multi-cursor selections, syntax
awareness, and a language server client all built in rather than bolted on through
plugins.

## What it does
Helix edits text through Kakoune-style "selection first" modal commands — a motion
selects text, then an action acts on the selection, rather than Vim's "action first"
ordering. Multiple simultaneous selections are a core editing primitive, not an
add-on. It ships as a single Rust binary with Tree-sitter-based syntax highlighting,
indentation, and code navigation, plus a built-in Language Server Protocol client, so
autocompletion, go-to-definition, diagnostics, and fuzzy file/workspace search work
out of the box against a project's configured language servers.

## Why people use it
- Multiple selections and Kakoune-style selection-first editing are available
  immediately, without assembling a plugin stack
- LSP, Tree-sitter syntax highlighting, and fuzzy finding are built in, so a fresh
  install already behaves like a configured IDE for most languages
- A single statically-linked Rust binary with no runtime or scripting-language
  dependency to install
- Sensible, well-documented defaults mean less time spent on configuration before
  the editor is usable day to day

## Pros
- Fast, responsive editing even on large files, consistent with its Rust
  implementation
- Built-in LSP and Tree-sitter support without installing or configuring separate
  plugins
- Multi-cursor/multi-selection editing is a first-class primitive, not retrofitted
- Config is declarative TOML (keymaps, settings, themes) — no scripting language
  required to get a working setup

## Cons
- Vim/Neovim muscle memory doesn't transfer directly: Helix's selection-first model
  reverses the order of motions and actions
- No official, stable plugin system as of this writing — a community Scheme-based
  scripting layer (Steel) exists but requires building from a fork, not mainline
  releases
- Much younger and smaller plugin/theme ecosystem than Vim or Neovim, since
  extensibility has deliberately been kept out of the editor's core so far

## Alternatives
Vim and Neovim are the established modal editors Helix's selection-first model
intentionally departs from, each with a far larger plugin ecosystem built up over
decades; Zed offers a GUI-first editor built around similar LSP-centric, no-config
goals without the terminal-only constraint.

## Related Grove
[Developer Tools](/grove/developer-tools)
