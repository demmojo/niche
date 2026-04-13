import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Correctness: Fix Data Loss on Interrupted Atomic Swap
content = content.replace(
  /If interrupted during this sequence, the next boot-time sweep will detect the missing or trashed directory and simply trigger a clean `npm ci`, ensuring self-healing recovery\./,
  `If interrupted during this sequence, the next boot-time sweep MUST explicitly detect the orphaned \`.tmp/workspace_old_[UUID]\` directory and restore it back to the live workspace path to prevent catastrophic data loss of the user's uncommitted source code.`
);

// 2. Correctness: Fix Git Index vs Working Tree Desync
content = content.replace(
  /To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will ingest the files directly into the Git object database \*during\* the hash phase using `git hash-object -w --stdin-paths` \(which returns the blob ID\)\. In the `--apply` phase, the CLI will update the Git index directly using that exact blob ID \(`git update-index --cacheinfo`\), wrapping this operation in a retry loop with \*\*jittered\*\* exponential backoff \(hard-capped at 5 retries and a 500ms maximum delay\) specifically targeting `fatal: Unable to create '\.\.\/\.git\/index\.lock': File exists` errors to ensure stability against IDE background watchers\./,
  `To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will ingest the files directly into the Git object database *during* the hash phase using \`git hash-object -w --stdin-paths\` (which returns the valid Git SHA-1 blob ID). In the \`--apply\` phase, the CLI will update the Git index directly using that exact blob ID (\`git update-index --cacheinfo\`), wrapping this operation in a retry loop with **jittered** exponential backoff (hard-capped at 5 retries and a 500ms maximum delay) specifically targeting \`fatal: Unable to create '.../.git/index.lock': File exists\` errors to ensure stability against IDE background watchers. Crucially, updating the index does not update the working tree; therefore, the CLI MUST execute the \`swapWorkspaceAtomically\` step immediately after the index update to synchronize the physical files with the new index state.`
);

// 3. Correctness: Fix Lockfile Mutation via npm install
content = content.replace(
  /the CLI executes `npm install --prefer-offline` within the staging directory \(by first copying the existing `node_modules`, `package\.json`, and `package-lock\.json` to preserve the cache, running install\./,
  `the CLI executes \`npm ci --prefer-offline\` within the staging directory (by first copying the existing \`node_modules\`, \`package.json\`, and \`package-lock.json\` to preserve the cache and explicitly preventing \`npm install\` from mutating the lockfile with unintended silent upgrades.`
);

// 4. Maintainability: Remove regex redaction from CI artifacts entirely
content = content.replace(
  /the CLI MUST implement robust, regex-based secret scanning or entropy checks on the log outputs \(masking all detected secrets and the specific known `--userconfig` token\) before writing `stderr\.log` and `stdout\.log` to the CI artifact dump, rather than relying solely on exact token string replacement\./,
  `Because masking arbitrary logs via regex is a notorious tarpit that introduces brittle complexity and guaranteed false negatives (e.g., URL-encoded or Base64 secrets), the CLI MUST NOT dump raw external \`stderr\` or \`stdout\` from \`npm\` or \`git\` child processes to the CI artifact payload if the command fails, explicitly avoiding ad-hoc log sanitizers.`
);
content = content.replace(
  /To prevent ReDoS and avoid cross-platform native compilation failures \(e\.g\., `node-gyp` on M-series Macs\), the redactor MUST utilize robust, bounded JS regex engines or fast entropy checks, avoiding naive string replacements that fail on URL-encoded or wrapped secrets before writing the CI artifact logs\./,
  `The CLI MUST write a sanitized, high-level summary of the failure to the CI artifact logs, strictly excluding raw child-process streams.`
);

// 5. Security: Fix Git Filename Injection via Newlines
content = content.replace(
  /The loop MUST correctly handle `old_path` renames by explicitly advancing the iterator pointer to skip the next string, and filter trailing empty strings\./,
  `The loop MUST correctly handle \`old_path\` renames by explicitly advancing the iterator pointer to skip the next string, and filter trailing empty strings. Crucially, it MUST explicitly reject and abort the staging process if any parsed filename contains a \`\\n\` or \`\\r\` character to prevent Git filename injection when piping to \`git hash-object --stdin-paths\` (which expects newline-delimited input).`
);

// 6. Security: Fix Disk Exhaustion via Unbounded git hash-object
content = content.replace(
  /The CLI will stream all paths directly into `stdin` while strictly respecting stream backpressure \(using `stream\.pipeline`\)\./,
  `The CLI will stream all paths directly into \`stdin\` while strictly respecting stream backpressure (using \`stream.pipeline\`). To prevent disk exhaustion attacks on the \`.git/objects\` directory, the CLI MUST implement a file size check (\`fs.stat\`) against a hard 50MB upper bound per file before allowing a path to be piped into \`git hash-object\`.`
);

// 7. Security: Fix Predictable workspace_old_[UUID] Swap Denial of Service
content = content.replace(
  /the CLI MUST first rename the live workspace directory to a unique `\.tmp\/workspace_old_\[UUID\]` suffix/,
  `the CLI MUST first rename the live workspace directory to a unique \`.tmp/workspace_old_[UUID]\` suffix (where \`[UUID]\` is strictly generated via \`crypto.randomUUID()\` to prevent predictable path creation and \`ENOTEMPTY\` blocking attacks)`
);
content = content.replace(
  /rename the existing live directory to `\.tmp\/workspace_old_\[UUID\]`/,
  `rename the existing live directory to \`.tmp/workspace_old_[UUID]\` (using \`crypto.randomUUID()\`)`
);


fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
