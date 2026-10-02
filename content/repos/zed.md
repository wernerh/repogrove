---
github: zed-industries/zed
name: Zed
category: [devtools, editor]
license: GPL-3.0 / AGPL-3.0
status: active
featured: false
groves: [developer-tools]
alternatives:
  open_source: [vim, neovim, helix]
  commercial: []
---

# Zed

A GPU-accelerated code editor built from scratch in Rust, with real-time
multiplayer editing built into the core rather than bolted on as a plugin.

## What it does
Zed is a native, GUI-first editor written entirely in Rust and rendered through
GPUI, its own GPU-accelerated UI framework, rather than an Electron/web-view shell.
It ships with Tree-sitter syntax highlighting, automatic Language Server Protocol
support, and a built-in terminal out of the box. Its defining feature is Zed
Channels: multiple people can edit the same project together in real time, with
voice calls and screen sharing, by sharing a link — collaboration is a first-class
part of the editor rather than a separate tool bolted on afterward. It also ships
a built-in AI assistant that can call out to models such as Claude, GPT, and
Gemini for code generation and refactoring. It was built by Zed Industries, a team
founded by Nathan Sobo, Antonio Scandurra, and Max Brunsfeld — three of the people
behind Atom and Tree-sitter at GitHub before Atom was discontinued in 2022.

## Why people use it
- GPU-rendered native UI keeps scrolling, search, and startup fast even on large
  files and projects
- Real-time collaborative editing (shared cursors, voice, screen sharing) is built
  into the editor itself, not a third-party extension
- LSP and Tree-sitter support work out of the box, without hand-assembling a
  plugin stack
- A built-in AI assistant panel for code generation and refactoring, with a choice
  of model providers
- Optional Vim (and Helix-style) keybindings for people switching over from a
  modal terminal editor

## Pros
- Genuinely fast, GPU-rendered interface rather than an Electron/web-view wrapper
- Collaborative editing is deeply integrated rather than an add-on
- Sensible defaults (LSP, Tree-sitter, terminal) work immediately after install
- Actively developed, with Rust/WASM extensions for adding new languages and frameworks

## Cons
- GUI-only — unlike Vim, Neovim, or Helix, it isn't usable over a plain SSH terminal session
- Licensing is split across three files (GPL-3.0 for the editor, AGPL-3.0 for the server/collaboration code, Apache-2.0 for the GPUI framework itself), worth reading closely before redistributing or self-hosting the collaboration backend
- Some AI features require a paid plan or your own API keys for the connected model providers
- Much younger plugin/extension ecosystem than VS Code's, despite rapid growth

## Alternatives
Vim, Neovim, and Helix cover the same "fast, keyboard-driven editor" niche but
stay terminal-only and don't build in real-time multiplayer collaboration the way
Zed does; Zed trades their SSH-anywhere portability for a native GPU-rendered GUI.

## Related Grove
[Developer Tools](/grove/developer-tools)
