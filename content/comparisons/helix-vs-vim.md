---
repos: [helix, vim]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# Helix vs Vim

## How they differ
Both are single-binary, keyboard-driven editors built around the terminal, with no
runtime dependencies to install, but they take very different approaches to modal
editing and to what ships working on day one.

Vim's "action first" modal commands (an action like `d` or `c`, then a motion or text
object) descend from vi and have stayed essentially stable for more than three
decades, built up around Vimscript (and the faster Vim9script) and a correspondingly
huge library of third-party plugins and colorschemes. It has no built-in Language
Server Protocol client — LSP support comes from third-party plugins such as
`yegappan/lsp` — and can also run as a GUI (gVim), not just in a terminal.

Helix reverses that ordering with Kakoune-style "selection first" editing (select,
then act) and ships its LSP client, Tree-sitter syntax highlighting, and fuzzy
finding built in and working against configured language servers with no plugins
required. Configuration is declarative TOML rather than a scripting language, but
there's no official, stable plugin system yet, so its ecosystem is far younger and
smaller than Vim's.

In short: reach for Vim for decades of battle-tested plugins, Vimscript
extensibility, and muscle memory that carries across nearly every Unix-like system;
reach for Helix for LSP and Tree-sitter that work immediately with almost no
configuration, at the cost of Vim-compatible keybindings and plugin ecosystem size.
