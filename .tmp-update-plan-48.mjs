import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Correctness: Fix Catastrophic Data Loss of .git Repository
content = content.replace(
  /it will first rename the existing live directory to `\.tmp\/workspace_old_\[UUID\]` \(using `crypto\.randomUUID\(\)`\), then immediately rename the staging directory into the live path\./,
  `it will swap strictly the required subdirectories (e.g., \`src/\`, \`package.json\`, \`node_modules/\`) rather than renaming the entire root workspace directory. Renaming the entire root directory permanently deletes the \`.git/\` object database and destroys the repository. The swap mechanism MUST explicitly preserve the \`.git/\` directory and other critical hidden files by executing parallel or rapid sequential renames of only the mutated assets.`
);

// 2. Correctness: Fix Auto-Recovery Overwrites Valid State (Race Condition)
content = content.replace(
  /If interrupted during this sequence, the next boot-time sweep MUST explicitly detect the orphaned `\.tmp\/workspace_old_\[UUID\]` directory and restore it back to the live workspace path to prevent catastrophic data loss of the user's uncommitted source code\. This recovery MUST occur before any other operations\./,
  `If interrupted during this sequence, the next boot-time sweep MUST explicitly detect the orphaned \`.tmp/workspace_old_[UUID]\` directory. Before restoring it, the recovery routine MUST verify if the live workspace is already successfully populated with the new state (e.g., via checking a success lockfile or hash parity). If the new state is fully applied, it simply deletes the orphaned backup. If the live state is missing or corrupted, it restores the backup to the live workspace path to prevent data loss. This recovery MUST occur before any other operations.`
);

