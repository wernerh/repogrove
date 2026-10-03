---
github: open-webui/open-webui
name: Open WebUI
category: [ai, llm, chat-ui]
license: BSD-3-Clause (modified, branding clause)
status: active
featured: false
groves: [ai]
alternatives:
  open_source: []
  commercial: [ChatGPT]
---

# Open WebUI

A self-hosted, extensible web interface for chatting with local and remote LLMs.

## What it does
Open WebUI (originally released as Ollama WebUI, then renamed as it grew beyond a single
backend) sits in front of Ollama or any OpenAI-compatible API and turns raw model access
into a full chat application — accounts and role-based permissions, multi-model
conversations, document upload with retrieval-augmented generation, and web search
integration — all running on infrastructure you control rather than a vendor's.

## Why people use it
- Works with Ollama out of the box, plus any OpenAI-compatible endpoint, so it isn't
  locked to one model backend
- Built-in retrieval-augmented generation (chat over your own uploaded documents) with a
  choice of vector database backends, not a bolted-on plugin
- Multi-user accounts with role-based access control and group permissions, useful for a
  team or household sharing one server
- Large, fast-moving community and frequent releases, with the full source published on GitHub

## Pros
- One polished, actively maintained web client over local or self-hosted models, instead of building a front end from scratch
- RAG, web search, image generation, and multi-model chat ship built in rather than as separate add-ons, with no functionality gated behind a paid tier
- Full source code stays publicly visible and modifiable; the licensing restriction below is about branding, not features

## Cons
- As of v0.6.6 (April 2025), the project's own license is a modified BSD-3-Clause with an added branding clause: deployments can't remove or alter the "Open WebUI" name/logo without either staying under 50 end users in any 30-day window or buying an enterprise license — by the project's own description, this makes it source-available rather than an OSI-approved open-source license
- A chat interface, not an inference engine — it still needs Ollama, vLLM, or another compatible backend running separately to actually serve a model
- RAG and multi-model features add real memory/compute overhead on top of whatever is already serving the model itself
- The project's own deployment guidance is explicit that exposing it to the public internet needs an authenticated reverse proxy in front of it — it isn't hardened for that by default

## Alternatives
No open-source alternative in RepoGrove's catalog yet — nothing else here is a
general-purpose chat UI layered over a separate inference backend.
**Commercial:** ChatGPT (the hosted chat product Open WebUI is most often set up to
replace, running against your own models instead of OpenAI's).

## Related Grove
[AI](/grove/ai)
