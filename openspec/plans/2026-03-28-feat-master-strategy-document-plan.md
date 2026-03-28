---
title: "feat: Enhance Master Strategy Document"
type: feat
status: active
date: 2026-03-28
---

# Enhance Master Strategy Document

## Overview

A comprehensive enhancement of NicheAI's master documentation to serve both human stakeholders and AI coding agents. This plan addresses critical gaps in the business model, go-to-market (GTM) strategy, product design principles (Generative UI, HITL), and dual-database architecture representation, ensuring the product team has a complete foundation for extending the AI co-founder product.

## Problem Statement

While NicheAI has world-class execution documentation (`openspec/`), it lacks centralized master documents covering broader strategic, financial, and market-oriented questions. Current documents do not adequately define the business model, unit economics, deep GTM distribution tactics, comprehensive user personas, or product success metrics. To build successful AI SaaS rapidly, documentation must be modular, highly structured, and tightly coupled with the GTM motion.

## Proposed Solution

Create a highly structured, modular master documentation suite inside `docs/strategy/` and consolidate the technical and product principles into a unified master context document. This suite will incorporate:

1. **Product Strategy (The "Why" & "Who")**: Niche definition, validation proof, data flywheels, and strict non-goals.
2. **Product Design (The "Feel" & UX)**: Designing for uncertainty, HITL workflows, graceful degradation, and Generative UI.
3. **Technical Development (The "How")**: Model selection, asynchronous orchestration, and the dual-database boundary.
4. **Go-To-Market & Distribution**: Hybrid PLG + Sales-led motions, built-in distribution, and GTM economics.

## Technical Approach

### Architecture Documentation Enhancements

- **Dual Database Boundary:** Explicitly document the boundary between Firestore (source of truth metadata, real-time state) and Supabase (ephemeral/vector caching, relational queries, deduplication).
- **Asynchronous Task Plane:** Detail the BullMQ/Piscina worker pools, avoiding Node's single-threaded event loop blocking, and the asynchronous HTTP `202 Accepted` polling patterns.
- **AI Orchestration & Safety:** Document Gemini 3.1 Pro/Flash-Lite routing, HITL workflows, Zod-enforced JSON schemas, and edge-deployed Small Language Models (SLMs) as semantic firewalls to prevent prompt injections.
- **Controller Refactoring Strategy:** Document the architectural mandate to move heavy handler logic out of `server.ts` into controllers, and standardize external API calls using resilient Circuit Breaker patterns.

### Implementation Phases

#### Phase 1: Strategic Foundation & Business Model

- [ ] Create `docs/strategy/BUSINESS_PLAN.md`
- [ ] Define pricing strategy (SaaS vs. usage-based), unit economics, and LLM API cost analyses.
- [ ] Define market metrics (TAM/SAM/SOM).
- [ ] Create the competitive matrix (NicheAI vs. Generic LLMs, vs. standard market research agencies).

#### Phase 2: Go-To-Market (GTM) & Personas

- [ ] Create `docs/strategy/GTM_STRATEGY.md`
- [ ] Detail launch tactics and distribution channels.
- [ ] Define deep user personas (e.g., "Bootstrapped Indie Hacker", "Enterprise Innovation PM").
- [ ] Map customer journey maps from discovery to the "Aha!" moment.
- [ ] Outline built-in viral/SEO distribution mechanics and the hybrid PLG+Sales motion.

#### Phase 3: Metrics, KPIs, and Design Principles

- [ ] Create `docs/strategy/METRICS_AND_KPIS.md`
- [ ] Establish OKRs for upcoming quarters.
- [ ] Separate ML metrics from Product metrics (defining the UX impact of False Positives vs. Negatives).
- [ ] Outline Generative UI guidelines and designing for uncertainty.

#### Phase 4: Consolidate Master Context & Update References

- [ ] Create `docs/strategy/nicheai-master-context.md` (or root `docs/nicheai-master-context.md`) to aggregate the architectural boundaries and product principles.
- [ ] Synthesize technical constraints (e.g., Express 5.x BFF limitations, Firestore/Supabase split).
- [ ] Update `docs/landing-page-master.md` to reference the new strategy suite.
- [ ] Incorporate the new `mo.hassaniv@gmail.com` Git author preference into any developer onboarding mentions.

#### Phase 5: Automation & Continuous Sync (CI/CD)

- [ ] Refactor `lefthook.yml` to remove fragile local LLM generation hooks (`drift-healer`, `extract-roadmap`, `generate-docs`). Local hooks should be strictly deterministic (formatting, type-checking).
- [ ] Implement `.github/workflows/sync-strategy.yml` GitHub Action to asynchronously run `roadmap-extractor.ts` and `generate-docs` on every push to `master`/`main`.
- [ ] Configure the action to auto-commit updates back to the repository using the preferred git identity (`mo.hassaniv@gmail.com`), ensuring the Master Strategy Document reflects the true state of OpenSpecs and code without blocking the local dev loop.

## Alternative Approaches Considered

- **Monolithic PRD**: We considered putting all of this into a single `nicheai-master-context.md` file. This was rejected because AI coding assistants (and human readers) struggle with massive, unstructured documents. Splitting into modular files ensures agents can ingest exact contexts.

## Acceptance Criteria

### Functional Requirements

- [ ] Business model, monetization strategy, and unit economics are fully documented in `BUSINESS_PLAN.md`.
- [ ] GTM strategy includes built-in distribution mechanisms and a hybrid PLG+Sales motion in `GTM_STRATEGY.md`.
- [ ] Design principles explicitly cover Human-in-the-Loop (HITL), Graceful Degradation, and Generative UI in `METRICS_AND_KPIS.md` or `nicheai-master-context.md`.
- [ ] Architecture section correctly details the Firestore/Supabase boundary, the `server.ts` controller refactor mandate, and Express 5.x BFF limitations.

### Quality Gates

- [ ] Documentation passes a semantic review by `agents-memory-updater` or another LLM judge.
- [ ] No monolithic documents exceeding reasonable token limits for AI context injection.

## Success Metrics

- Reduced AI hallucination rates when generating new OpenSpecs (measured by fewer architectural corrections needed).
- Clearer alignment for new product team members on the "Niche over Horizontal" philosophy and GTM mechanics.

## Dependencies & Prerequisites

- Review existing `.cursor/rules/product-vision.mdc` and `AGENTS.md`.

## Future Considerations

- Integrate these strategy documents into a GraphRAG context builder so AI agents can query specific GTM or architectural constraints on demand.
- Update the OpenSpec CLI to automatically ingest the `docs/strategy/` contents when building context.

## References & Research

### Internal References

- `AGENTS.md`
- `docs/ROADMAP.md`
- `.cursor/rules/product-vision.mdc`
- `.cursor/rules/product-expert.mdc`
- Architecture ADRs (`docs/architecture/decisions/`)

### Subagent Research Insights

- **Repo Research**: Identified missing business/GTM master docs (Business Model, GTM Strategy, Competitive Matrix, User Personas, Success Metrics).
- **Learnings**: Emphasized Niche over Horizontal, lean MVP, heuristics first, Generative UI, and specific AI gotchas (Gemini 3.1 Pro, Flash-Lite).
- **Architecture**: Highlighted the dual database (Firestore + Supabase), the BFF pattern, the asynchronous task plane, and risks like `server.ts` bloat and distributed data consistency.
- **Best Practices**: Recommended the dual audience approach (human + AI), designing for uncertainty (HITL), hybrid GTM motions, and modular documentation.