// 3. Correctness: Fix npm ci Fails if AI Mutates Dependencies
content = content.replace(
  /the CLI executes `npm ci --prefer-offline` within the staging directory \(by first copying the existing `node_modules`, `package\.json`, and `package-lock\.json` to preserve the cache and explicitly preventing `npm install` from mutating the lockfile with unintended silent upgrades\./,
  `the CLI executes \`npm install --prefer-offline\` (if the AI mutated \`package.json\`) or \`npm ci --prefer-offline\` (if only the lockfile drifted) within the staging directory. This allows bounded \`npm install\` execution when \`package.json\` changes are detected without corresponding lockfile changes, enabling the package manager to safely regenerate the lockfile before the atomic swap.`
);

// 4. Correctness: Fix TOCTOU Index Desynchronization
content = content.replace(
  /Crucially, updating the index does not update the working tree; therefore, the CLI MUST execute the `swapWorkspaceAtomically` step immediately after the index update to synchronize the physical files with the new index state, preventing a desync where git reports staged changes that don't exist in the working directory\./,
  `Crucially, updating the index does not update the working tree. The Git index update MUST be treated as part of the atomic transaction. If the process crashes immediately after the filesystem swap but before the Git index is updated, the boot-time check MUST detect this desynchronization and explicitly trigger a \`git reset --mixed\` or prompt the user to prevent subsequent empty commits.`
);

// 5. Correctness: Fix Swallowing Fatal Git Errors as 'EBUSY'
content = content.replace(
  /The teardown sequence MUST rely on a non-zero exit code combined with fallback cleanup logic, rather than parsing Git's `stderr` for the exact string 'EBUSY', as OS-specific human-readable translations vary\./,
  `The teardown sequence MUST perform a loose string inclusion check on \`stderr\` for known lock keywords (e.g., 'busy', 'permission', 'lock') to differentiate between expected OS locks and fatal environment errors (e.g., missing git binary), rather than blindly swallowing all non-zero exit codes.`
);

// 6. Maintainability: Remove Document Duplication
content = content.replace(
  /To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will ingest the files directly into the Git object database \*during\* the hash phase using `git hash-object -w --stdin-paths` \(which returns the valid Git SHA-1 blob ID\)\. In the `--apply` phase, the CLI will update the Git index directly using that exact blob ID \(`git update-index --cacheinfo`\), wrapping this operation in a retry loop with \*\*jittered\*\* exponential backoff \(hard-capped at 5 retries and a 500ms maximum delay\) specifically targeting `fatal: Unable to create '\.\.\/\.git\/index\.lock': File exists` errors to ensure stability against IDE background watchers\. Crucially, updating the index does not update the working tree\. The Git index update MUST be treated as part of the atomic transaction\. If the process crashes immediately after the filesystem swap but before the Git index is updated, the boot-time check MUST detect this desynchronization and explicitly trigger a `git reset --mixed` or prompt the user to prevent subsequent empty commits\.\s*/,
  ``
);

// 7. Security: Fix Buffer Exhaustion Prior to MAX_FILES Check
content = content.replace(
  /Implement a hard `MAX_FILES = 25,000` ceiling to prevent DoS memory exhaustion\./,
  `Implement a hard \`MAX_FILES = 25,000\` ceiling to prevent DoS memory exhaustion. This limit MUST be evaluated *during* the execution of \`git status --porcelain -z\` via stream data chunking, aborting early to prevent buffering the entire massive output into memory before evaluation.`
);
content = content.replace(
  /To prevent Denial of Service \(DoS\) memory exhaustion, the CLI MUST enforce a hard ceiling on the maximum number of changed\/untracked files processed \(e\.g\., `MAX_FILES = 25,000`\)\. If the limit is breached, abort with an `E_TOO_MANY_FILES` error\./,
  `To prevent Denial of Service (DoS) memory exhaustion, the CLI MUST enforce a hard ceiling on the maximum number of changed/untracked files processed (e.g., \`MAX_FILES = 25,000\`) via stream data chunking. If the limit is breached, abort immediately with an \`E_TOO_MANY_FILES\` error.`
);

// 8. Security: Fix Regex Sanitization Fallibility for CI Artifacts
content = content.replace(
  /The CLI MUST implement an error sanitizer that explicitly strips `process\.env` and authentication headers from specific HTTP client error objects \(e\.g\., Axios config\) before they are stringified to `stacktrace\.txt`\. Additionally, implement a global "defense-in-depth" Regex mask on the final stringified `stacktrace\.txt` and `stderr\.log` immediately before disk write to replace known token entropy patterns \(e\.g\., `ghp_\.\.\.`, `Bearer \[a-zA-Z0-9-\._~\+\/\]\+=\*`\) with `\*\*\*`\./,
  `The CLI MUST implement an error sanitizer that explicitly defines an allowlist of safe error fields (e.g., \`error.code\`, \`error.message\`) to extract and serialize. It MUST drop the global Regex masking entirely in favor of strict object picking to guarantee secrets are omitted from \`stacktrace.txt\`.`
);

// 9. Maintainability/Correctness: Fix dead code formatting
content = content.replace(
  /Because regex-based secret scrubbing of entire source trees is brittle and prone to leakage in public CI artifacts, the CLI MUST strictly allow-list the files it exports to `\.openspec-failed-artifacts\/\[UUID\]`\. It will ONLY export `stderr\.log`, `stdout\.log`, `stacktrace\.txt`, and the `openspec\.json` metadata file\. The CLI MUST implement an error sanitizer that explicitly defines an allowlist of safe error fields \(e\.g\., `error\.code`, `error\.message`\) to extract and serialize\. It MUST drop the global Regex masking entirely in favor of strict object picking to guarantee secrets are omitted from `stacktrace\.txt`\. Because masking arbitrary logs via regex is a notorious tarpit that introduces brittle complexity and guaranteed false negatives \(e\.g\., URL-encoded or Base64 secrets\), the CLI MUST NOT dump raw external `stderr` or `stdout` from `npm` or `git` child processes to the CI artifact payload if the command fails, explicitly avoiding ad-hoc log sanitizers\./,
  `The CLI MUST strictly allow-list the files it exports to \`.openspec-failed-artifacts/[UUID]\`. It will ONLY export \`stderr.log\`, \`stdout.log\`, \`stacktrace.txt\`, and the \`openspec.json\` metadata file. The CLI MUST implement an error sanitizer that explicitly defines an allowlist of safe error fields (e.g., \`error.code\`, \`error.message\`) to extract and serialize. It MUST drop global Regex masking entirely in favor of strict object picking to guarantee secrets are omitted from \`stacktrace.txt\`. Because masking arbitrary logs via regex is a notorious tarpit that introduces brittle complexity and guaranteed false negatives (e.g., URL-encoded or Base64 secrets), the CLI MUST NOT dump raw external \`stderr\` or \`stdout\` from \`npm\` or \`git\` child processes to the CI artifact payload if the command fails, explicitly avoiding ad-hoc log sanitizers.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update complete.');
