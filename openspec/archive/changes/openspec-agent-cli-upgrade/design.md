## Context

The NicheAI platform leverages an OpenSpec-driven workflow for planning and implementing features. Currently, the `openspec` CLI tool provides human-centric prompts, text logging to `stdout`, and manual validation steps. As we transition to having coding agents frequently execute these workflows autonomously, the interactive nature of the CLI becomes a blockade. Human-first features like `ora` spinners corrupt agent logs, missing flags cause hangs, and non-idempotent operations break retry loops.

## Goals / Non-Goals

**Goals:**

- Build a "Dual-Mode CLI" capable of serving both human developers and headless agents seamlessly.
- Enforce strict JSON structure on `stdout` when requested, routing all side-effect telemetry (logs, warnings) to `stderr`.
- Introduce `--force` and `--dry-run` to make destructive actions idempotent and previewable.
- Enhance Commander.js `--help` outputs with concrete `Examples:`.
- Improve error messages to contain copy-pasteable resolution commands.
- Guarantee strict TypeScript boundaries when parsing CLI inputs.

**Non-Goals:**

- Build a graphical user interface (GUI) or web dashboard for OpenSpec.
- Modify the AI evaluation underlying logic beyond output formats.

## Decisions

**1. Strict Presenter/Logger Boundary**

- **Decision**: Introduce a dedicated `TerminalPresenter` class to act as the single source of truth for CLI output formatting.
- **Rationale**: Direct `console.log` and `console.error` calls scattered throughout the CLI risk polluting the JSON `stdout` stream in headless mode. Centralizing output guarantees pure data streams.
- **Alternatives Considered**:
  - _Patching `console.log` globally_: Rejected due to unpredictability and conflict with external library logs.

**2. Command Pattern for Write Intents**

- **Decision**: Refactor filesystem mutations to use a "Unit of Work" pattern comprising strongly-typed `FsIntent` objects (`{ kind: 'mkdir' }`, `{ kind: 'createFile' }`, etc.).
- **Rationale**: Implementing `--dry-run` safely requires separating the _calculation_ of changes from the _execution_ of those changes. This ensures the dry-run never touches the filesystem while correctly logging the intended action.
- **Alternatives Considered**:
  - _Mocking `fs` module during `--dry-run`_: Rejected as overly complex and prone to false positives in execution.

**3. Zod Schema Validation for Options**

- **Decision**: Parse Commander's `.optsWithGlobals()` using Zod.
- **Rationale**: Commander returns `any` for parsed options. In a strongly-typed system, assuming these shapes are correct is risky. Zod enforces the exact boundary contract required.
- **Alternatives Considered**:
  - _Manual type casting_: Rejected as it bypasses runtime validation entirely.

## Risks / Trade-offs

- **Risk: Pseudo-TTY False Positives** -> Relying on `process.stdout.isTTY` is fragile in CI/CD environments.
- **Mitigation**: Augment with checks for common headless environment variables (`CI`, `NON_INTERACTIVE`, `NO_COLOR`).
- **Risk: In-Memory Bottlenecks with Stdin** -> Piped data might exhaust memory if excessively large.
- **Mitigation**: Constrain the expected piped payload to markdown plan files, which are inherently small enough to reside in memory safely.

## Future Potential & Wow Features

- **Agent-First SDK Generator**: Expanding the CLI's structured output could allow us to dynamically generate a typed Node.js SDK for the OpenSpec engine, enabling agents to call functions natively instead of relying entirely on shell wrappers.
- **Architectural / Design To-Do**: Fully decouple the `openspec` CLI logic into a standalone library package, separating the core dependency resolution graph from the CLI runner.
