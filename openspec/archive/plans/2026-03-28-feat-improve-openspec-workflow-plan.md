---
title: "feat: Improve OpenSpec Lifecycle & Developer Workflow"
type: feat
status: active
date: 2026-03-28
---

## Enhancement Summary

**Technical Review (2026-03-28):**
Applied feedback from Code Simplicity (YAGNI), Architecture, TypeScript, and Agent-Native reviews.

### Key Simplifications & Improvements

1. **YAGNI Simplifications:** Dropped the over-engineered SQLite persistent state machine for the 2-retry auto-fix loop. Reverted to a simple, in-memory async loop. Removed artificial event-loop delays and custom HTTP pooling.
2. **Hash Validation Fix:** Excluded `tasks.md` checkbox state mutations from the Hash-Based Validation so developers aren't blocked by "state drift" simply for checking off tasks.
3. **Agent-Native Parity:** Instead of just auto-rejecting prompts in headless mode, added programmable CLI flags (`--on-collision=supersede|merge`, `--auto-fix=true`) and structured JSON error schemas with `next_action` so agents can programmatically resolve issues.
4. **Corrected AST Tooling:** Replaced `ts-morph` / `@swc/core` with strict Zod parsing and Markdown AST (`remark`) validation, since `propose` generates specifications, not source code.
5. **Strict TypeScript Boundaries:** Enforced `zod` `.pipe()` chaining to prevent `JSON.parse` from leaking `any` types at the SQLite boundary, alongside exhaustive switch handling for states.

# Improve OpenSpec Lifecycle & Developer Workflow

## Overview

The current OpenSpec workflow successfully prevents LLM context bloat and divergence but leaks complexity to the developer. The "Halt and Update" protocol forces developers to manually rewrite markdown constraints mid-flight, and the fragmented CLI commands have critical bypass bugs (e.g., `check-ready` allowing implementation of specs that failed semantic validation, and `detect-collisions` running after files are already written to disk).

This feature consolidates the fragmented OpenSpec CLI into robust, AI-driven macro-commands (`propose` and `start`), enforces strict architectural validation, and automates the "Halt and Update" pivot process, significantly reducing developer friction.

## Problem Statement / Motivation

- **Context Switching:** Forcing developers to manually edit `design.md` or `tasks.md` when an architectural constraint changes mid-implementation breaks flow state.
- **Validation Bypasses:** Currently, developers can bypass `ai-eval` failures because `check-ready` doesn't enforce a passing SQLite record.
- **Late Collision Detection:** Duplicated specs are scaffolded to disk before `detect-collisions` runs, poisoning the dependency graph.
- **Incomplete Evaluation:** `ai-eval` currently ignores the actual `spec.md` behavioral scenarios, missing critical testing context.
- **Agent Dead Ends:** When the CLI errors out in headless mode, it doesn't provide programmable resolution paths for agents.

## Proposed Solution

Refactor the `scripts/openspec-cli/index.ts` to implement a "Meta-CLI" UX pattern and empower AI agents to proactively handle specification maintenance.

We will introduce two macro-commands:

1. `openspec propose <plan.md>`: Handles in-memory collision checking, Two-Phase scaffolding, DAG validation, and interactive `ai-eval` auto-fixing.
2. `openspec start <feature>`: Enforces strict dependency and evaluation checks before kicking off implementation.

Additionally, we will update the system instructions (`AGENTS.md` and `.cursor/rules/openspec-workflow.mdc`) to instruct AI agents to autonomously handle the "Halt and Update" protocol by showing a diff of their spec changes to the developer, and then instructing the human to authorize the bypass.

## Technical Considerations

### 1. Macro-CLI Commands & State Management

- **Two-Phase Commit Scaffolding:** Scaffold files into a temporary directory (`.openspec/.tmp/<feature>`) first. Run DAG validation and `ai-eval` against this temp directory. Perform an atomic `mv` to `openspec/changes/<feature>` only upon absolute success. This eliminates destructive `rm -rf` rollbacks.
- **Hash-Based State Validation:** The SQLite `ai-eval` record should store a SHA-256 hash of the evaluated spec files (`proposal.md`, `design.md`, `spec.md`). **Crucially, exclude `tasks.md` (or its checkbox states)** so normal developer progress doesn't trigger a "state drift" validation failure.
- **AST/Schema Validation:** Validate generated Markdown and YAML using `remark` AST and strict `zod` schemas _before_ saving to disk to prevent LLM hallucination errors. Do not use TS compilers here.
- **State Reset:** Provide an `openspec propose --clear-state` flag to purge stuck SQLite records for a feature.

