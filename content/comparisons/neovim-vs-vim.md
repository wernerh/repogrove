---
repos: [neovim, vim]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# Neovim vs Vim

## How they differ
Neovim is a backwards-compatible fork of Vim: both keep the same "action first"
modal editing model (an action, then a motion or text object), but Neovim rebuilt
the plugin architecture around it rather than extending Vim's original codebase
directly.

Vim extends through Vimscript (and the faster Vim9script since Vim9), has no
built-in Language Server Protocol client — LSP comes from third-party plugins such
as `yegappan/lsp` — and is released under the Vim License. Decades of continuous
development have built up an enormous library of plugins, colorschemes, and
documentation, and it can run as a GUI (gVim) as well as in a terminal.

Neovim, released under Apache-2.0, ships a built-in LSP client and native
Tree-sitter-based syntax highlighting, plus a Lua scripting API that extensions can
target directly instead of routing through Vimscript. Config-as-Lua is generally
considered easier to read, test, and share than legacy Vimscript, and a fully
configured Neovim setup (LSP servers, plugins, keymaps) still takes real assembly
time, same as Vim's own plugin-based LSP setup would.

In short: reach for Vim for maximum portability, a stable decades-old Vimscript
ecosystem, and availability by default on nearly every Unix-like system; reach for
Neovim for a built-in LSP client, native Tree-sitter highlighting, and Lua-based
configuration and extensibility.
