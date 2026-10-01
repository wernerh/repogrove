---
github: ollama/ollama
name: Ollama
category: [ai, llm]
license: MIT
status: active
featured: true
groves: [ai]
alternatives:
  open_source: [localai, vllm]
  commercial: [LM Studio]
---

# Ollama

Run large language models locally.

## What it does
Ollama packages open-weight LLMs behind a simple local API and CLI, handling model
download, quantisation, and serving so you don't have to wire up inference infrastructure
yourself.

## Why people use it
- Simple, one-command local setup
- No cloud dependency or per-token cost
- Growing model and tooling ecosystem (many apps now speak its API)

## Pros
- Fast to get started
- Actively maintained, large community
- Works well on consumer hardware for smaller models

## Cons
- Hardware requirements scale fast with model size
- Less control over serving internals than raw llama.cpp

## Alternatives
**Open-source:** LocalAI, vLLM.
**Commercial:** LM Studio.

## Related Grove
[AI](/grove/ai)
