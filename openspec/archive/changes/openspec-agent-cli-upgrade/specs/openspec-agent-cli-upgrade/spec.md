# OpenSpec Agent CLI Upgrade

The OpenSpec CLI must be retrofitted to correctly support headless, deterministic execution by autonomous AI agents. This involves updating input parsing, stream isolation, and execution safety.

## Features

### 1. Global Option Parsing

- **Requirement:** The CLI must support global flags: `--non-interactive`, `--json`, `--force`, and `--dry-run`.
- **Requirement:** Inputs must be validated strictly using Zod at the Commander action boundary.

### 2. Stream Isolation (Dual-Mode Output)

- **Requirement:** When `--json` is active, the CLI must only emit pure, parsable JSON to `stdout`. All progress logs, warnings, or debug messages must route to `stderr`.
- **Requirement:** Visual spinners (e.g., `ora`) must be completely disabled if `!process.stdout.isTTY` or `--non-interactive` is true to prevent log corruption.

### 3. File System Safety (Unit of Work)

- **Requirement:** Destructive or mutating operations (e.g., scaffolding a new feature in `propose`) must accumulate operations as a list of typed Intents (`FsIntent`).
- **Requirement:** If `--dry-run` is active, the CLI must log the intents to the `TerminalPresenter` but skip actual `fs` execution.
- **Requirement:** If `--force` is active, the CLI safely overwrites existing files/directories. If false, it must fail fast in non-interactive mode.

### 4. Headless-First Paradigms

- **Requirement:** Interactive prompts (like resolving collisions in `detect-collisions` or confirming `ai-eval` in `start.ts`) must automatically bypass and default to safe/fast-fail behaviors if a headless environment is detected.
- **Requirement:** Error messages must supply exact CLI invocations to resolve the issue (e.g., "Run: openspec start <feature>").

## Scenarios

- **WHEN** the CLI is executed with `--dry-run`
- **THEN** it should output the intended file operations but the filesystem should remain untouched.

- **WHEN** the CLI is executed with `--json`
- **THEN** it should emit structured JSON on `stdout` and route all logs to `stderr`.

- **WHEN** `openspec propose -` is piped a markdown file
- **THEN** it should parse the `stdin` stream exactly as if a file path were provided.

- **WHEN** a required parameter is missing in a headless environment
- **THEN** the CLI should fail fast with a concrete usage example instead of hanging on an interactive prompt.
