import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Correctness: Fix Catastrophic Data Loss of .git Repository During Atomic Swap
content = content.replace(
  /it will swap strictly the required subdirectories \(e\.g\., `src\/`, `package\.json`, `node_modules\/`\) rather than renaming the entire root workspace directory\. Renaming the entire root directory permanently deletes the `\.git\/` object database and destroys the repository\. The swap mechanism MUST explicitly preserve the `\.git\/` directory and other critical hidden files by executing parallel or rapid sequential renames of only the mutated assets\./,
  `it will swap strictly the required files and subdirectories rather than renaming the entire root workspace directory. Renaming the entire root directory permanently deletes the \`.git/\` object database and destroys the repository. The swap mechanism MUST explicitly preserve the \`.git/\` directory and other critical hidden files by executing parallel or rapid sequential renames of only the assets generated or mutated during the staging phase.`
);

// 2. Correctness: Fix Auto-Recovery Overwrites Valid State (Race Condition)
content = content.replace(
  /If interrupted during this sequence, the next boot-time sweep MUST explicitly detect the orphaned `\.tmp\/workspace_old_\[UUID\]` directory\. Before restoring it, the recovery routine MUST verify if the live workspace is already successfully populated with the new state \(e\.g\., via checking a success lockfile or hash parity\)\. If the new state is fully applied, it simply deletes the orphaned backup\. If the live state is missing or corrupted, it restores the backup to the live workspace path to prevent data loss\. This recovery MUST occur before any other operations\./,
  `If interrupted during this sequence, the next boot-time sweep MUST explicitly detect orphaned \`_old\` directories or files. Before restoring them, the recovery routine MUST verify if the live workspace is already successfully populated with the new state (e.g., via hash parity). If the new state is fully applied, it simply deletes the orphaned backups. If the live state is missing or corrupted, it restores the backups to the live workspace path to prevent data loss. This recovery MUST occur before any other operations.`
);

// 3. Maintainability: Remove TerminalPresenter/CliOutputRouter
content = content.replace(/TerminalPresenter/g, 'OutputRouter');
content = content.replace(
  /To protect against downstream webhook limits crashing due to massive diffs, the CLI will route all output through a `OutputRouter`\. This presenter will strictly enforce/,
  `To protect against downstream webhook limits crashing due to massive diffs, the CLI will use a simple \`OutputRouter\` module to strictly enforce`
);
content = content.replace(
  /- \[ \] \*\*Task 3\.1\*\*: Modify the `OutputRouter` to bind `\.on\('error'\)` handlers to `process\.stdout` that specifically swallow `EPIPE` errors ONLY during JSON payload emission, ensuring legitimate streaming failures in other contexts are not masked\./,
  `- [ ] **Task 3.1**: Modify the \`OutputRouter\` module to bind \`.on('error')\` handlers to \`process.stdout\` that specifically swallow \`EPIPE\` errors ONLY during JSON payload emission, ensuring legitimate streaming failures in other contexts are not masked.`
);
content = content.replace(
  /- \[ \] \*\*Task 3\.3\*\*: Implement `OutputRouter` to enforce `stderr` logging and `stdout` JSON emission, including the explicit `--payload-dump-dir=<path>` opt-in flag\. Ensure payload files are written with `O_EXCL \| O_CREAT` \(`wx` flag\) and strict `0o600` permissions\./,
  `- [ ] **Task 3.3**: Implement the \`OutputRouter\` module to enforce \`stderr\` logging and \`stdout\` JSON emission via simple exported functions, including the explicit \`--payload-dump-dir=<path>\` opt-in flag. Ensure payload files are written with \`O_EXCL | O_CREAT\` (\`wx\` flag) and strict \`0o600\` permissions.`
);

// 4. Security: File Size Limits on Secret Scanning
content = content.replace(
  /Implement the chunked stream secret scanner \(using fixed-window boundaries or entropy checks for long lines\) during the `--stage` phase inside the `\.tmp\/` directory/,
  `Implement the chunked stream secret scanner (using fixed-window boundaries or entropy checks for long lines, and a strict 2MB per-file size limit to prevent ReDoS/Event Loop starvation) during the \`--stage\` phase inside the \`.tmp/\` directory`
);

