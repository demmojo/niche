# Proposal: Update OpenSpec Lifecycle for Intent-Based Testing

## Why

In an AI-driven development lifecycle, there is a high risk of tautological testing. When an AI generates code and then generates tests, the tests often merely confirm the implementation details of the code rather than validating the core business requirements. To combat this, tests must be intent-based (verifying outcomes, not implementation) and mandated structurally before the code is written.

## What Changes

We are updating the custom OpenSpec workflow managed via `.cursor/rules` and `.cursor/skills`. Every new feature implementation will now strictly require unit, integration, and intent-based tests with a 90% minimum coverage threshold.

## Capabilities

- **Red-Green TDD Workflow Enforcement:** AI agents are structurally forced to write failing tests before feature implementation.
- **Strict Coverage Thresholds:** Mechanical, deterministic checks enforce a hard >=90% local coverage minimum using Vitest's V8 coverage engine.
- **Anti-Tautological Guardrails:** A new "Halt and Update" protocol prevents the creation of "vanity tests" designed solely to inflate metrics.
- **Unified Testing Stack Guidelines:** Mandated use of React Testing Library, Mock Service Worker (MSW), and Firebase Local Emulator Suite without internal state or SDK mocking.

## Impact

This systemic change guarantees that all code produced by AI agents features resilient, refactor-proof tests. It significantly reduces technical debt, eliminates hallucinations in test verification, and ensures true alignment with business intent.
