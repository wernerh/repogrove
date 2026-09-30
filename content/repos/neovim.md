---
github: neovim/neovim
name: Neovim
category: [devtools, editor, terminal]
license: Apache-2.0
status: active
featured: false
groves: [developer-tools]
alternatives:
  open_source: [vim, helix, zed]
  commercial: []
---

# Neovim

A hyperextensible, backwards-compatible fork of Vim.

## What it does
Neovim keeps Vim's modal editing model but rebuilds the plugin architecture around it:
a built-in LSP client, native Treesitter-based syntax highlighting, and a Lua scripting
API, so editor extensions no longer have to route through Vimscript.

## Why people use it
- Modal, keyboard-driven editing that stays fast once learned
- Built-in LSP and Treesitter mean less glue configuration than classic Vim needed
- Lua-based configuration is more approachable than Vimscript
- Runs in any terminal, including over SSH, with no GUI required

## Pros
- Very fast for text editing and navigation once the keybindings are second nature
- First-class LSP support out of the box
- Large plugin ecosystem and active upstream development
- Config-as-code (Lua) is easier to read, test, and share than legacy Vimscript

## Cons
- Steep learning curve for anyone new to modal editing
- Fewer built-in visual affordances than a GUI editor until plugins are added
- A fully configured setup (LSP servers, plugins, keymaps) takes real time to assemble

## Alternatives
Vim (the original, still actively maintained) and Helix (a newer modal editor with
different defaults) cover similar ground; Zed is a GUI-first alternative built around
some of the same ideas (LSP, speed) without the terminal-only constraint.

## Related Grove
[Developer Tools](/grove/developer-tools)
