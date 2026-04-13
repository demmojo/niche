import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Correctness/Security: Fix non-atomic multiple component swap 
// A single fs.renameSync on the root directory is POSIX atomic.
content = content.replace(
  /Then sequentially swap the updated `package\.json` and `package-lock\.json` into the live workspace, followed immediately by the `node_modules` directory swap\) to mutate dependencies without violating atomic isolation\./,
  `Then execute a single \`fs.renameSync\` of the entire \`.tmp/[UUID]\` staging directory over the live workspace, guaranteeing POSIX atomicity for all files and dependencies simultaneously, avoiding split-brain state corruption.) to mutate dependencies without violating atomic isolation.`
);

// 2. Correctness/Security: Fix node_modules rename swap issue
// It's impossible to rename a directory over a non-empty directory. 
// We must move the contents or rename the old one away first.
content = content.replace(
  /Instead of removing the live `node_modules` first, it will rename the live directory to a unique `_old_\[UUID\]` suffix \(explicitly catching and swallowing `ENOENT` if the directory doesn't exist yet\), rename the staging directory into place, and then asynchronously delete the old directory\. This creates a microsecond transient state where `node_modules` does not exist, but guarantees POSIX atomicity\./,
  `To execute the final atomic swap over a populated workspace, the CLI MUST first rename the live workspace directory to a unique \`.tmp/workspace_old_[UUID]\` suffix, then rename the fully prepared staging directory into the original live workspace path, and finally asynchronously delete the old workspace. This guarantees POSIX atomicity for the entire project state without throwing \`ENOTEMPTY\` or \`EBUSY\`.`
);
content = content.replace(
  /Once the staging directory is fully built, validated, and hashed, the `swapWorkspaceAtomically` will execute a single, instantaneous OS-level `fs\.renameSync` to swap the staged assets into the live workspace\. For individual files, `fs\.renameSync` provides O\(1\) atomicity\. For non-empty directories like `node_modules`, the CLI acknowledges that true O\(1\) atomicity is impossible via POSIX rename due to `ENOTEMPTY`\. [\s\S]*?but guarantees POSIX atomicity\./,
  `Once the staging directory is fully built, validated, and hashed, the \`swapWorkspaceAtomically\` mechanism will execute a rapid sequence of OS-level \`fs.renameSync\` calls: it will first rename the existing live directory to \`.tmp/workspace_old_[UUID]\`, then immediately rename the staging directory into the live path. This avoids POSIX \`ENOTEMPTY\` errors on non-empty directories while minimizing the transient state where the workspace is absent.`
);
content = content.replace(
  /The synchronous boot-time sweep will iterate through all `\.tmp\/staging-\*`, `\.tmp\/failed-\*`, and orphaned `node_modules_old` directories and attempt removal\./,
  `The synchronous boot-time sweep will iterate through all \`.tmp/staging-*\`, \`.tmp/failed-*\`, and orphaned \`.tmp/workspace_old_*\` directories and attempt removal.`
);
content = content.replace(
  /Implement a final, instantaneous `fs\.renameSync` phase to atomically swap the validated staging directory into the live workspace\./,
  `Implement a rapid sequence of \`fs.renameSync\` calls to swap the validated staging directory into the live workspace by first moving the old workspace to a temporary \`_old\` path.`
);

// 3. Security: Secret Scanner Evasion via Line Truncation & Ignore Lists
content = content.replace(
  /explicitly configuring the scanner to ignore `node_modules` and `\.git` paths to prevent massive CPU\/IO event loop blocking\./,
  `explicitly configuring the scanner to ignore paths listed in \`.gitignore\` or identified via \`git check-ignore\` to prevent massive CPU/IO event loop blocking, ensuring tracked secrets are never skipped.`
);

// 4. Correctness: EPIPE swallowing hiding legitimate failures
content = content.replace(
  /- \[ \] \*\*Task 3\.1\*\*: Modify the CLI entrypoint to bind `\.on\('error'\)` handlers to `process\.stdout` and `process\.stderr` that specifically swallow `EPIPE` errors ONLY during JSON payload emission, ensuring legitimate streaming failures in other contexts are not masked\./,
  `- [ ] **Task 3.1**: Modify the \`TerminalPresenter\` to bind \`.on('error')\` handlers to \`process.stdout\` that specifically swallow \`EPIPE\` errors ONLY during JSON payload emission, ensuring legitimate streaming failures in other contexts are not masked.`
);

// 5. Correctness: Uncaught ENOENT on .tmp validation (TOCTOU)
content = content.replace(
  /Before creating the `\[UUID\]` subdirectory, the CLI MUST assert via `fs\.promises\.lstat` that the base `\.tmp` directory is a physical directory, explicitly catching `ENOENT` to safely create the `\.tmp` directory on fresh clones, and strictly rejecting symlinks to prevent traversal escapes\. It must explicitly enforce `fs\.promises\.mkdir\(\.\.\., \{ mode: 0o700 \}\)`/,
  `Before creating the \`[UUID]\` subdirectory, the CLI MUST directly execute \`fs.promises.mkdir(..., { recursive: true, mode: 0o700 })\`, relying on the operating system's native atomic filesystem operations to handle existing directories securely, rather than introducing a TOCTOU vulnerability via \`lstat\` checks.`
);

// 6. Security: Log Sanitization Fragility in CI Dumps
content = content.replace(
  /the CLI MUST perform a fast, deterministic string-replacement pass \(masking the specific known `--userconfig` token\) before writing `stderr\.log` and `stdout\.log` to the CI artifact dump\./,
  `the CLI MUST implement robust, regex-based secret scanning or entropy checks on the log outputs (masking all detected secrets and the specific known \`--userconfig\` token) before writing \`stderr.log\` and \`stdout.log\` to the CI artifact dump, rather than relying solely on exact token string replacement.`
);
content = content.replace(
  /To prevent ReDoS and avoid cross-platform native compilation failures \(e\.g\., `node-gyp` on M-series Macs\), the redactor MUST utilize simple, static string replacements \(`\.replaceAll\(\)`\) for known rigid secret prefixes or a strictly bounded JS regex engine fallback, strictly avoiding expensive high-entropy math on large logs before writing the CI artifact logs\./,
  `To prevent ReDoS and avoid cross-platform native compilation failures (e.g., \`node-gyp\` on M-series Macs), the redactor MUST utilize robust, bounded JS regex engines or fast entropy checks, avoiding naive string replacements that fail on URL-encoded or wrapped secrets.`
);

// 7. Security: Persistent Credentials on Disk Post-SIGKILL
content = content.replace(
  /Because environment variables injected into `spawn` leak via `\/proc\/<pid>\/environ`, the CLI MUST create an ephemeral `\.npmrc` file inside the isolated `\.tmp\/\[UUID\]` staging directory with strict `0600` permissions containing the auth token\./,
  `Because environment variables injected into \`spawn\` leak via \`/proc/<pid>/environ\`, the CLI MUST create an ephemeral \`.npmrc\` file with strict \`0600\` permissions exclusively in an OS-level memory-backed filesystem (e.g., \`/dev/shm\` on Linux or \`process.env.RUNNER_TEMP\` in CI) rather than the local workspace. This guarantees the OS automatically destroys the credential upon container termination, system reboot, or catastrophic SIGKILL.`
);
content = content.replace(
  /To mitigate indefinite persistence of plaintext tokens in the event of an un-trappable SIGKILL crash, the CLI MUST prioritize creating the ephemeral `\.npmrc` in an OS-level `tmpfs` \(e\.g\., `\/dev\/shm` on Linux\) if available, falling back to the workspace `\.tmp\/\[UUID\]`\. The boot-time garbage collector MUST explicitly prioritize wiping `\.npmrc` files in orphaned directories before any other operations\. Ensure the root `\.tmp\/` directory is strictly added to `\.gitignore` to prevent accidental commits\./,
  `To mitigate indefinite persistence of plaintext tokens in the event of an un-trappable SIGKILL crash, the ephemeral \`.npmrc\` MUST NOT be written to the local workspace disk.`
);

// 8. Maintainability: Naming Obfuscation (CliOutputRouter -> TerminalPresenter)
content = content.replace(/CliOutputRouter/g, 'TerminalPresenter');

// 9. Maintainability: Boot-time GC sweep coupled to CLI critical path
content = content.replace(
  /implement a fast, synchronous boot-time check strictly for unresolved staging states \(blocking execution if found\)[\s\S]*?by performing a simple synchronous boot-time sweep of expired directories\./,
  `perform an asynchronous, non-blocking sweep of expired \`.tmp/\` directories in the background during CLI initialization, ensuring the critical execution path is never blocked by garbage collection I/O.`
);
content = content.replace(
  /The synchronous boot-time sweep will iterate through all `\.tmp\/staging-\*`, `\.tmp\/failed-\*`, and orphaned `\.tmp\/workspace_old_\*` directories and attempt removal\./,
  `The asynchronous boot-time sweep will iterate through all \`.tmp/staging-*\`, \`.tmp/failed-*\`, and orphaned \`.tmp/workspace_old_*\` directories and attempt removal in the background.`
);
content = content.replace(
  /Implement a fast, synchronous boot-time check of the `\.tmp\/` directory using `fs\.readdirSync` with the `withFileTypes: true` option\. The system is inherently self-healing and requires no user intervention; orphaned directories matching the TTL expiry will be synchronously pruned on boot\./,
  `Implement an asynchronous, non-blocking boot-time sweep of the \`.tmp/\` directory using \`fs.promises.readdir\`. The system is inherently self-healing and requires no user intervention; orphaned directories matching the TTL expiry will be asynchronously pruned in the background without blocking the main execution thread.`
);
content = content.replace(/synchronous boot-time sweep/g, 'asynchronous boot-time sweep');

// 10. Maintainability: Remove Node-re2 native dependency mandate
content = content.replace(
  /utilizing a non-backtracking regex engine \(e\.g\., Google's RE2 via `node-re2`\) or a fixed-window entropy scanner to securely scan long lines \(e\.g\., minified files\) without ReDoS risks or arbitrary truncation blind spots\./,
  `utilizing a fixed-window streaming scanner, fast entropy checks, or safely bounded JS regex to securely scan long lines (e.g., minified files) without ReDoS risks or arbitrary truncation blind spots, explicitly avoiding native C++ dependencies like \`node-re2\` to ensure cross-platform compatibility.`
);
content = content.replace(
  /Implement the chunked stream secret scanner \(using node-re2 or entropy checks for long lines\)/,
  `Implement the chunked stream secret scanner (using fixed-window boundaries or entropy checks for long lines)`
);

// 11. Maintainability: Error Prototype Sanitizer 
content = content.replace(
  /The CLI MUST implement an aggressive `Error` prototype sanitizer that strips `process\.env` and authentication headers from error objects before they are stringified to `stacktrace\.txt` to prevent internal env leakage\./,
  `The CLI MUST implement an error sanitizer that explicitly strips \`process.env\` and authentication headers from specific HTTP client error objects (e.g., Axios config) before they are stringified to \`stacktrace.txt\`, avoiding global \`Error\` prototype mutations.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update complete.');
