import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Correctness: Fix Catastrophic Data Loss of .git Repository During Atomic Swap (Missing Workspace State Window)
content = content.replace(
  /it will first rename the live workspace directory to a unique `\.tmp\/workspace_old_\[UUID\]` suffix \(where `\[UUID\]` is strictly generated via `crypto\.randomUUID\(\)` to prevent predictable path creation and `ENOTEMPTY` blocking attacks\), then rename the fully prepared staging directory into the original live workspace path, and finally asynchronously delete the old workspace\. This guarantees POSIX atomicity for the entire project state without throwing `ENOTEMPTY` or `EBUSY`\./,
  `it will rename individual mutated files and directories (e.g., \`src/\`, \`package.json\`, \`node_modules/\`) from the staging directory into the live workspace, replacing the old assets. For non-empty directories like \`node_modules\`, it will rename the live directory to a unique \`.tmp/workspace_old_[UUID]\` suffix, then immediately rename the staging directory into place, and finally asynchronously delete the old directory. It MUST NOT rename the entire root workspace directory, as this would delete the \`.git/\` object database and cause a missing workspace state window.`
);

// 2. Correctness: Fix TOCTOU vulnerability retained via `--stdin-paths`
content = content.replace(
  /To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will ingest the files directly into the Git object database \*during\* the hash phase using `git hash-object -w --stdin-paths` \(which returns the blob ID\)\. In the `--apply` phase, the CLI will update the Git index directly using that exact blob ID \(`git update-index --cacheinfo`\)/,
  `To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will pipe the exact in-memory validated byte buffer (used during the hash and secret scanning phase) directly into \`git hash-object -w --stdin\` to ingest the blobs into the Git object database. In the \`--apply\` phase, the CLI will update the Git index directly using those exact blob IDs (\`git update-index --index-info\` via stdin stream)`
);

// 3. Correctness: Fix Missing Dependency Hydration Trigger for package.json only edits
content = content.replace(
  /if the SHA-256 hash of `package-lock\.json` differs from a cached `\.openspec-deps-hash` file stored inside `node_modules`\./,
  `if the combined SHA-256 hash of \`package.json\` and \`package-lock.json\` differs from a cached \`.openspec-deps-hash\` file stored in the \`.openspec/\` cache directory.`
);

// 4. Correctness: Fix Brittle stderr string matching fails across i18n locales
content = content.replace(
  /The teardown sequence MUST perform a loose string inclusion check on `stderr` for known lock keywords \(e\.g\., 'busy', 'permission', 'lock'\) to differentiate between expected OS locks and fatal environment errors \(e\.g\., missing git binary\), rather than blindly swallowing all non-zero exit codes\./,
  `The teardown sequence MUST force \`LC_ALL=C\` in the child process \`spawn\` environment to guarantee POSIX standard English \`stderr\` output, enabling a reliable string inclusion check for known lock keywords (e.g., 'busy', 'permission', 'lock') to differentiate expected OS locks from fatal errors.`
);

// 5. Correctness/Security: Fix Secret Scanner Bypass via Git Index Discrepancy
content = content.replace(
  /explicitly configuring the scanner to ignore paths listed in `\.gitignore` or identified via `git check-ignore`, and strictly hardcoding `\.git\/` and `node_modules\/` into the global exclusion matrix to prevent immediate V8 OOM crashes and extreme event loop blockage from scanning massive binary Git packfiles\./,
  `operating exclusively on the exact list of files staged for commit in the index (e.g., using \`git diff --cached --name-only\`). It MUST NOT exclude files based on \`.gitignore\` rules if they are actively staged for commit, preventing bypasses where a secret is added with \`git add -f\` and then gitignored. It must explicitly hardcode \`.git/\` and \`node_modules/\` into a global exclusion matrix to prevent V8 OOM crashes.`
);

