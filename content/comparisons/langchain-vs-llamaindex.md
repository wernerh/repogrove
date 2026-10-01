---
repos: [langchain, llamaindex]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# LangChain vs LlamaIndex

## How they differ
Both are MIT-licensed, actively maintained frameworks for building LLM-powered
applications, and each lists the other as its open-source alternative — the split is in
what each one is built around first.

LangChain is built around general-purpose orchestration: a common set of abstractions —
prompts, chains, memory, tool-calling, retrieval — for composing LLM calls into larger
applications across dozens of model providers, vector stores, and tools behind one API.
That breadth is also its main tradeoff: the abstraction layers can make it harder to see
(or control) exactly what prompt gets sent, and its API has changed significantly across
major versions, so older tutorials can mislead.

LlamaIndex is built around retrieval first: data connectors, indexing structures, and
query interfaces purpose-built for retrieval-augmented generation (RAG) — pulling in
documents, APIs, or databases, building an index over them, and querying that index so
an LLM's answers are grounded in your own data. It supports building agents on top of
that retrieval layer too, but document ingestion, parsing, and indexing are the core of
the project, and the flagship `llama_index` package is Python-first, so non-Python
stacks have a narrower integration path. Its own hosted offerings (LlamaParse,
LlamaCloud) are separate paid services on top of the open-source core.

In short: reach for LangChain when the application needs general-purpose
orchestration — chains, memory, and agents — across whichever providers and tools it
touches; reach for LlamaIndex when the job is fundamentally retrieval — getting your own
documents and data indexed and queryable by an LLM — and that's the primary thing being
built.
