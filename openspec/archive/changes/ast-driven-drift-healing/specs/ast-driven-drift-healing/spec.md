# Spec: AST-Driven Pre-Commit Drift Healing

## Features

### 1. Stateless AST Diffing

The system implements `scripts/openspec-cli/ast-scanner.ts`, a fast, stateless module. It loads staged files (`git diff --cached`) and previous versions (`git show HEAD:file`) into an in-memory `ts-morph` file system using `isolatedModules: true`. It outputs a Semantic Signature (e.g., `[Added] Component Button.tsx: props.isLoading (boolean)`).

### 2. Pre-Commit Auto-Heal

A refactored `drift.ts` intercepts the `pre-commit` hook. It receives the Semantic Signature summary, routes the change to the correct `spec.md`, prompts Gemini to patch the markdown, and automatically stages the modified file via `git add <patched-files>`.

### 3. Sprint Insight Extraction

If the LLM detects undocumented workarounds or scope creep within the semantic changes, it automatically generates a task (e.g., `- [ ] Refactor: ...`). This task is appended to the relevant `tasks.md` or logged to `docs/brainstorms/tech-debt.md`.

## Scenarios

### Scenario: Committing a structural change

- **WHEN** a developer stages and commits a structural code change
- **THEN** the AST scanner triggers auto-heal, patching the relevant `spec.md` and including the updated doc in the same commit.

### Scenario: Committing a styling/formatting change

- **WHEN** a developer stages changes that do not affect the Semantic Signature
- **THEN** the AST scanner yields an empty diff, and the commit proceeds instantly without invoking the LLM.

### Scenario: System detects an undocumented workaround

- **WHEN** the auto-heal LLM identifies a workaround in the code changes
- **THEN** it injects a formal technical debt task into `tasks.md` or `docs/brainstorms/tech-debt.md`.

### Scenario: Network degradation during pre-commit

- **WHEN** the LLM auto-heal process exceeds the 3000ms timeout
- **THEN** the process outputs a warning and fails open (`exit 0`), allowing the code commit to proceed normally.
