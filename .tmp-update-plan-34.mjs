import fs from 'fs';

let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Secret Scanning Timing & Simplification
content = content.replace(
  /the CLI will implement a fast, native secret-scanning step within the CLI pipeline stream \*before\* executing the commit[\s\S]*?This neutralizes the immediate risk of an accidental commit while safely preserving the user's working tree edits\./,
  `the CLI will implement a fast, native secret-scanning step *during the staging phase*, strictly before the atomic swap to the live workspace. To prevent V8 Out-Of-Memory (OOM) crashes and premature abstraction, the scanner will read files into memory with a hard 50MB limit per file, explicitly avoiding complex chunked stream overlaps. If a secret is detected, the CLI MUST loudly fail the execution with a terminal warning pinpointing the file and abort the staging process, guaranteeing the secret never enters the live workspace or Git index.`
);
content = content.replace(
  /- \[ \] \*\*Task 4\.2\*\*: Inject `git diff --cached --quiet` checks prior to `git commit`\. Implement the native Node\.js chunked stream secret scanner\. If a secret is detected, execute `git restore --staged <file>` to immediately unstage the offending file and abort the CLI run\./,
  `- [ ] **Task 4.2**: Inject \`git diff --cached --quiet\` checks prior to \`git commit\`. Implement the native Node.js secret scanner (50MB file limit) during the \`--stage\` phase inside the \`.tmp/\` directory. If a secret is detected, immediately abort the CLI run before the atomic swap.`
);

// 2. EBUSY Abandonment Crash Fix
content = content.replace(
  /If an `EBUSY` lock is encountered, the CLI will abandon the directory, logging a non-fatal warning, ensuring the execution loop completes instantly without blocking the user or crashing the process on OS-level locks\./,
  `If an \`EBUSY\` lock is encountered, the CLI will simply abandon the directory in place without attempting to rename or move it, logging a non-fatal warning. This ensures the execution loop completes instantly without throwing \`EPERM\` on locked directories. Future boot-time sweeps and \`git worktree prune\` will clean it up naturally once locks are released.`
);
content = content.replace(
  /The CLI will durably track these by explicitly namespacing abandoned worktrees \(e\.g\., `\.tmp\/abandoned-worktree-\[UUID\]`\)\. The synchronous boot-time sweep will perform a fast, O\(1\) string-filtering pass on the root `\.tmp\/` directory array to identify them\. It MUST validate target paths against a strict regex \(e\.g\., `\/\^abandoned-worktree-\[a-f0-9-\]\+\$\/`\) before deletion\./,
  `The synchronous boot-time sweep will simply iterate through all \`.tmp/staging-*\` and \`.tmp/failed-*\` directories and attempt removal.`
);

// 3. NPM Credentials & Security Fixes
content = content.replace(
  /Inject the `NPM_CONFIG__AUTH` token strictly into the `child_process\.spawn` options `env` object for the `npm ci` child process\./,
  `Because environment variables injected into \`spawn\` are visible via \`/proc/<pid>/environ\`, the CLI MUST create an ephemeral \`.npmrc\` file inside the isolated \`.tmp/[UUID]\` staging directory with strict \`0600\` permissions containing the auth token. This file MUST be explicitly deleted before the atomic swap.`
);
content = content.replace(
  /append `--logs-max=0` to ensure crash dumps do not write environment variables to disk, and enforce `--ignore-scripts` and `--globalconfig=\/dev\/null` to prevent local registry hijacking and child-process exfiltration\./,
  `append \`--logs-max=0\`, and enforce \`--ignore-scripts\`, \`--globalconfig=/dev/null\`, and \`--userconfig=.npmrc\` (pointing to the isolated ephemeral file) to prevent local workspace \`.npmrc\` files from hijacking the registry URL or leaking credentials.`
);
content = content.replace(
  /Instead, the CLI must inject the authentication token strictly into the `child_process\.spawn` options `env` object specifically scoped for the isolated `npm ci` call, bypassing the disk entirely\. This aligns with the crash-only lifecycle: if the CLI is SIGINTed, no plaintext secrets are orphaned on disk\./,
  `Because environment variables injected into \`spawn\` leak via \`/proc/<pid>/environ\`, the CLI MUST create an ephemeral \`.npmrc\` file with strict \`0600\` permissions exclusively inside the highly scoped, workspace-local \`.tmp/[UUID]\` staging directory. By strictly deleting this file before the atomic swap, and relying on the boot-time GC sweep to clean up orphaned \`.tmp/\` directories after a SIGINT crash, the design safely prevents credential leaks.`
);
content = content.replace(
  /it will extract the token and pass it securely via the `spawn` options `env` object to the isolated `npm ci` process, bypassing the disk\./,
  `it will securely translate it to an ephemeral \`--userconfig\` file stored in the staging directory.`
);

