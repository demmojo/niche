# Claude Code Smart Wrapper

## 🛑 STRICT OPENSPEC GATE 🛑

Before taking ANY action, modifying files, or planning tasks, you MUST read the following foundational rules using your Read tool:

1. `cat .cursor/rules/000-strict-openspec-gate.mdc`
2. `cat .cursor/rules/openspec-workflow.mdc`
3. `cat AGENTS.md`

You are strictly forbidden from writing code or altering architecture without an active, approved OpenSpec DAG.

If you are blocked on an implementation due to architectural constraints, you must trigger the **Halt & Update** protocol by pausing execution and updating the `design.md` or `spec.md` instead of silently hallucinating a workaround.

## 🛠️ Hybrid AI Workflow Responsibilities

- **Cursor (Gemini Pro):** Handles granular code editing, real-time feedback, Vitest fixing, and localized debugging.
- **Claude Code (Opus):** Handles architectural planning, OpenSpec generation, DAG validation, and complex terminal orchestration.

## 🧠 Working Memory Scratchpad

_(Use this space to jot down temporary notes, findings, or context during long-running sessions to prevent forgetting context across context window resets.)_

- _Current focus..._
