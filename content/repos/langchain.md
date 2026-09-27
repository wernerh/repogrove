---
github: langchain-ai/langchain
name: LangChain
category: [ai, agents, orchestration]
license: MIT
status: active
featured: false
groves: [ai]
alternatives:
  open_source: [llamaindex]
  commercial: []
---

# LangChain

Framework for building applications powered by language models.

## What it does
LangChain provides a common set of abstractions — prompts, chains, memory, tool-calling,
retrieval — for composing LLM calls into larger applications, so you're not gluing
together bespoke plumbing for every new model provider or vector store.

## Why people use it
- Broad integration surface: dozens of LLM providers, vector stores, and tools behind one API
- Building blocks (chains, agents, retrieval) cover most common LLM-app patterns out of the box
- Large ecosystem and community, so examples exist for almost any use case

## Pros
- Fast to prototype an LLM-backed feature
- Actively maintained, frequent releases
- Works with nearly any model provider, not locked to one vendor

## Cons
- Abstraction layers can make it harder to see (or control) exactly what prompt gets sent
- API has changed significantly across major versions, so older tutorials can mislead
- For a single, well-understood use case, calling a provider's SDK directly is often simpler

## Alternatives
LlamaIndex (see `content/alternatives/` once those pages exist — placeholder link until
Phase 3 builds alternative pages).

## Related Grove
[AI](/grove/ai)