### 2. Resolution Loops & Agent-Native Parity

- **In-Memory Async Loop (YAGNI):** The interactive auto-fix loop (max 2 retries) will be a simple in-memory `for` loop. We will not over-engineer a SQLite-backed resumable state machine for transient CLI executions.
- **Programmable Agent Flags:** To maintain Action Parity, agents invoking the CLI in headless mode must be able to provide the same decisions humans provide interactively.
  - `--on-collision=supersede|merge|abort`
  - `--auto-fix=true` (Allows the LLM to rewrite failing specs up to the retry limit).
- **Structured JSON Errors:** If an agent hits a dead end, the CLI must output a rich JSON error schema: `{"error": "eval_missing", "next_action": "Run 'openspec ai-eval <feature>' first."}` to unblock the agent.
- **Strict Zod Boundaries:** All JSON coming from SQLite or LLMs must use strict `.pipe()` validation to prevent `any` leakage (e.g., `z.string().transform(s => JSON.parse(s)).pipe(StrictSchema)`).

### 3. Agentic Workflow ("Halt and Update" Automation)

- Update AI prompts so that when a technical constraint is hit mid-coding, the agent pauses, asks the developer for direction, rewrites the affected specs (`design.md`, `tasks.md`), and presents a concise markdown diff of the changes.
- **Security Handoff:** Since the `--force-hash` validation bypass command must be strictly blocked when `--non-interactive` or `--ci` is true, the agent cannot bypass the hash itself. The agent's prompt must instruct it to ask the human: _"I have updated the specs. Please run `openspec update --force-hash` yourself so I can continue."_

## Acceptance Criteria

### Functional Requirements

- [ ] `openspec propose` runs collision checks in-memory before writing files.
- [ ] `openspec propose` uses a temporary directory (`.openspec/.tmp/`) for scaffolding and performs atomic moves upon success.
- [ ] Add `.openspec/.tmp/` to the workspace `.gitignore`.
- [ ] `openspec propose` offers an in-memory interactive `ai-eval` auto-fix loop with a max of 2 retries.
- [ ] `openspec start` strictly blocks execution if a passing `ai-eval` record does not exist in SQLite, validating against a SHA-256 hash that ignores `tasks.md` checkbox state.
- [ ] CLI supports Agent-Native programmable flags (`--on-collision`, `--auto-fix=true`, `--non-interactive`) and outputs structured JSON errors with `next_action` properties.
- [ ] AI agent system instructions (`AGENTS.md`, `.cursor/rules/openspec-workflow.mdc`) are updated to handle "Halt and Update" proactively, showing diffs and executing the security handoff for `--force-hash`.
- [ ] Add `openspec propose --clear-state` to purge corrupted SQLite records.

### Quality Gates

- [ ] CLI commands use Dependency Injection for `UserInteraction` to cleanly isolate terminal prompts from headless agent executions.
- [ ] Zod schemas strictly pipe `JSON.parse` outputs to prevent `any` types at the SQLite/LLM boundaries.
- [ ] TypeScript transition logic utilizes exhaustive `switch` statements (`const _exhaustiveCheck: never = current;`).
- [ ] Unit tests for `check-ready` verify SQLite blocking behavior and hash matching (excluding `tasks.md`).

## Dependencies & Risks

- Modifying the CLI requires careful handling of the SQLite schema (`eval-history.sqlite`) to track file hashes and enforce strict boundaries.
- Path Traversal: Ensure `<feature>` variables passed via LLM outputs are strictly validated via regex (e.g., `/^[a-z0-9-]+$/`) before being used in file system scaffolding.
- Prompt Injection: Protect the `ai-eval` loop from prompt injection by isolating untrusted spec text using XML-like bounds (e.g., `[[[UNTRUSTED_SPEC_START]]]`).

## References & Research

- Best Practices Research (Agentic Workflows): Spec-Driven Development (SDD), Action Parity for headless agents, and strict boundary validation.
- Technical Reviews: Code Simplicity (YAGNI), Architecture Strategy, Kieran (TypeScript/Node), Agent-Native Architecture, Security Sentinel, and Performance Oracle.
