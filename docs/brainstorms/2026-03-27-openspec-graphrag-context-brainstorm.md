---
title: OpenSpec Native GraphRAG Context Retrieval
type: brainstorm
status: draft
date: 2026-03-27
---

# OpenSpec Native GraphRAG Context Retrieval

## What We're Building

A dynamic context retrieval system built directly on top of the OpenSpec deterministic Directed Acyclic Graph (DAG) for NicheAI. Instead of injecting all ~30k words (40k tokens) of product specifications into the LLM context window at once—which leads to "Context Dilution" and the "Lost in the Middle" phenomenon—we will build a "Lean Context Engine".

This engine will traverse the existing `.openspec.yaml` dependencies (`depends_on` and `blocks`) to load ONLY the `spec.md`, `design.md`, and `proposal.md` of the immediate feature being worked on, plus the abstracted summaries of its 1st-degree neighbors in the graph.

## Why This Approach

- **Combats Context Dilution:** Adding all specs all the time degrades AI performance. The LLM focuses on irrelevant early tokens ("attention sinks") rather than the specific code task.
- **Zero Hallucination Retrieval:** Unlike pure vector-database semantic search (which can retrieve fragmented, out-of-context snippets), navigating a hardcoded YAML dependency graph ensures we only pull in components that are architecturally relevant to the current feature.
- **YAGNI Compliance:** We already have `scripts/openspec-cli/context.ts` and DAG validation logic in place. Building GraphRAG on top of this requires no external vector databases or expensive ML infrastructure.

## Key Decisions

### 1. The Context Builder (`context.ts` Enhancement)

- The existing `build-context` command will be upgraded to perform Graph Traversal.
- When an AI agent starts working on `feature-A`, the script will load:
  - Full markdown artifacts of `feature-A`.
  - Only the `design.md` (for architectural boundaries) of any feature listed in `depends_on`.
  - Only the `proposal.md` (for high-level intent) of any feature listed in `blocks`.

### 2. Prompt Layout Optimization

- We will structure the final injected context block to counteract the "Lost in the Middle" effect:
  - **Top:** Global system rules (e.g., NicheAI product vision, OpenSpec workflow rules).
  - **Middle:** The dynamically retrieved 1st-degree neighbor summaries.
  - **Bottom (Closest to execution):** The specific `tasks.md` and `spec.md` for the current feature.

## Open Questions

- _None left._

## Resolved Questions

- **Depth of Traversal:** We will use **Budget-based traversal**. The graph traversal will not strictly stop at 1st-degree neighbors. Instead, it will traverse further (e.g., 2nd-degree) to gather as much architectural context as possible, strictly stopping when the total token count reaches a "Lean Context" threshold (e.g., 10,000 tokens).
