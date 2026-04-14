# Spec: Hybrid AI Workflow Upgrade

## Core Features

1. **Checkpoint Protocol CLI** (`openspec checkpoint`, `openspec undo`): Local commands wrapping git logic to snapshot and safely revert AI code mutations.
2. **Remote Semantic Evaluator** (`openspec ai-eval`): Fast-failing CI script invoking Gemini 3.1 Pro via an `evaluatePairwise` function.
3. **Immutable Source of Truth**: `.github/CODEOWNERS` mapping human reviewers to the `openspec/` directory.

## Scenarios

**Scenario 1: Snapshotting AI Work**

- WHEN a developer delegates a task to the AI agent
- AND the agent is prompted to begin
- THEN the agent invokes `npm run openspec checkpoint`
- AND the CLI creates a Git snapshot via `git add -A && git commit -m "CHORE: openspec-pre-ai-wip-snapshot"`.

**Scenario 2: Atomic Rollback on Hallucination**

- WHEN the AI generates errant code or breaks the build locally
- THEN the developer invokes `npm run openspec undo`
- AND the system executes `git reset --hard HEAD`, `git clean -fd`, and `git reset HEAD~1`
- AND the exact pre-execution working directory WIP state is safely restored.

**Scenario 3: CI Evaluation Fast-Fails on Drift**

- WHEN an AI agent submits a Pull Request with code deviating from `design.md`
- THEN the CI pipeline triggers `npm run openspec ai-eval`
- AND the process calculates the scope using `git diff HEAD^1 HEAD --name-only`
- AND `gemini-3.1-pro` evaluates the explicitly scoped diff strictly statelessly (zero cache)
- AND the pipeline rejects the PR immediately based on the semantic deviation.

**Scenario 4: Valid Constraint Escalation (Halt & Update)**

- WHEN the AI agent discovers the prescribed spec is technically impossible or suboptimal during implementation
- THEN the agent complies with the "Halt & Update" prompt boundary
- AND halts generating code immediately
- AND directly mutates the relevant markdown file in `openspec/`
- AND submits the change, requiring a human CODEOWNER's explicit review and approval.
