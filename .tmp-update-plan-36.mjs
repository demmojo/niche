import fs from 'fs';

let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Rename WorkspaceTransaction -> AtomicWorkspaceSwap
content = content.replace(/WorkspaceTransaction/g, 'AtomicWorkspaceSwap');

// 2. Rename JsonStreamBoundary -> OutputFormatter
content = content.replace(/JsonStreamBoundary/g, 'OutputFormatter');

// 3. Fix Section 3.6 (Dead code / git hash-object vs crypto)
content = content.replace(
  /To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will ingest the files directly into the Git object database \*during\* the hash phase using `git hash-object -w --stdin-paths` \(which returns the blob ID\)\. In the `--apply` phase, the CLI will update the Git index directly using that exact blob ID \(`git update-index --cacheinfo`\), wrapping this operation in a retry loop with \*\*jittered\*\* exponential backoff \(hard-capped at 5 retries and a 500ms maximum delay\) specifically targeting `fatal: Unable to create '\.\.\/\.git\/index\.lock': File exists` errors to ensure stability against IDE background watchers\.\. To prevent destroying uncommitted manual edits made during the TOCTOU window, the CLI will compare the working tree file hash \(using a single batch `git hash-object --stdin-paths` SHA-256 content hashing process, completely eliminating O\(N\) `fs\.stat` I\/O bottlenecks\)\. The CLI will stream all paths directly into `stdin` while strictly respecting stream backpressure \(using `stream\.pipeline`\)\. It must actively drain the child process `stdout` stream strictly in parallel with the `stdin` pipeline \(e\.g\., using `Promise\.all\(\[stream\.pipeline\(\.\.\.\), consumeStdout\(\.\.\.\)\]\)`\) to prevent OS IPC pipe buffer deadlocks\. \(avoiding `argv` `E2BIG` limits entirely\) to bypass Node memory limits without incurring child-process spawn overhead, strictly avoiding brittle `mtime` checks\) against the index hash\./,
  `To completely eliminate TOCTOU race conditions where files are modified between the staging hash validation and the final apply, the CLI will compute working tree file hashes using native Node.js \`crypto.createHash('sha256')\` streaming reads. This explicitly avoids \`git hash-object\` pipeline deadlocks and OS IPC buffer limits. During the \`--apply\` phase, the CLI will re-hash the target files to verify parity against the cryptographic staging tokens. If hash drift is detected (indicating a human edit mid-flight) or \`ENOENT\` is thrown, the transaction will explicitly abort, prompting the user. It will never force-clobber the working directory.`
);

// 4. Fix Section 3.4 & Task 4.1 (Incomplete Atomic Swap)
content = content.replace(
  /atomically swapping the updated `node_modules` into the live workspace/g,
  `atomically swapping the updated \`node_modules\`, \`package.json\`, and \`package-lock.json\` back into the live workspace`
);

// 5. Fix Section 3.1 & Task 4.4 (git worktree prune requires physical deletion first)
content = content.replace(
  /Future boot-time sweeps and `git worktree prune` will clean it up naturally once locks are released\./,
  `Future boot-time sweeps will physically delete the directory and then run \`git worktree prune\` to clean up the metadata once locks are released.`
);

// 6. Fix Section 3.8 & Task 4.7 (.npmrc SIGKILL persistence)
content = content.replace(
  /the CLI MUST create an ephemeral `\.npmrc` file with strict `0600` permissions exclusively inside the highly scoped, workspace-local `\.tmp\/\[UUID\]` staging directory\. By strictly deleting this file before the atomic swap, and relying on the boot-time GC sweep to clean up orphaned `\.tmp\/` directories after a SIGINT crash, the design safely prevents credential leaks\./,
  `the CLI MUST create an ephemeral \`.npmrc\` file with strict \`0600\` permissions exclusively in an OS-level \`tmpfs\` directory (e.g., \`os.tmpdir()\` with a cryptographic UUID) rather than the workspace. By explicitly deleting this file after the \`npm ci\` run, and relying on the OS to purge \`tmpfs\` upon catastrophic SIGKILL or reboot, the design guarantees credentials are never orphaned on persistent storage.`
);

content = content.replace(
  /This file MUST be explicitly deleted before the atomic swap\./,
  `This file MUST be explicitly deleted immediately after the \`npm ci\` child process exits.`
);
content = content.replace(
  /create an ephemeral `\.npmrc` file inside the isolated `\.tmp\/\[UUID\]` staging directory with strict `0600` permissions/,
  `create an ephemeral \`.npmrc\` file inside \`os.tmpdir()\` with strict \`0600\` permissions`
);


// 7. Fix Section 3.7 & Task 4.2 (OOM in Secret Scanner)
content = content.replace(
  /the scanner will read files into memory with a hard 50MB limit per file/,
  `the scanner will read files into memory with a hard 50MB limit per file, strictly bounded by a concurrency cap (e.g., \`p-limit(4)\`)`
);
content = content.replace(
  /Implement the native Node\.js secret scanner \(50MB file limit\)/,
  `Implement the native Node.js secret scanner (50MB file limit, concurrency capped at 4)`
);

// 8. Fix Section 3.7 & Task 4.3 (State Machine premature abstraction)
content = content.replace(
  /using a state-machine parser that correctly handles rename\/copy sequences/,
  `using a simple \`.split('\\0')\` iterator loop that handles rename/copy sequences`
);

// 9. Fix Task 2.3 (ReDoS in log redactor)
content = content.replace(
  /MUST pipe stdout\/stderr through a redacting stream that masks entropy strings and known secret formats/,
  `MUST pipe stdout/stderr through a redacting stream using a non-backtracking regex engine (e.g., \`node-re2\`) to prevent ReDoS. It must strictly mask known, rigid secret prefixes rather than computing expensive high-entropy math on large logs`
);

// 10. Fix Section 3.5 (Symlink traversal on .tmp)
content = content.replace(
  /All transient staging environments and staging directorys will be built locally within the workspace's `\.tmp\/` directory \(e\.g\., `\.tmp\/\[ExpiryTimestamp\]-\[UUID\]`\) to support the atomic staging standard, explicitly enforcing `fs\.promises\.mkdir\(\.\.\., \{ mode: 0o700 \}\)`/,
  `All transient staging environments will be built locally within the workspace's \`.tmp/\` directory. Before creating the \`[UUID]\` subdirectory, the CLI MUST assert via \`fs.promises.lstat\` that the base \`.tmp\` directory is a physical directory, strictly rejecting symlinks to prevent traversal escapes. It must explicitly enforce \`fs.promises.mkdir(..., { mode: 0o700 })\``
);

// 11. Fix Background GC Contradictions (Section 3.5)
content = content.replace(/the background GC/g, 'the synchronous boot-time sweep');

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update complete.');
