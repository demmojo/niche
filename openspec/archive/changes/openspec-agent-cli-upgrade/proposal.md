## Why

The OpenSpec CLI currently defaults heavily to human-interactive modes, pollutes JSON output streams with logs, lacks idempotency (e.g., hard-failing if a directory exists), and doesn't provide copy-pasteable examples in its help text. This makes it difficult for autonomous coding agents and CI/CD pipelines to interact with the CLI deterministically.

## What Changes

The CLI will be refactored into a "Dual-Mode" tool, safely bridging human interactive operation with non-interactive, programmable agentic workflows. We introduce strict data/log stream separation, idempotency safeguards, pipeline support, and rigorous TypeScript boundary typing.

## Capabilities

### New Capabilities

- `global-json-mode`: Support for explicit `--json` flag to guarantee pure JSON `stdout`.
- `idempotent-execution`: `propose` command uses `--force` and `--dry-run` to make automation retries safe.
- `pipeline-stdin`: `propose` supports piped input via `-` or `--stdin`.

### Modified Capabilities

- `actionable-errors`: Error formats provide concrete, copy-pasteable invocations instead of generic text.
- `interactive-prompts`: Auto-bypassed when headless environments are detected.
- `discoverability`: Every command gains an explicit `Examples:` block in its `--help` output.

## Impact

The entire `scripts/openspec-cli/` ecosystem. Modifications affect `index.ts`, `propose.ts`, `collision.ts`, `start.ts`, `eval.ts`, `validate.ts`, `readiness.ts`, and `coverage.ts`. No web application code is touched.