// 4. Lockfile Deadlock & Async GC Contradiction
content = content.replace(
  /checked via a near-zero latency `fs\.existsSync` check for a global `\.openspec-pending-staging` lockfile written to the workspace root at the start of a transaction and deleted upon success\. This allows the GC to sweep `\.tmp\/` asynchronously without degrading user experience\. After the check, it will perform a simple synchronous boot-time sweep\./,
  `by performing a simple synchronous boot-time sweep of expired directories. No global lockfiles are used, preventing permanent UX deadlocks if the CLI crashes mid-run.`
);

// 5. node_modules swap race condition
content = content.replace(
  /It will execute a sequential move of the old directory to a `\.tmp\/trash-\[UUID\]` path, rename the new directory into place, and asynchronously delete the trash\./,
  `It will execute a sequential move of the old directory to \`.old_node_modules\`, rename the new directory into place, and asynchronously delete \`.old_node_modules\` to minimize the race condition window.`
);

// 6. Dependency Hydration Performance
content = content.replace(
  /If `node_modules` exists but the hash drifted, the CLI executes `npm install --prefer-offline` within the staging directory \(by copying `package\.json` and `package-lock\.json` and running install, then atomically swapping the updated `node_modules` into the live workspace\)/,
  `If \`node_modules\` exists but the hash drifted, the CLI executes \`npm install --prefer-offline\` within the staging directory (by first copying the existing \`node_modules\`, \`package.json\`, and \`package-lock.json\` to preserve the cache, running install, then atomically swapping the updated \`node_modules\` into the live workspace)`
);

// 7. Maintainability Naming
content = content.replace(/FsExecutor/g, 'WorkspaceTransaction');
content = content.replace(/StdioRouter/g, 'JsonStreamBoundary');

// 8. CI Artifact Leakage
content = content.replace(
  /It will ONLY export `stderr\.log`, `stdout\.log`, `stacktrace\.txt`, and the `openspec\.json` metadata file\./,
  `It will ONLY export \`stderr.log\`, \`stdout.log\`, \`stacktrace.txt\`, and the \`openspec.json\` metadata file. To prevent secret leakage in these exported logs, the CLI MUST pipe stdout/stderr through a redacting stream that masks entropy strings and known secret formats before writing the CI artifact logs.`
);

// 9. Payload DOS
content = content.replace(
  /To prevent silent disk inode exhaustion on long-living headless CI runners/,
  `To prevent Denial of Service (DoS) via unbounded payloads, the CLI MUST enforce a hard 50MB byte-size ceiling on the payload serialization stream, throwing \`E_PAYLOAD_TOO_LARGE\` if breached. To prevent silent disk inode exhaustion on long-living headless CI runners`
);

// 10. Zod Passthrough
content = content.replace(
  /the CLI MUST explicitly strip all unknown keys from the options object before executing any external processes/,
  `the CLI MUST explicitly strip all unknown keys from the options object immediately after the Zod parsing boundary (before any core business logic evaluates it) to prevent Prototype Pollution or argument injection vulnerabilities,`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update complete.');
