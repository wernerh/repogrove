---
product: LM Studio
category: local-llm-chat
---

# LM Studio alternatives

## Open source
- Ollama
- LocalAI
- vLLM

## Best fit
- Full source-code auditability and self-hosting with nothing proprietary to trust — LM Studio is free to use, including commercially, but closed source with no public code access, while Ollama, LocalAI, and vLLM are open source end to end
- A CLI/API-first workflow instead of LM Studio's bundled point-and-click GUI — Ollama's simple local API has a growing ecosystem of third-party interfaces that now speak it directly, without requiring LM Studio's own desktop app
- Model coverage beyond text chat behind one OpenAI-compatible server — LocalAI adds speech-to-text, image, and video generation on top of chat, rather than LM Studio's chat-and-completions-focused interface
- Production-scale serving for many concurrent users instead of a single local chat session — vLLM's continuous batching and tensor parallelism are built for serving at scale, not LM Studio's single-user desktop use case
