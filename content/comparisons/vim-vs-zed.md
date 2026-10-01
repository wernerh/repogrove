---
repos: [vim, zed]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# Vim vs Zed

## How they differ
These sit at opposite ends of the editor-delivery spectrum: Vim is a decades-old
modal editor built around the terminal, with no runtime dependencies, and Zed is a
GUI-only, native application built from scratch around GPU rendering and real-time
collaboration.

Vim edits through "action first" modal commands descended from vi, extends through
Vimscript (and the faster Vim9script), and runs as a single lightweight binary on
nearly every Unix-like system, including over a plain SSH session — it can also run
as a GUI (gVim), but the terminal workflow is what decades of plugins and
documentation are built around. It has no built-in Language Server Protocol client;
LSP comes from third-party plugins such as `yegappan/lsp`.

Zed is rendered through its own GPU-accelerated GPUI framework rather than a
terminal, so it isn't usable over a plain SSH session the way Vim is. Built by a
team that previously built Atom and Tree-sitter at GitHub, it ships LSP and
Tree-sitter support working out of the box, bakes real-time multiplayer editing and
an AI assistant panel into the editor itself, and offers optional Vim keybindings
for people switching over from a modal terminal editor. Its plugin/extension
ecosystem (Rust/WASM extensions) is much younger than Vim's.

In short: reach for Vim when a lightweight, SSH-anywhere, terminal-first editor with
decades of plugins and documentation matters most; reach for Zed when a native
GPU-rendered GUI, built-in real-time collaboration, or a built-in AI assistant
matter more than terminal portability.
