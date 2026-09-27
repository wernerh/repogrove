# REQUIREMENTS.md

The owner's original product specification is preserved verbatim below as the primary
requirements source. `PRODUCT.md` and `ARCHITECTURE.md` are the maintained, living
summaries derived from it — when they conflict with a later owner decision, the decision
(recorded in `DECISIONS.md`) wins; this file is a historical snapshot, not itself updated.

---

*(Full spec — 35 sections, "RepoGrove.com — Autonomous Open-Source Discovery Platform" —
supplied by the owner 2026-09-27. See the repository's initial commit for the complete
text, or the owner's Claude Project description, which holds the canonical original.)*

## Section index (for quick navigation — see the Project description for full text)
1. Product Vision
2. Core Concept: Groves
3. The Killer Feature: Alternatives
4. Paid Product → Free/Open-Source Alternative
5. Repository Intelligence
6. GitHub Star Tracker
7. RepoGrove "Heat"
8. Homepage
9. Search
10. Repository Pages — Multiple Perspectives
11. News Widget
12. Newsletter
13. Monetisation
14. SEO Strategy
15. Data Architecture — Option A (traditional DB)
16. Data Architecture — Option B (Git-native content DB)
17. Hybrid Architecture (chosen — see ARCHITECTURE.md)
18. Simpler MVP
19. Autonomous Content Pipeline
20. GitHub-as-State Architecture
21. Community Contributions
22. Personal Watchlists
23. "Why Is This Trending?"
24. "Build This Stack"
25. Grove Pages
26. Business Model Flywheel
27. Brand
28. Technical Requirements
29. Important Product Principle
30. Initial MVP
31. Phase 2
32. Phase 3
33. Autonomous Development Requirement
34. Success Metrics
35. First Implementation Task

## Non-functional requirements derived from the spec
- Pages must be genuinely useful, not programmatic filler (§14, §29) — every generated
  URL needs unique information.
- News aggregation must respect source licensing, robots rules, and attribution;
  summaries, not copied articles (§11).
- Methodology behind "Heat"/momentum must be documented and transparent (§7).
- Agents must never treat their own generated output as authoritative state (§20, §33) —
  enforced via PR + CI in `CLAUDE.md`.
