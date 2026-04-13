import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Correctness: Fix Data Loss on Interrupted Atomic Swap
content = content.replace(
  /If interrupted during this sequence, the next boot-time sweep MUST explicitly detect the orphaned `\.tmp\/workspace_old_\[UUID\]` directory and restore it back to the live workspace path to prevent catastrophic data loss of the user's uncommitted source code\./,
  `If interrupted during this sequence, the next boot-time sweep MUST explicitly detect the orphaned \`.tmp/workspace_old_[UUID]\` directory and restore it back to the live workspace path to prevent catastrophic data loss of the user's uncommitted source code. This recovery MUST occur before any other operations.`
);

// 2. Correctness: Fix Git Index vs Working Tree Desync
content = content.replace(
  /Crucially, updating the index does not update the working tree; therefore, the CLI MUST execute the `swapWorkspaceAtomically` step immediately after the index update to synchronize the physical files with the new index state\./,
  `Crucially, updating the index does not update the working tree; therefore, the CLI MUST execute the \`swapWorkspaceAtomically\` step immediately after the index update to synchronize the physical files with the new index state, preventing a desync where git reports staged changes that don't exist in the working directory.`
);

// 3. Security: Child Process Environment Leakage (NPM_CONFIG_AUTH)
content = content.replace(
  /the CLI MUST explicitly strip `NPM_CONFIG__AUTH` from the `spawn` environment to prevent token inheritance, while preserving legitimate enterprise configurations/,
  `the CLI MUST explicitly strip \`NPM_CONFIG__AUTH\` and any other sensitive \`NPM_CONFIG_*\` variables (like \`NPM_CONFIG_TOKEN\`) from the \`spawn\` environment to prevent token inheritance, while preserving legitimate enterprise configurations`
);

// 4. Security: Git Argument Injection via Malicious Filenames
content = content.replace(
  /Crucially, it MUST explicitly reject and abort the staging process if any parsed filename contains a `\\n` or `\\r` character to prevent Git filename injection when piping to `git hash-object --stdin-paths` \(which expects newline-delimited input\)\./,
  `Crucially, it MUST explicitly reject and abort the staging process if any parsed filename contains a \`\\n\` or \`\\r\` character to prevent Git filename injection when piping to \`git hash-object --stdin-paths\` (which expects newline-delimited input). Furthermore, the CLI MUST mandate the use of the POSIX End-of-Options delimiter (\`--\`) for ALL spawned child processes interacting with dynamic paths (e.g., \`spawn('git', ['update-index', '--cacheinfo', '100644', blobId, '--', maliciousFilePath])\`) to prevent argument injection via filenames starting with hyphens.`
);
content = content.replace(
  /prevent Git filename injection when piping to `git hash-object --stdin-paths` \(which expects newline-delimited input\)\. Implement a hard `MAX_FILES = 25,000` ceiling to prevent DoS memory exhaustion\./,
  `prevent Git filename injection when piping to \`git hash-object --stdin-paths\` (which expects newline-delimited input). Furthermore, mandate the POSIX End-of-Options delimiter (\`--\`) for ALL dynamic path arguments. Implement a hard \`MAX_FILES = 25,000\` ceiling to prevent DoS memory exhaustion.`
);

// 5. Security: Secret Leakage in CI Artifact Serialization (Stacktrace)
content = content.replace(
  /The CLI MUST implement an error sanitizer that explicitly strips `process\.env` and authentication headers from specific HTTP client error objects \(e\.g\., Axios config\) before they are stringified to `stacktrace\.txt`, avoiding global `Error` prototype mutations\./,
  `The CLI MUST implement an error sanitizer that explicitly strips \`process.env\` and authentication headers from specific HTTP client error objects (e.g., Axios config) before they are stringified to \`stacktrace.txt\`. Additionally, implement a global "defense-in-depth" Regex mask on the final stringified \`stacktrace.txt\` and \`stderr.log\` immediately before disk write to replace known token entropy patterns (e.g., \`ghp_...\`, \`Bearer [a-zA-Z0-9-._~+/]+=*\`) with \`***\`.`
);

// 6. Security: Git Packfile Scanning / Memory Exhaustion
content = content.replace(
  /explicitly configuring the scanner to ignore paths listed in `\.gitignore` or identified via `git check-ignore` to prevent massive CPU\/IO event loop blocking, ensuring tracked secrets are never skipped\./,
  `explicitly configuring the scanner to ignore paths listed in \`.gitignore\` or identified via \`git check-ignore\`, and strictly hardcoding \`.git/\` and \`node_modules/\` into the global exclusion matrix to prevent immediate V8 OOM crashes and extreme event loop blockage from scanning massive binary Git packfiles.`
);

