---
github: BerriAI/litellm
name: LiteLLM
category: [ai, llm, gateway]
license: MIT
status: active
groves: [ai]
alternatives:
  open_source: []
  commercial: []
---

# LiteLLM

Python SDK and proxy server that calls over 100 LLM provider APIs through one
OpenAI-compatible interface.

## What it does
LiteLLM translates calls to OpenAI, Anthropic, Azure, Bedrock, VertexAI, Cohere, and
dozens of other providers into a single consistent request/response shape, so application
code can target one interface instead of learning (and maintaining) each provider's own
SDK and error format. The same project ships as an importable Python SDK and as a
standalone proxy server (an LLM gateway) that sits in front of multiple providers for
whole teams — handling routing, fallbacks between providers, rate limiting, spend
tracking, and API-key management centrally rather than in each calling application.

## Why people use it
- One OpenAI-compatible call shape across 100+ providers, instead of bespoke
  integration code per vendor
- The proxy server centralizes routing, automatic fallback between providers/models, and
  per-key spend tracking for a whole team, not just a single app
- Drop-in for existing OpenAI-client code in many cases, easing migration between
  providers or multi-provider setups
- Actively maintained with a large contributor base and frequent releases

## Pros
- Broad, continuously updated provider coverage maintained as a shared community resource rather than something each team has to track itself
- Covers both the in-process SDK case and the standalone-gateway case in one project
- Core SDK and proxy are MIT-licensed; a separate paid enterprise tier (SSO, custom SLAs, dedicated support) funds development without gating the open-source core

## Cons
- A broad multi-provider abstraction can leak provider-specific quirks through at the edges, especially for less common parameters or streaming behavior
- Running the proxy server as shared infrastructure adds an operational component (plus optional Postgres/Redis for its spend-tracking and caching features) beyond just calling an SDK directly
- Python-first project; the proxy server exposes a language-agnostic HTTP API, but the SDK itself is not meant for non-Python stacks

## Alternatives
No open-source or commercial alternative tracked in this catalog yet.

## Related Grove
[AI](/grove/ai)
