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

### 1. Atomic AI State Isolation (The Checkpoint Protocol)

To protect the developer's uncommitted work from AI hallucinations without relying on background file watchers (`chokidar`), we are introducing Git-native checkpointing:

- **`npm run openspec checkpoint`**: Before modifying code, agents must invoke this command to stash the developer's current working directory state (`git add . && git commit -m "chore(openspec): pre-agent state"`).
- **`npm run openspec undo`**: If the AI hallucinates or breaks the build, the developer can atomically rollback the AI's IDE edits and restore their original WIP using `git reset --hard HEAD && git reset HEAD~1`.
  This guarantees zero data loss and instant rollback across the entire repository without heavy daemons.

### 2. The Hard Boundary: CI/CD Enforcement (`npm run openspec ai-eval`)

Because local Git hooks can be bypassed by AI (e.g., via `git commit --no-verify`), the ultimate gatekeeper must be remote.

- **How it works:** GitHub Actions will run `npm run openspec ai-eval`. If the codebase state does not semantically match the approved spec, or if undocumented files are mutated, the CI pipeline fails.
- **Why it matters:** This removes the burden of semantic enforcement from the local machine. The AI can experiment rapidly locally without blocking git commits via slow `<5s` LLM checks, but it cannot merge unapproved hallucinations into the `main` branch.

### 3. Immutable Specs via GitHub CODEOWNERS

To prevent the AI from "fixing" validation errors by retroactively changing the spec to match its hallucinated code (hash spoofing).

- **How it works:** The `openspec/` directory will be locked down via GitHub `CODEOWNERS`, requiring explicit human review for any changes to spec documents.
- **Why it matters:** It guarantees that the OpenSpec files remain the undisputed source of truth. The AI cannot forge a signature or silently alter requirements; it must write code that conforms to the human-approved design, eliminating the need for over-engineered, brittle custom hashing scripts in CI.

### 4. The "Halt & Update" AI Escape Hatch

When the AI encounters a legitimate technical constraint that requires deviating from the approved design.

- **How it works:** Explicit prompt boundaries will instruct the agent: If an implementation must diverge from `design.md`, the agent must immediately HALT coding. It must update the `design.md` or `spec.md` directly to reflect the new architectural reality and request human approval for the spec change.
- **Why it matters:** It prevents the AI from either getting permanently stuck trying to implement an impossible spec or silently hallucinating unapproved workarounds.

## User Experience (DX) Impact

- **For the Human Developer:** Seamless. No background watchers draining battery, no annoying lint errors blocking saves, and no slow pre-commit hooks executing LLM calls. You write code, you run your tests, and you commit. If the AI hallucinates, you run `npm run openspec undo` to instantly recover your WIP.
- **For the AI Agent:** Clear boundaries. The AI knows it has a formal "Halt & Update" path if it gets stuck, rather than fighting a hostile local environment.

## Alternatives Considered & Rejected

- **Local Pre-Commit Verification (`openspec verify`):** Rejected because deterministic semantic validation of arbitrary code changes against natural language design documents cannot execute in under 5 seconds without heavy local LLM calls, ruining the git commit experience.
- **Custom ESLint Plugin / Hostile FS Watchers:** Rejected for high CPU usage, brittle integration with IDEs, and creating a hostile local environment.
- **CI Spec Hash Recalculation:** Rejected as redundant meta-tooling bloat. Native GitHub `CODEOWNERS` achieves superior spec immutability without the maintenance cost of custom cryptographic logic.

## Success Metrics

    - **0% Unauthorized Feature Leakage:** No code reaches `main` that isn't tied to a human-approved OpenSpec.
    - **Zero Local Overhead:** No background daemon processes or blocking pre-commit hooks required to enforce OpenSpec compliance.
    - **100% Atomic Rollbacks:** `openspec undo` reliably restores developer WIP after AI hallucinations.

    ## Detailed Technical Implementation

    ### 1. `ai-eval` Semantic Checker (CI/CD Pipeline)
    To enforce architectural density and prevent prompt drift without bottlenecking the pipeline, we implement a stateless, fast-failing semantic checker designed to validate intent against reality.

    *   **Blast-Radius Scoping**: Instead of employing heavy RAG or full-codebase vector searches, the checker strictly limits its evaluation scope to the explicit files modified in the current commit. This is calculated via `git diff HEAD^1 HEAD --name-only`, preventing context exhaustion and ensuring high-signal evaluations.
    *   **Automated Pairwise Judge**: We utilize `gemini-3.1-pro` executing as an automated Pairwise Judge (`evaluatePairwise`). It compares the implemented source code directly against the dense `openspec/` markdown artifacts (`design.md`, `spec.md`) to detect architectural drift.
    *   **Fast-Failing**: The evaluation is configured to fail the CI job immediately upon detecting semantic deviations or unmet constraints, rather than compiling a passive warning report.
    *   **Zero Caching Strategy**: Crucially, this evaluation step must operate with **no caching**. Because AI evaluations are non-deterministic and highly sensitive to external context shifts, enforcing a stateless, from-scratch evaluation on every CI run guarantees rigorous validation and entirely eliminates stale-cache false positives or bypassed checks.

    ### 2. Hardened Git Checkpoint Logic ("Soft-Wrap" Pattern)
    Because AI-driven code generation and IDE-native edits can result in unpredictable, sweeping filesystem mutations, we must protect the developer's working tree from irrecoverable corruption. We accomplish this by implementing the "Soft-Wrap" Git checkpoint pattern around all mutative OpenSpec CLI actions.

    *   **Pre-Execution Snapshot (The Wrap)**: Before any AI mutation begins (e.g., applying a spec), we stash the exact current state of the working directory into a temporary checkpoint:
        ```bash
        git add -A && git commit -m "CHORE: openspec-pre-ai-wip-snapshot"
        ```
    *   **Failure/Rollback Flow**: If the AI process crashes, fails validation, or hallucinates, we forcefully purge all intermediate changes and revert the filesystem to the exact pre-execution state:
        ```bash
        git reset --hard HEAD
        git clean -fd
        ```
    *   **Success/Unwrap Flow**: If the AI successfully completes the implementation and passes automated staging checks, we cleanly "unwrap" the checkpoint. This safely leaves the developer's working directory populated with the successful AI modifications as uncommitted, reviewable changes:
        ```bash
        git reset HEAD~1
        ```
