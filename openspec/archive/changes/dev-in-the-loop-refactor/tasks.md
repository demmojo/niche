# Tasks: Developer in the Loop

## Phase 1: CLI Core Refactor (Dual-Mode Execution & Safe Staging)

- [ ] Task 1.1: Refine `FsIntent` / `FsExecutor` to support `GitMoveIntent` specifically for `archive`, and implement the `--stage` flag to write artifacts to a token-scoped `.tmp/openspec_<token>/root/` directory, mirroring the repository structure. Update the CLI to output dynamic `vscode://vscode.diff/` URIs (or a generic relative path instructions) for each modified file so the agent can provide native IDE side-by-side diff links in chat, replacing the need for a raw `.diff` text file.
- [ ] Task 1.2: Implement the `commit_token` generation using SHA-256 Content Hashing (synchronous `fs.readFileSync` -> `crypto.createHash`) of the specific working directory files affected by the `FsIntent` to prevent TOCTOU drift. This guarantees safety while eliminating brittle false-positive rejections caused by IDE auto-formatters shifting `mtime`.
- [ ] Task 1.3: Update `TerminalPresenter` to emit a lightweight, parseable JSON array of `FsIntent` summaries, the `commit_token`, and the diff URIs to `stdout`. Refactor all `process.exit(1)` calls to ensure **both** `stdout` and `stderr` buffers are fully drained before forcing an exit, preventing truncated CI/CD error logs and indefinite background hangs.
- [ ] Task 1.4: Create the `apply --token=<token>` command that validates the targeted SHA-256 drift hashes. Implement an **Application Ledger** rollback loop: iterate sequentially through file copies (`fs.cpSync`), tracking each operation. If a Node.js process crash or exception occurs mid-execution, execute the rollback ledger to overwrite corrupted files with their pre-application backups stored in `.tmp/`, preventing permanent partial-apply data loss.
- [ ] Task 1.5: Fix `archive` naive string matching (e.g. use Regex for plan files) and implement the `status` command to deterministically recover lost tokens. Ensure `.gitignore` tracks `.tmp/` and implement an asynchronous, non-blocking cleanup routine to purge artifacts older than 24 hours without punishing the developer with synchronous latency.

## Phase 2: Agent Tooling & Rules Refactor

- [ ] Task 2.1: Update `openspec-workflow.mdc` to define the Dual-Mode Architecture. Instruct agents to output clickable `vscode://vscode.diff/` links (or equivalent IDE URI instructions) in chat for native side-by-side review, and use `openspec status` if they lose context.
- [ ] Task 2.2: Update `.cursor/skills/create-openspec/SKILL.md` and `.cursor/skills/apply-openspec/SKILL.md` to reference the native IDE diff workflow, implement the JSON summary UX, and wait for natural language "approve".
- [ ] Task 2.3: Update `.cursor/skills/archive-openspec/SKILL.md` to reference the native IDE diff instructions and handle `GitMoveIntent`.
- [ ] Task 2.4: Update `AGENTS.md` to document the Dual-Mode pattern, `status` recovery loop, and explicit rejection of MCP/Claude Code hooks in favor of Cursor compatibility.
