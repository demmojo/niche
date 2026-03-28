# Proposal: Test Coverage Expansion

## Why

To ensure NicheAI maintains stability while remaining a "Minimum Lovable Product" (MLP), we need a robust safety net. Currently, test coverage is insufficient, risking production regressions during refactoring. Stochastic evaluation tools and leaky environments introduce flakiness and slow down CI.

## What Changes

- Enforce an 80% branch and intent-based test coverage threshold using Vitest (`v8` provider).
- Implement robust, isolated integration tests directly against the Firebase Emulator without over-engineered Dependency Injection bloat.
- Refactor LLM stream parsing into pure, deterministic functions to support property-based testing.
- Add Mock Service Worker (MSW) for testing frontend API edge cases (500 errors, loading states, empty responses).

## Capabilities

- **Isolated Test Runs:** Dynamic Firebase project IDs allow parallel execution in Vitest without database collisions.
- **Intent-based Frontend Testing:** Validates "Unhappy Paths" via React Testing Library (RTL) and MSW without directly mocking the Firebase SDK.
- **Property-based Testing:** Validates stream parsers using `fast-check` to catch edge cases systematically while maintaining deterministic CI speeds.
- **Memory Leak Prevention:** Strict global teardowns and timer management prevent React 19 and Vitest V8 OOM crashes.

## Impact

- Prevents regressions and improves overall code reliability.
- Maintains fast CI/CD pipeline execution by avoiding flaky tests and complex meta-tooling.
- Fixes critical React 19 and Firebase snapshot memory leaks during test suites.
