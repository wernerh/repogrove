---
repos: [helix, neovim]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# Helix vs Neovim

## How they differ
Both are modal, keyboard-driven terminal editors with a built-in LSP client and
Tree-sitter syntax highlighting, but they reverse the order of a modal command and
take opposite stances on configurability out of the box.

Helix uses Kakoune-style "selection first" editing — a motion selects text, then an
action acts on that selection — and its LSP client, Tree-sitter highlighting, and
fuzzy file/workspace search all work immediately against a project's configured
language servers, with no plugin assembly required. Configuration is declarative
TOML (keymaps, settings, themes); there's no official, stable plugin system yet, so
extending Helix beyond its built-ins means a community Scheme-based fork (Steel), not
a mainline release.

Neovim keeps Vim's "action first" modal ordering (an action is chosen, then a motion
or text object supplies its target) and rebuilt the plugin architecture around a Lua
scripting API. Its LSP client and Treesitter integration are also built in, but
wiring them to actual language servers and pulling in the rest of its large plugin
ecosystem is typically done through Lua configuration and plugin managers, rather
than working unconfigured the way Helix's defaults do.

In short: reach for Helix for an opinionated, ready-to-use setup with almost nothing
to configure; reach for Neovim for Vim-compatible muscle memory and a much larger,
Lua-scriptable plugin ecosystem to build a setup from.
