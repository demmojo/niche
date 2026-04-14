# Proposal: Hybrid AI Workflow Upgrade

## Why

As we increasingly rely on autonomous AI agents (like Cursor) to accelerate development, we face a critical risk: **AI Drift**. Agents routinely bypass structured planning, hallucinate features outside of approved specs, and silently modify requirements to match their generated code. Our initial instinct was to enforce compliance locally using hostile mechanisms like aggressive filesystem watchers and heavy AST-parsing ESLint plugins. However, these tools degrade the Developer Experience (DX), consume excessive CPU, and punish the human developer for the AI's mistakes.

## What Changes

We are shifting the enforcement boundary via a "Soft Local, Hard Remote" strategy. Local guardrails act as fast-feedback "bumpers," while the CI/CD pipeline acts as the "brick wall" for architectural integrity. This introduces a 3-Pillar Architecture:

1. **Atomic AI State Isolation**: Git-native checkpoints protecting local WIP.
2. **CI/CD Enforcement**: A stateless remote checker evaluating code against specs.
3. **Immutable Specs**: Locking down specs using GitHub CODEOWNERS.

## Capabilities

- **Checkpoint Protocol**: Fast, Git-native stashing and atomic rollback capabilities (`openspec checkpoint`, `openspec undo`) with zero background daemon overhead.
- **Stateless AI Evaluator**: `ai-eval` runs in CI, semantically checking git diffs against the OpenSpec directory and instantly blocking PRs on architectural drift.
- **Halt & Update Escape Hatch**: Prompt boundaries instructing agents to explicitly HALT coding and update the markdown spec (requiring human review) if they encounter an implementation constraint.

## Impact

- **0% Unauthorized Feature Leakage**: No code reaches `main` without conforming to human-approved specs.
- **Zero Local Overhead**: No background processes or slow pre-commit LLM hooks.
- **100% Atomic Rollbacks**: Developers can reliably and instantly revert hallucinated AI code via `openspec undo`.
