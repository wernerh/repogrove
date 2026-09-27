---
github: vllm-project/vllm
name: vLLM
category: [ai, llm, inference]
license: Apache-2.0
status: active
featured: false
groves: [ai]
alternatives:
  open_source: [ollama, localai]
  commercial: []
---

# vLLM

High-throughput, memory-efficient inference and serving engine for LLMs.

## What it does
vLLM serves large language models at scale, using PagedAttention and continuous batching
to get significantly higher throughput per GPU than a naive serving setup — built for
teams running models in production rather than a single local chat session.

## Why people use it
- Much higher request throughput than a naive serving loop on the same hardware
- OpenAI-compatible API server, so it drops into existing client code
- Supports a wide range of open-weight model families out of the box

## Pros
- Production-grade performance (continuous batching, quantization, tensor parallelism)
- Active project with a broad industry and academic contributor base
- Works across a wide range of GPU hardware

## Cons
- Built for serving at scale, not the simplest way to try a model on a laptop (see Ollama)
- Tuning it well (batch sizes, parallelism, memory) has a learning curve
- Primarily GPU-oriented; CPU inference is not its strong suit

## Alternatives
Ollama (simpler local serving), LocalAI (see `content/alternatives/` once those pages
exist — placeholder link until Phase 3 builds alternative pages).

## Related Grove
[AI](/grove/ai)
