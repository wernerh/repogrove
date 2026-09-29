---
repos: [ollama, vllm]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# Ollama vs vLLM

## How they differ
Both run open-weight LLMs on your own hardware, and each one lists the other as an
open-source alternative — but they're built for different jobs.

Ollama is built for running models locally, on one machine: install it, `ollama run`
a model, and you have a chat-ready API in a couple of minutes. It manages quantized
(GGUF) model files for you and is the easier on-ramp if you're experimenting on a
laptop or a single workstation, not standing up a service for other people to call.

vLLM is built for serving models to many concurrent requests at once. Its PagedAttention
memory management and continuous batching exist specifically to keep throughput high and
latency predictable under real production load — the kind of workload a single-user
Ollama instance isn't optimized for. That focus comes with more setup: vLLM expects a
real GPU-serving environment, not a one-command laptop install.

In short: reach for Ollama to run a model locally or prototype quickly; reach for vLLM
when you're serving inference to actual traffic and need throughput/latency guarantees.