// 5. Correctness/Maintainability: Fix git hash-object `--stdin-paths` non-existent flag
content = content.replace(
  /using `git hash-object -w --stdin-paths` \(which returns the valid Git SHA-1 blob ID\)\./,
  `using \`git hash-object -w --stdin\` in a chunked batch process or via a streaming wrapper (which returns the valid Git SHA-1 blob ID).`
);
content = content.replace(
  /prevent Git filename injection when piping to `git hash-object --stdin-paths` \(which expects newline-delimited input\)\./,
  `prevent Git filename injection when piping to \`git hash-object -w --stdin\` loops.`
);
content = content.replace(
  /by using `git hash-object -w --stdin-paths` during staging to generate blob IDs/,
  `by using \`git hash-object -w --stdin\` batch processes during staging to generate blob IDs`
);
content = content.replace(
  /The CLI will stream all paths directly into `stdin` while strictly respecting stream backpressure \(using `stream\.pipeline`\)\. It must actively drain the child process `stdout` stream strictly in parallel with the `stdin` pipeline \(e\.g\., using `Promise\.all\(\[stream\.pipeline\(\.\.\.\), consumeStdout\(\.\.\.\)\]\)`\) to prevent OS IPC pipe buffer deadlocks\. This bypasses Node memory limits without incurring child-process spawn overhead and avoids `argv` `E2BIG` limits\./,
  `The CLI will pipe file contents directly into \`git hash-object -w --stdin\` child processes in a bounded concurrency loop, capturing the blob IDs. This safely bypasses Node memory limits.`
);

// 6. Maintainability: Remove AtomicWorkspaceSwap Naming Obscurity & Remove Double Document Duplication
content = content.replace(/swapWorkspaceAtomically/g, 'commitStagedWorkspace');
content = content.replace(/AtomicWorkspaceSwap/g, 'commitStagedWorkspace');
content = content.replace(
  /In the `--apply` phase, the CLI will update the Git index directly using that exact blob ID \(`git update-index --cacheinfo`\), wrapping this operation in a retry loop with \*\*jittered\*\* exponential backoff \(hard-capped at 5 retries and a 500ms maximum delay\) specifically targeting `fatal: Unable to create '\.\.\/\.git\/index\.lock': File exists` errors to ensure stability against IDE background watchers\. Crucially, updating the index does not update the working tree; therefore, the CLI MUST execute the `commitStagedWorkspace` step immediately after the index update to synchronize the physical files with the new index state, preventing a desync where git reports staged changes that don't exist in the working directory\./,
  `In the \`--apply\` phase, the CLI will update the Git index directly using that exact blob ID (\`git update-index --index-info\` via stdin stream), wrapping this operation in a retry loop with **jittered** exponential backoff (hard-capped at 5 retries and a 500ms maximum delay) specifically targeting \`fatal: Unable to create '.../.git/index.lock': File exists\` errors to ensure stability against IDE background watchers. Crucially, updating the index does not update the working tree; therefore, the CLI MUST execute the \`commitStagedWorkspace\` step immediately after the index update to synchronize the physical files with the new index state.`
);


// 7. Maintainability: Deprecation Phase Logic (Zod passthrough)
content = content.replace(
  /but the CLI MUST strictly use Zod's native `\.strict\(\)` or `\.strip\(\)` parsing methods to return the sanitized options object securely, explicitly avoiding convoluted manual key deletion loops and `Object\.keys\(\)` diffing to prevent Prototype Pollution vulnerabilities and maintainability debt\. Deprecation warnings for unknown flags should be handled by Zod's built-in warning mechanisms if available, or omitted in favor of strict rejection\./,
  `but the CLI MUST strictly use Zod's native \`.strict()\` parsing method to securely reject unknown flags, abandoning convoluted manual \`.passthrough()\` diffing and custom deprecation warning loops to prevent Prototype Pollution vulnerabilities and eliminate maintainability debt.`
);
content = content.replace(
  /- \[ \] \*\*Task 0\.2\*\*: Update Zod schemas to use `\.passthrough\(\)` for legacy unknown flags and string-to-boolean coercion\./,
  `- [ ] **Task 0.2**: Update Zod schemas to strictly reject unknown flags via \`.strict()\`, avoiding custom passthrough logic, and implement string-to-boolean coercion.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update complete.');