// 7. Maintainability: Clean up messy lines in 3.6 & 3.5
content = content.replace(
  /In the `--apply` phase, the CLI will update the Git index directly using that exact blob ID \(`git update-index --cacheinfo`\), wrapping this operation in a retry loop with \*\*jittered\*\* exponential backoff \(hard-capped at 5 retries and a 500ms maximum delay\) specifically targeting `fatal: Unable to create '\.\.\/\.git\/index\.lock': File exists` errors to ensure stability against IDE background watchers\. Crucially, updating the index does not update the working tree; therefore, the CLI MUST execute the `swapWorkspaceAtomically` step immediately after the index update to synchronize the physical files with the new index state, preventing a desync where git reports staged changes that don't exist in the working directory\./,
  `In the \`--apply\` phase, the CLI will update the Git index directly using that exact blob ID (\`git update-index --cacheinfo\`), wrapping this operation in a retry loop with **jittered** exponential backoff (hard-capped at 5 retries and a 500ms maximum delay) specifically targeting \`fatal: Unable to create '.../.git/index.lock': File exists\` errors to ensure stability against IDE background watchers. Crucially, updating the index does not update the working tree; therefore, the CLI MUST execute the \`swapWorkspaceAtomically\` step immediately after the index update to synchronize the physical files with the new index state, preventing a desync where git reports staged changes that don't exist in the working directory.`
);

content = content.replace(
  /To prevent destroying uncommitted manual edits made during the TOCTOU window, the CLI will stream all paths directly into `stdin` while strictly respecting stream backpressure \(using `stream\.pipeline`\)\. It must actively drain the child process `stdout` stream strictly in parallel with the `stdin` pipeline \(e\.g\., using `Promise\.all\(\[stream\.pipeline\(\.\.\.\), consumeStdout\(\.\.\.\)\]\)`\) to prevent OS IPC pipe buffer deadlocks\. \(avoiding `argv` `E2BIG` limits entirely\) to bypass Node memory limits without incurring child-process spawn overhead, strictly avoiding brittle `mtime` checks\) against the index hash\. If `ENOENT` is thrown during the TOCTOU check \(indicating a file was physically deleted mid-flight\) or if hash drift is detected, the transaction will explicitly abort, prompting the user\. It will never force-clobber the working directory\./,
  `To prevent destroying uncommitted manual edits made during the TOCTOU window, the CLI will stream all paths directly into \`stdin\` while strictly respecting stream backpressure (using \`stream.pipeline\`). It must actively drain the child process \`stdout\` stream strictly in parallel with the \`stdin\` pipeline (e.g., using \`Promise.all([stream.pipeline(...), consumeStdout(...)])\`) to prevent OS IPC pipe buffer deadlocks. This bypasses Node memory limits without incurring child-process spawn overhead and avoids \`argv\` \`E2BIG\` limits. If \`ENOENT\` is thrown during the TOCTOU check (indicating a file was physically deleted mid-flight) or if hash drift is detected, the transaction will explicitly abort, prompting the user. It will never force-clobber manually modified files.`
);

content = content.replace(
  /All transient staging environments will be built locally within the workspace's `\.tmp\/` directory\. Before creating the `\[UUID\]` subdirectory, the CLI MUST directly execute `fs\.promises\.mkdir\(\.\.\., \{ recursive: true, mode: 0o700 \}\)`, relying on the operating system's native atomic filesystem operations to handle existing directories securely, rather than introducing a TOCTOU vulnerability via `lstat` checks\. It must explicitly enforce `fs\.promises\.mkdir\(\.\.\., \{ mode: 0o700 \}\)` and ensuring `fs\.copyFile` utilizes flags that preserve the original file modes, moving away from the previously proposed `os\.tmpdir\(\)`\./,
  `All transient staging environments will be built locally within the workspace's \`.tmp/\` directory. Before creating the \`[UUID]\` subdirectory, the CLI MUST directly execute \`fs.promises.mkdir(..., { recursive: true, mode: 0o700 })\`, relying on the operating system's native atomic filesystem operations to handle existing directories securely, rather than introducing a TOCTOU vulnerability via \`lstat\` checks. It must ensure \`fs.copyFile\` utilizes flags that preserve the original file modes, moving away from the previously proposed \`os.tmpdir()\`.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update complete.');