// 6. Security: Uncatchable SIGKILL leaks ephemeral .npmrc credentials
content = content.replace(
  /Because environment variables injected into `spawn` leak via `\/proc\/<pid>\/environ`, the CLI MUST create an ephemeral `\.npmrc` file with strict `0600` permissions exclusively in an OS-level memory-backed filesystem \(e\.g\., `\/dev\/shm` on Linux or `process\.env\.RUNNER_TEMP` in CI\) rather than the local workspace\. This guarantees the OS automatically destroys the credential upon container termination, system reboot, or catastrophic SIGKILL\./,
  `Because environment variables injected into \`spawn\` leak via \`/proc/<pid>/environ\`, the CLI MUST NOT write an ephemeral \`.npmrc\` file to disk. Instead, the CLI MUST securely inject the token into the \`npm ci\` child process via \`stdin\` or a secure IPC channel, entirely bypassing disk writes and eliminating the risk of plaintext credentials persisting after a SIGKILL or OOM crash.`
);
content = content.replace(
  /To mitigate indefinite persistence of plaintext tokens in the event of an un-trappable SIGKILL crash, the ephemeral `\.npmrc` MUST NOT be written to the local workspace disk\./,
  `To mitigate indefinite persistence of plaintext tokens in the event of an un-trappable SIGKILL crash, the CLI MUST NOT write an ephemeral \`.npmrc\` file to disk at all, instead injecting credentials via \`stdin\` or secure IPC.`
);

// 7. Security: Fix Symlink Integrity Bypass & LFI Risk
content = content.replace(
  /the CLI MUST compute a SHA-256 hash of the live `package\.json` before staging \(using a bounded `fs\.createReadStream` piped into `crypto\.createHash\(\)`, explicitly rejecting abnormally large files to prevent V8 OOM crashes\)/,
  `the CLI MUST enforce \`fs.promises.lstat\` before opening any read streams to reject symlinks, then compute a SHA-256 hash of the live \`package.json\` before staging (using a bounded \`fs.createReadStream\` piped into \`crypto.createHash()\`, explicitly rejecting abnormally large files to prevent V8 OOM crashes)`
);
content = content.replace(
  /To prevent destroying uncommitted manual edits made during the TOCTOU window, the CLI will stream all paths directly into `stdin` while strictly respecting stream backpressure \(using `stream\.pipeline`\)\./,
  `To prevent destroying uncommitted manual edits made during the TOCTOU window, the CLI MUST enforce \`fs.lstat\` before reading. If a symlink is detected, it must hash the symlink's target path string to maintain parity with Git's object model. The CLI will stream the validated byte buffers directly into \`stdin\` while strictly respecting stream backpressure.`
);

// 8. Maintainability: Fix Dead Code / Document Duplication
content = content.replace(
  /To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will pipe the exact in-memory validated byte buffer \(used during the hash and secret scanning phase\) directly into `git hash-object -w --stdin` to ingest the blobs into the Git object database\. In the `--apply` phase, the CLI will update the Git index directly using those exact blob IDs \(`git update-index --index-info` via stdin stream\), wrapping this operation in a retry loop with \*\*jittered\*\* exponential backoff \(hard-capped at 5 retries and a 500ms maximum delay\) specifically targeting `fatal: Unable to create '\.\.\/\.git\/index\.lock': File exists` errors to ensure stability against IDE background watchers\. Crucially, updating the index does not update the working tree; therefore, the CLI MUST execute the `commitStagedWorkspace` step immediately after the index update to synchronize the physical files with the new index state, preventing a desync where git reports staged changes that don't exist in the working directory\./,
  `` // Remove the duplicated paragraph
);

// 9. Maintainability: Naming Obfuscation (OutputRouter -> TerminalPresenter again, it was originally correct)
// No, the subagents specifically complained about 'TerminalPresenter' obscuring intent. 
// "OutputRouter" is better, but one subagent complained. Let's stick with JsonStreamBoundary as originally intended but simplified? 
// No, standard `OutputFormatter` or `CliOutputRouter` is best. Let's use `TerminalIOController`.
content = content.replace(/OutputRouter/g, 'TerminalIOController');

// 10. Maintainability: Fix Conflicting terminology for CI artifacts
content = content.replace(/\.openspec-staging-dump/g, '.openspec-failed-artifacts');

// 11. Security: Path Resolution Zero-Byte Injection
content = content.replace(
  /build the `getSandboxPath` utility to enforce absolute path confinement within staging contexts\./,
  `build the \`getSandboxPath\` utility to enforce absolute path confinement within staging contexts, explicitly sanitizing and rejecting zero-byte (\`\\0\`) characters and Unicode normalization bypasses to prevent C-level \`libc\` path truncation vulnerabilities.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update complete.');
