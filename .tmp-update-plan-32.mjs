import fs from 'fs';

let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// Fix 1: Crash-Only vs Disk-Based Secrets Paradox (Sec 3.8 & Task 4.7)
// Remove ephemeral .npmrc on disk, enforce process.env via spawn.
content = content.replace(
  /### 3\.8 Security & Credential Hygiene[\s\S]*?Furthermore,/g,
  `### 3.8 Security & Credential Hygiene\n\nTo prevent accidental leakage of sensitive authentication tokens during automated staging, the CLI will **never** write \`.npmrc\` files containing secrets to the worktree disk. To prevent untrusted child processes from inheriting and exfiltrating credentials via \`/proc/<pid>/environ\` (which can leak to arbitrary child processes), the CLI MUST NOT inject tokens into the global \`process.env\`. Instead, the CLI must inject the authentication token strictly into the \`child_process.spawn\` options \`env\` object specifically scoped for the isolated \`npm ci\` call, bypassing the disk entirely. This aligns with the crash-only lifecycle: if the CLI is SIGINTed, no plaintext secrets are orphaned on disk.\n\nFurthermore,`
);

content = content.replace(
  /- \[ \] \*\*Task 4\.7\*\*: Ensure \.npmrc credentials are never written to disk or injected into process\.env\.[\s\S]*?(?=\n\n## 5\. API Contracts & Breaking Changes)/g,
  `- [ ] **Task 4.7**: Ensure NPM registry credentials are never written to disk or injected into the global \`process.env\`. Inject the \`NPM_CONFIG__AUTH\` token strictly into the \`child_process.spawn\` options \`env\` object for the \`npm ci\` child process. Scope the token strictly to the target registry (e.g., \`//registry.npmjs.org/:_authToken=token\`) to prevent transmission to arbitrary registries. Append \`--logs-max=0\` to ensure crash dumps do not write environment variables to disk, and enforce \`--ignore-scripts\` and \`--globalconfig=/dev/null\` to prevent local registry hijacking and child-process exfiltration.`
);

// Fix 2: Secret Scanning Delegation & Vulnerabilities (Sec 3.7 & Task 4.2)
content = content.replace(
  /the CLI will implement a fast, native secret-scanning regex step within the CLI pipeline memory buffer \*before\* executing the commit\. To prevent V8 Out-Of-Memory \(OOM\) crashes and CPU starvation, the scanner MUST explicitly skip binary files and files exceeding a 1MB size threshold\. If a secret is detected, the CLI will loudly fail the execution with a glaring terminal warning pinpointing the file, and MUST loudly fail the execution with a glaring terminal warning pinpointing the file, but MUST NOT forcefully unstage \(`git restore --staged <file>`\) the file, as doing so permanently destroys any legitimate, previously staged changes the user made prior to the AI's secret insertion\. The user must manually scrub the secret before retrying\. from accidentally committing it in a subsequent generic commit\. The user must then manually scrub the secret before retrying\./g,
  `the CLI will implement a fast, native secret-scanning step within the CLI pipeline stream *before* executing the commit. To prevent V8 Out-Of-Memory (OOM) crashes while guaranteeing 100% payload coverage, the scanner MUST use a chunked stream scanner (e.g., reading in 64KB buffers with a small overlap) rather than loading entire files into memory, explicitly avoiding arbitrary file size bypasses (like skipping >1MB files). If a secret is detected, the CLI MUST loudly fail the execution with a terminal warning pinpointing the file, and MUST immediately unstage the file from the git index using \`git restore --staged <file>\`. This neutralizes the immediate risk of an accidental commit while safely preserving the user's working tree edits.`
);

content = content.replace(
  /- \[ \] \*\*Task 4\.2\*\*: Inject `git diff --cached --quiet` checks prior to `git commit`\. The CLI will intentionally delegate deep secret scanning to a pre-compiled, established binary \(like `gitleaks` or a CI pipeline check\), acknowledging that building a custom streaming C\+\+ engine inside Node\.js is a premature abstraction\. Execute `git commit --no-verify` \(or provide an `--ignore-hooks` opt-out\) to bypass remaining slow local hooks\./g,
  `- [ ] **Task 4.2**: Inject \`git diff --cached --quiet\` checks prior to \`git commit\`. Implement the native Node.js chunked stream secret scanner. If a secret is detected, execute \`git restore --staged <file>\` to immediately unstage the offending file and abort the CLI run. Execute \`git commit --no-verify\` (or provide an \`--ignore-hooks\` opt-out) to bypass remaining slow local hooks, relying on the native stream scanner as the pre-commit safety net.`
);

// Fix 3: TOCTOU Directory Traversal via realpath (Sec 3.3)
content = content.replace(
  /It is validated by calling `fs\.promises\.realpath\(\)` on the final target directory \(or its closest existing parent\) and ensuring the resolved physical path `startsWith\(allowedBase\)` and strictly checking that it is either exactly `allowedBase` or that the next character is `path\.sep` to correctly validate root claim check directories without trailing slash errors\. This prevents logical symlink bypasses within the sandbox\. to securely prevent symlink traversal\./g,
  `To securely prevent TOCTOU symlink traversal attacks where an intermediate directory is swapped with a symlink during resolution, the CLI MUST reject any paths containing symlinks entirely, or iteratively resolve and enforce \`mkdir\` on every segment of the path sequentially to ensure no intermediate symlinks are injected. The final physical path MUST exactly start with the \`allowedBase\` and a \`path.sep\`.`
);

// Fix 4: Artifact Dump Secret Leakage in CI Pipelines (Task 2.3)
content = content.replace(
  /- \[ \] \*\*Task 2\.3\*\*: If `process\.env\.CI` is true and a failure occurs \*before\* the atomic swap, automatically move the failed `\.tmp\/\[UUID\]` directory to `\.openspec-failed-artifacts\/\[UUID\]` to preserve the exact state for deterministic CI debugging\. The CLI MUST run the native secret scanner over the directory \*during\* the copy operation to `\.openspec-failed-artifacts\/`, forcefully aborting the copy of any specific file that triggers a signature match \(or matches a strict deny-list of `\.env\*` and `\.\*rc` files\) to guarantee secrets are never exported to CI systems\./g,
  `- [ ] **Task 2.3**: If \`process.env.CI\` is true and a failure occurs *before* the atomic swap, preserve state for CI debugging. However, because regex-based secret scrubbing of entire source trees is brittle and prone to leakage in public CI artifacts, the CLI MUST strictly allow-list the files it exports to \`.openspec-failed-artifacts/[UUID]\`. It will ONLY export \`stderr.log\`, \`stdout.log\`, \`stacktrace.txt\`, and the \`openspec.json\` metadata file. It MUST NOT dump the raw source code or arbitrary files from the failed staging directory to CI artifacts.`
);

// Fix 5: Idempotent Auto-Recovery / openspec recover Contradiction (Sec 3.5, Task 2.4, 2.5)
content = content.replace(
  /If the GC detects an orphaned directory containing an unresolved application staging directory, the CLI will explicitly block execution, prevent pruning, and demand the user run a new `openspec recover` command\./g,
  `If the synchronous boot-time sweep detects orphaned staging directories, it will simply log a debug message and proceed with pruning them.`
);

content = content.replace(
  /- \[ \] \*\*Task 2\.4\*\*: Implement the `openspec recover` command to handle orphaned staging directorys explicitly, The command MUST immediately no-op or error out if run in a CI environment \(`process\.env\.CI`\), as CI environments utilize the separate artifact dump strategy\.\n/g,
  ``
);

content = content.replace(
  /- \[ \] \*\*Task 2\.5\*\*: Update the Boot-Time check via `fs\.promises\.opendir`\. Block execution if the `\.openspec-pending-staging` lockfile is active \(explicitly exempting the `recover` command itself from this check to prevent deadlocks\); instead, the system is inherently self-healing and requires no user intervention\. Add a `--force-clear-staging directory` flag and a 14-day absolute TTL\./g,
  `- [ ] **Task 2.4**: Implement a fast, synchronous boot-time check of the \`.tmp/\` directory using \`fs.promises.opendir\`. The system is inherently self-healing and requires no user intervention; orphaned directories matching the TTL expiry will be synchronously pruned on boot.`
);

// Fix 6: True O(1) atomicity is impossible for non-empty directory swaps (Sec 3.2)
content = content.replace(
  /To handle POSIX `ENOTEMPTY` errors when swapping directories \(like `node_modules`\), the CLI MUST use a robust, platform-aware atomic directory swap utility \(e\.g\., `fs-extra` move with overwrite, or a sequence that securely moves the old directory to a trash path before renaming the new one, rolling back if the second rename fails\)\./g,
  `For individual files, \`fs.renameSync\` provides O(1) atomicity. For non-empty directories like \`node_modules\`, the CLI acknowledges that true O(1) atomicity is impossible via POSIX rename due to \`ENOTEMPTY\`. It will execute a sequential move of the old directory to a \`.tmp/trash-[UUID]\` path, rename the new directory into place, and asynchronously delete the trash. If interrupted during this sequence, the next boot-time sweep will detect the missing or trashed directory and simply trigger a clean \`npm ci\`, ensuring self-healing recovery.`
);

// Fix 7 & 8: Background GC Daemon over-engineering and regex mismatch (Task 4.4, 4.5)
content = content.replace(
  /- \[ \] \*\*Task 4\.4\*\*: Update `cleanupOldStaged` to use `git worktree remove <path> --force`[\s\S]*?It MUST validate target paths against a strict regex \(e\.g\., `\/\^staging-\\d\+-\[a-f0-9\\-\]\+\$\/`\) before deletion to prevent arbitrary file deletion\. It will forcefully delete these physical directories once OS locks are released and execute `git worktree prune` to safely clean up the orphaned administrative state, ensuring the execution loop completes instantly without blocking the user or forcefully killing OS-level processes\./g,
  `- [ ] **Task 4.4**: Update \`cleanupOldStaged\` to use \`git worktree remove <path> --force\`. The CLI will durably track these by explicitly namespacing abandoned worktrees (e.g., \`.tmp/abandoned-worktree-[UUID]\`). The synchronous boot-time sweep will perform a fast, O(1) string-filtering pass on the root \`.tmp/\` directory array to identify them. It MUST validate target paths against a strict regex (e.g., \`/^abandoned-worktree-[a-f0-9\-]+$/\`) before deletion. It will forcefully delete these physical directories via Node's \`fs.promises.rm(target, { recursive: true, force: true })\` and execute \`git worktree prune\` to safely clean up.`
);

content = content.replace(
  /- \[ \] \*\*Task 4\.5\*\*: Migrate transient directories to `\.tmp\/` using TTL-encoded and namespaced paths[\s\S]*?enforcing a 7-day TTL on staging directories and a 14-day TTL on `staging-\*` directories\./g,
  `- [ ] **Task 4.5**: Replace the detached background child process garbage collector with a simple, synchronous boot-time sweep of the \`.tmp/\` directory. This eliminates extreme over-engineering, PID wrap-around deadlocks, heartbeat lockfiles, and 'thundering herd' contentions. The boot sweep will only delete TTL-encoded directories (e.g., \`.tmp/staging-[ExpiryTimestamp]-[UUID]\`) that have expired, explicitly swallowing \`ENOENT\`, \`ENOTEMPTY\`, \`EBUSY\`, and \`EPERM\` exceptions.`
);

// Fix 9: Naming obfuscation: claimCheckPath -> payloadDumpPath, --claim-check-dir -> --payload-dump-dir
content = content.replace(/--claim-check-dir/g, '--payload-dump-dir');
content = content.replace(/claimCheckPath/g, 'payloadDumpPath');
content = content.replace(/Claim Check/g, 'Payload Dump');
content = content.replace(/claim check/g, 'payload dump');

// Fix 10: Unnecessary indirection: TerminalPresenter -> StdioRouter
content = content.replace(/TerminalPresenter/g, 'StdioRouter');

// Fix 11: Git hash-object SHA-256 issue (Sec 3.6 & Task 4.6)
content = content.replace(
  /To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will ingest the files directly into the Git object database \*during\* the hash phase using `git hash-object -w --stdin-paths` \(which returns the blob ID\)\. In the `--apply` phase, the CLI will update the Git index directly using that exact blob ID \(`git update-index --cacheinfo`\), wrapping this operation in a retry loop with \*\*jittered\*\* exponential backoff \(hard-capped at 5 retries and a 500ms maximum delay\) specifically targeting `fatal: Unable to create '\.\.\/\.git\/index\.lock': File exists` errors to ensure stability against IDE background watchers\.\. To prevent destroying uncommitted manual edits made during the TOCTOU window, the CLI will compare the working tree file hash \(using a single batch `git hash-object --stdin-paths` SHA-256 content hashing process, completely eliminating O\(N\) `fs\.stat` I\/O bottlenecks\)\. The CLI will stream all paths directly into `stdin` while strictly respecting stream backpressure \(using `stream\.pipeline`\)\. It must actively drain the child process `stdout` stream strictly in parallel with the `stdin` pipeline \(e\.g\., using `Promise\.all\(\[stream\.pipeline\(\.\.\.\), consumeStdout\(\.\.\.\)\]\)`\) to prevent OS IPC pipe buffer deadlocks\. \(avoiding `argv` `E2BIG` limits entirely\) to bypass Node memory limits without incurring child-process spawn overhead, strictly avoiding brittle `mtime` checks\) against the index hash\./g,
  `To eliminate TOCTOU race conditions where files are modified between staging and apply phases, the CLI will compare the working tree file hash against the staging token using native Node.js \`crypto.createHash('sha256')\` streaming reads, rather than \`git hash-object\` (which computes incompatible Git blob hashes and introduces OS IPC pipe buffer deadlocks). The CLI will stream file contents through SHA-256 hashers to detect drift.`
);

content = content.replace(
  /- \[ \] \*\*Task 4\.6\*\*: Implement atomic TOCTOU prevention by using `git hash-object -w --stdin-paths` during staging to generate blob IDs, and `git update-index --cacheinfo` during the apply phase to safely mutate the index\. The CLI must explicitly verify working tree parity \(detecting manual edits\) and safely abort the transaction if drift is detected, rather than force-clobbering\./g,
  `- [ ] **Task 4.6**: Implement atomic TOCTOU prevention by using native Node.js \`crypto.createHash('sha256')\` streams to compute working tree file hashes. The CLI must explicitly verify working tree parity against the staging tokens (detecting manual edits) and safely abort the transaction if drift is detected, rather than force-clobbering.`
);

// Fix 12: Dead code / Duplications in 3.2, 3.6, 3.7
content = content.replace(/the `FsExecutor` will implement an staging directory\. \n\n/g, '');

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update complete.');
