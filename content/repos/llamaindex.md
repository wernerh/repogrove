---
github: run-llama/llama_index
name: LlamaIndex
category: [ai, llm, rag]
license: MIT
status: active
featured: false
groves: [ai]
alternatives:
  open_source: [langchain]
  commercial: []
---

# LlamaIndex

Open-source data framework for connecting large language models to your own documents
and data sources through retrieval-augmented generation (RAG).

## What it does
LlamaIndex provides data connectors, indexing structures, and query interfaces purpose-built
for retrieval: pull in documents, APIs, or databases, build an index over them, and query
that index so an LLM's answers are grounded in your own data instead of only what the
model already knows. It also supports building agents on top of that retrieval layer, but
document ingestion, parsing, and indexing are the core of the project.

## Why people use it
- Purpose-built data connectors and indexing structures, rather than general-purpose
  chaining primitives, for getting documents into a retrievable form
- A large integration ecosystem covering most major LLM providers, embeddings, and
  vector stores
- Works well both for a quick five-line prototype and for more customized retrieval
  pipelines as needs grow
- Permissive MIT license with an actively maintained core library

## Pros
- Retrieval and document indexing are the primary design goal, not a feature bolted onto
  a broader orchestration framework
- Broad vector store and embedding-provider support across its integration ecosystem
- Active development and a large, fast-growing community

## Cons
- Python-first: the flagship `llama_index` package is the primary, most complete
  surface, so non-Python stacks have a narrower integration path
- Heavier orchestration/indexing framework than is needed for a single well-understood
  retrieval use case, where calling a vector store and an LLM API directly can be simpler
- The project's own hosted offerings (LlamaParse, LlamaCloud) are separate paid
  services — useful for production document parsing at scale, but a reason to check
  whether a given feature is open-source or hosted before relying on it

## Alternatives
LangChain (broader general-purpose LLM orchestration — chains, memory, and agents — over
LlamaIndex's narrower focus on data ingestion, indexing, and retrieval).

## Related Grove
[AI](/grove/ai)
