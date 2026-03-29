## 1. Global Setup and CLI Structure

- [ ] 1.1 **Implement:** Create `TerminalPresenter` class (in `scripts/openspec-cli/presenter.ts`) with typed JSON schemas for success/error payloads, handling `stdout`/`stderr` separation based on `--json` and `--non-interactive`.
- [ ] 1.2 **Implement:** Create `FsIntent` types and Executor (in `scripts/openspec-cli/fs-intents.ts`) to accumulate file operations for `--dry-run` safety.
- [ ] 1.3 **Implement:** Define Zod schemas in `scripts/openspec-cli/schema.ts` (or `index.ts`) for global CLI options.
- [ ] 1.4 **Implement:** Update `scripts/openspec-cli/index.ts` to attach global flags (`--non-interactive`, `--json`, `--force`, `--dry-run`) and append `.addHelpText('after', 'Examples:\\n...')` to all commands.

## 2. Refactoring Command Logic

- [ ] 2.1 **Implement:** Refactor `scripts/openspec-cli/propose.ts` to accept `stdin` (`-` or `--stdin`), parse inputs with Zod, use `TerminalPresenter`, and accumulate `FsIntent` operations (respecting `--force` and `--dry-run`).
- [ ] 2.2 **Implement:** Refactor `scripts/openspec-cli/collision.ts` and `start.ts` to safely bypass interactive `promptUser` and `promptUserConfirm` calls if headless environments (`!isTTY` or flags) are detected.
- [ ] 2.3 **Implement:** Update error handling in `eval.ts`, `validate.ts`, `readiness.ts`, and `coverage.ts` to output actionable, copy-pasteable CLI commands via `TerminalPresenter`.
- [ ] 2.4 **Implement:** Disable spinners in headless environments globally to prevent log corruption.

## 3. Testing & Validation

- [ ] 3.1 Verify intent-based execution: Run `openspec propose` with `--dry-run` and `--json` to ensure pure data streams and untouched file systems.
- [ ] 3.2 Verify `stdin` pipeline: Run `cat <plan> | openspec propose -` to ensure correct piped parsing.
- [ ] 3.3 Verify strict error formatting: Trigger intentional errors (e.g., missing dependencies) to validate actionable CLI output.
