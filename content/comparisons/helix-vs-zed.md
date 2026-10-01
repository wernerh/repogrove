---
repos: [helix, zed]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# Helix vs Zed

## How they differ
Both are built in Rust and ship LSP support and Tree-sitter syntax highlighting
working out of the box with no plugin assembly — but they differ in where they run
and what else is built around that editing core.

Helix is a single statically-linked Rust binary that runs entirely in a terminal,
including over a plain SSH session, with Kakoune-style "selection first" modal
editing and declarative TOML configuration. It has no real-time collaboration
features and no AI assistant built in, and no official, stable plugin system yet —
extensibility beyond its built-ins is deliberately limited so far.

Zed is GUI-only, rendered through its own GPU-accelerated GPUI framework rather than
a terminal or an Electron/web-view shell — it can't be run over a plain SSH session
the way Helix can. Built by a team that previously built Atom and Tree-sitter at
GitHub, it builds real-time multiplayer editing (shared cursors, voice, screen
sharing) and an AI assistant panel directly into the editor, and offers optional Vim-
and Helix-style keybindings for people switching from a modal terminal editor.
Licensing is split across three files (GPL-3.0 for the editor, AGPL-3.0 for the
collaboration server, Apache-2.0 for GPUI itself).

In short: reach for Helix when you need a fast, terminal-only, SSH-anywhere editor
with LSP and Tree-sitter ready immediately; reach for Zed when a native GPU-rendered
GUI, built-in real-time collaboration, or a built-in AI assistant matter more than
terminal portability.
