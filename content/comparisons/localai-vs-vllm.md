---
repos: [localai, vllm]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# LocalAI vs vLLM

## How they differ
Both are server-side inference engines rather than single-user local tools, and each
lists the other as an open-source alternative — but they optimise for different things.

LocalAI optimises for breadth: it exposes an OpenAI-, Anthropic-, and
ElevenLabs-compatible API and pulls in whichever backend a given model needs
(llama.cpp, vLLM itself as one of its own backend options, whisper.cpp, diffusers, and
others), so a single server can handle chat, transcription, image, and video models
without separate client code for each. It also runs on CPU-only hardware as well as
NVIDIA, AMD, Intel, and Apple Silicon GPUs — useful when the deployment target isn't a
dedicated GPU box.

vLLM optimises for raw serving throughput on GPUs. Its PagedAttention memory
management and continuous batching exist specifically to keep latency predictable and
throughput high under real concurrent production load — the kind of workload a
general-purpose multi-backend server isn't tuned for by default. That focus comes with
a narrower scope: vLLM is primarily GPU-oriented, and CPU inference is not its strong
suit.

In short: reach for LocalAI when you need one server covering multiple model types and
hardware backends, including CPU-only deployments; reach for vLLM when you're serving
LLM inference at scale on GPUs and need production-grade throughput and latency
guarantees.
