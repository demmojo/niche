# Proposal: P0 Intent-Based Testing Initiative

## Why

The NicheAI platform is experiencing instability across UI transitions, ML orchestration (LLM timeouts/errors), and Firebase data synchronization. We need a rigorous testing standard to stabilize Critical Path (P0) features and ensure consistent real-time state.

## What Changes

We are rolling out an intent-based testing suite for all P0 features: Tarpit Flywheel, Market Intelligence, and Validation Arena. The initiative includes Property-Based Testing (PBT) for LLM streams, UX Intent tests mimicking real screen-reader/user interactions, and a CI/CD stochastic evaluation layer for non-deterministic AI tasks.

## Capabilities

- Strict Vitest Firebase emulator teardowns to prevent memory leaks.
- Mathematical parsing proofs for partial LLM streams via `fast-check`.
- Accessible intent-driven UI tests using React Testing Library (asserting `<dialog>`, `aria-live`, etc.).
- LLM-as-Judge pairwise preference regression checks on pull requests.

## Impact

Eliminates 'Snapshot Beats Fetch' race conditions, prevents `SyntaxError` crashes on partial LLM stream chunks, guarantees explainable loading states, and statistically gates prompt/model regressions during CI/CD.
