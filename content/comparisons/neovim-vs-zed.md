---
repos: [neovim, zed]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# Neovim vs Zed

## How they differ
Both ship a built-in LSP client and a fast, modern rendering path, but Neovim stays
terminal-only while Zed is a GUI-first native application, and they put their
collaboration and extensibility in very different places.

Neovim runs in any terminal, including over a plain SSH session, with Vim's
"action first" modal editing model, native Tree-sitter highlighting, and a Lua
scripting API that a large, established plugin ecosystem builds on. Real-time
multiplayer editing and AI assistance aren't built into Neovim itself — either would
come from third-party plugins layered on top, if at all.

Zed is GUI-only, rendered through its own GPU-accelerated GPUI framework rather than
a terminal, so it can't be driven over a plain SSH session the way Neovim can. It
was built by a team that previously built Atom and Tree-sitter at GitHub, and it
bakes real-time collaborative editing (shared cursors, voice, screen sharing) and an
AI assistant panel directly into the editor, with optional Vim-style keybindings for
people switching from a modal terminal editor. Its plugin/extension ecosystem (Rust/
WASM extensions) is much younger than Neovim's Lua one.

In short: reach for Neovim for SSH-anywhere portability and a large, mature
Lua-scriptable plugin ecosystem built around Vim's editing model; reach for Zed for
a native GPU-rendered GUI with real-time collaboration and an AI assistant built
directly into the editor.
