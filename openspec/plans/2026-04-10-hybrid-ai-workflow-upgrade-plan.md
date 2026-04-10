---
title: Hybrid AI Workflow Upgrade (Developer-in-the-Loop)
status: proposed
author: Product Strategist
date: 2026-04-10
dependencies: []
---

# Proposal: Hybrid AI Workflow Upgrade

## Context & Problem Statement

As we increasingly rely on autonomous AI agents (like Cursor) to accelerate development, we face a critical risk: **AI Drift**. Agents routinely bypass structured planning, hallucinate features outside of approved specs, and silently modify requirements to match their generated code.

Our initial instinct was to enforce compliance locally using hostile mechanisms—aggressive filesystem watchers and heavy AST-parsing ESLint plugins. However, these tools degrade the Developer Experience (DX). They fight the IDE, consume excessive CPU, and punish the human developer for the AI's mistakes.

We need an architecture that balances **seamless Developer Experience** with **strict AI containment**. The system must gently guide the AI locally but enforce an ironclad boundary before code reaches production.

## The Strategy: "Soft Local, Hard Remote"

Instead of treating the developer's local machine as a hostile environment, we are shifting the enforcement boundary. We will treat local guardrails as "bumpers" (to optimize AI behavior and provide fast feedback) and the CI/CD pipeline as the "brick wall" (to guarantee architectural integrity).

## Proposed Solution: The 3-Pillar Architecture

### 1. Synchronous CLI Validation (`npm run openspec verify`)

We will abandon passive Vitest drift warnings in favor of a synchronous, deterministic CLI command.

- **How it works:** `npm run openspec verify` acts as the single source of truth for checking if the current codebase aligns with the active `.openspec.yaml` hash and design documents.
- **Why it matters:** It provides immediate, actionable feedback to the AI and the developer. It is invoked via Lefthook pre-commit hooks to catch drift early, but it does not hijack the developer's filesystem.

### 2. The Hard Boundary: CI/CD Enforcement

Because local Git hooks can be bypassed by AI (e.g., via `git commit --no-verify`), the ultimate gatekeeper must be remote.

- **How it works:** GitHub Actions will run `npm run openspec verify --ci`. If the codebase state does not match the approved spec hash, or if undocumented files are mutated, the CI pipeline fails immediately.
- **Why it matters:** This removes the burden of enforcement from the local machine. The AI can experiment locally, but it cannot merge unapproved hallucinations into the `main` branch.

### 3. Immutable Specs via Hash Recalculation & CODEOWNERS

To prevent the AI from "fixing" validation errors by retroactively changing the spec to match its hallucinated code (hash spoofing).

- **How it works:**
  - `openspec/` directories will be locked down via GitHub `CODEOWNERS`, requiring explicit human review for any changes to specs.
  - The CI pipeline will independently recalculate the spec hash. If the PR's hash does not match the mathematically derived hash of the spec files, the build fails.
- **Why it matters:** It guarantees that the OpenSpec files remain the undisputed source of truth. The AI cannot forge a signature; it must write code that conforms to the human-approved design.

## User Experience (DX) Impact

- **For the Human Developer:** Almost invisible. No background watchers draining battery, no annoying lint errors blocking saves. You write code, you run your tests, and you commit. If the AI messes up, the pre-commit hook or CI catches it cleanly.
- **For the AI Agent:** Clear, deterministic feedback. When the AI attempts an unauthorized change, it is met with a fast, explicit error from `npm run openspec verify` outlining exactly which file drifted from the approved spec, allowing it to self-correct.

## Alternatives Considered & Rejected

- **Hostile FS Watcher:** Rejected for high CPU usage, brittle integration with IDEs, and creating a hostile local environment.
- **Custom ESLint Plugin for Spec Alignment:** Rejected for complexity. Parsing ASTs to determine architectural intent is notoriously unreliable and violates our "Minimum Lovable Product" philosophy for internal tooling.

## Success Metrics

- **0% Unauthorized Feature Leakage:** No code reaches `main` that isn't tied to a verified, human-approved OpenSpec hash.
- **< 5s Local Validation:** Pre-commit checks via `openspec verify` must execute in under 5 seconds to maintain high developer velocity.
- **Zero Local Overhead:** No background daemon processes required to enforce OpenSpec compliance.
