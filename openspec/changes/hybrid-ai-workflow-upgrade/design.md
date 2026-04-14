# Design: Hybrid AI Workflow Upgrade

## Context

Our workflow integrates autonomous AI coding agents, but they tend to diverge from approved OpenSpecs. We need a system that prevents these AI hallucinations from merging into production without destroying the developer's local coding experience through invasive tracking tools or slow hooks.

## Goals

- Ensure exact semantic alignment between `openspec/` markdown files and production code.
- Provide developers with an immediate, foolproof way to revert bad AI implementations.
- Guarantee that specs remain the undisputed source of truth without custom file-hashing logic.

## Non-Goals

- Real-time semantic linting of AI-generated code directly within the IDE.
- Pre-commit LLM evaluation gates (these slow down standard commits).

## Decisions

- **"Soft Local, Hard Remote" Architecture**: Defer strict semantic validation to CI/CD, allowing developers high velocity locally.
- **Soft-Wrap Git Checkpoint Pattern**: We will rely on raw `git add -A && git commit` (wrap) and `git reset HEAD~1` (unwrap) rather than relying on complex `chokidar` file watchers to isolate AI edits.
- **Stateless Pairwise Judge in CI**: We will implement `ai-eval` using `gemini-3.1-pro` to semantically compare code against specs in the pipeline. This tool will run with **zero caching** to prevent stale-cache false positives or evasion.
- **Blast-Radius Scoping**: To prevent context window exhaustion and maintain fast CI execution, the evaluator will exclusively check explicit files modified within the current commit (`git diff HEAD^1 HEAD --name-only`).
- **GitHub CODEOWNERS**: Rather than writing custom hash recalculation meta-tooling, we lock down `openspec/` via native GitHub configuration to guarantee human oversight over spec alterations.

## Risks & Trade-offs

- **Delayed Drift Detection**: Finding out about AI hallucinations remotely (in CI) instead of locally delays feedback. _Mitigation_: We offset this via the "Halt & Update" escape hatch prompt, teaching agents to catch constraints early and request approval, alongside the atomic local rollback command for immediate recovery.

## Alternatives Rejected

- **Local Pre-Commit Verification**: Deterministic validation against natural language takes over 5 seconds. Ruining git commit UX was rejected.
- **Custom ESLint Plugin / Hostile FS Watchers**: High CPU usage and brittle IDE integrations.
- **CI Spec Hash Recalculation**: Redundant tooling; GitHub CODEOWNERS achieves spec immutability natively.
