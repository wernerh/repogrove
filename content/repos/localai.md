---
github: mudler/LocalAI
name: LocalAI
category: [ai, llm, inference]
license: MIT
status: active
featured: false
groves: [ai]
alternatives:
  open_source: [ollama, vllm]
  commercial: []
---

# LocalAI

Self-hosted inference engine that exposes an OpenAI-compatible API for local text,
audio, image, and video models.

## What it does
LocalAI runs open-weight models behind drop-in OpenAI-, Anthropic-, and
ElevenLabs-compatible API endpoints, pulling in whichever backend a given model needs
(llama.cpp, vLLM, whisper.cpp, diffusers, and dozens of others) rather than bundling one
fixed engine — so a single server can serve chat, transcription, and image generation
without separate client code for each.

## Why people use it
- Existing OpenAI/Anthropic SDK code points at it with no rewrite
- Covers more than text: speech-to-text, image and video generation, and vision all run
  through the same server
- Runs on CPU-only hardware as well as NVIDIA, AMD, Intel, and Apple Silicon GPUs
- Built-in agents, tool use, and RAG support, not just raw model serving

## Pros
- Broad model-type and hardware coverage in one project, rather than a separate tool per modality
- Genuine API compatibility, not just a similar shape — existing OpenAI-client code tends to work unmodified
- Active development with support for dozens of backends

## Cons
- That breadth brings more moving parts than a single-purpose server like Ollama or vLLM — backends are pulled on demand per model, which adds setup steps
- Optional distributed/clustering mode needs its own PostgreSQL and NATS infrastructure
- Smaller, less polished day-one experience than Ollama for someone who just wants to run one local chat model

## Alternatives
Ollama (simpler, chat-focused local serving), vLLM (GPU-focused production serving
throughput over LocalAI's broader hardware/modality coverage).

## Related Grove
[AI](/grove/ai)
