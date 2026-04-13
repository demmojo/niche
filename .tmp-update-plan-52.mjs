import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// Maintainability fixes:
// 2. Conflicting "commitStagedWorkspace" terminology -> "swapStagedWorkspace"
content = content.replace(/commitStagedWorkspace/g, 'swapStagedWorkspace');

// 3. Deep Git Index Manipulation indirection
// The plan actually dictates `git update-index` because atomic swap via renameSync might miss uncommitted edits. Wait, no. We are doing Atomic Directory Swapping using `fs.renameSync` on specific files/directories. If we use `fs.renameSync`, why are we ALSO using `git hash-object` and `git update-index`?
// Oh, the subagent caught this: "Using git hash-object -w --stdin and git update-index --cacheinfo to manage staged files bypasses standard filesystem and git add workflows. This introduces extreme indirection and tight coupling to Git's internal object database for a problem (TOCTOU) that is typically solved via simpler filesystem locking or hashing mechanisms."
// Let's remove the git index manipulation entirely and rely on filesystem hashing + renameSync.
content = content.replace(
  /To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will pipe the exact in-memory validated byte buffer .*? The CLI will stream the validated byte buffers directly into `stdin` while strictly respecting stream backpressure\./g,
  `To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will compute a SHA-256 hash of the live files prior to staging. Immediately before the final \`swapStagedWorkspace\` execution (which uses \`fs.renameSync\`), the CLI will re-hash the live working tree files. If the hashes drift (indicating a human edit occurred during the staging window), the atomic swap is aborted and the staging directory is orphaned.`
);

// 4. Dead-code: Signal Trapping contradiction
content = content.replace(
  /While the CLI embraces a crash-only design, it MUST implement a narrow, isolated `process\.on\('SIGINT'\)` and `process\.on\('exit'\)` trap explicitly dedicated to securely unlinking the `\.npmrc` credential file before the process dies, neutralizing the risk of token persistence\./,
  `` // Removed because we already changed this to stdin IPC injection in .tmp-update-plan-50.mjs. Wait, did we?
);
content = content.replace( // Clean up the duplicate text about SIGINT/npmrc if it exists
  /Because environment variables injected into `spawn` are visible via `\/proc\/<pid>\/environ`, the CLI MUST create an ephemeral `\.npmrc` file inside the isolated `\.tmp\/\[UUID\]` staging directory with strict `0600` permissions containing the auth token\. This file MUST be explicitly deleted immediately after the `npm ci` child process exits\./,
  `Because environment variables injected into \`spawn\` leak via \`/proc/<pid>/environ\`, the CLI MUST NOT write an ephemeral \`.npmrc\` file to disk. Instead, the CLI MUST securely inject the token into the \`npm ci\` child process via \`stdin\` or a secure IPC channel.`
);

// Security Fixes:

// 2. Cumulative Disk Exhaustion DoS
content = content.replace(
  /To prevent disk exhaustion attacks on the `\.git\/objects` directory, the CLI MUST implement a file size check \(`fs\.stat`\) against a hard 50MB upper bound per file before allowing a path to be piped into `git hash-object`\./,
  `To prevent cumulative disk exhaustion attacks during the TOCTOU hash check phase, the CLI MUST implement both a per-file size limit (e.g., 50MB) and a global cumulative byte-size limit (e.g., \`MAX_TOTAL_PAYLOAD = 500MB\`) across the entire staging transaction. A running byte counter must track the total size of files staged, aborting the pipeline immediately if the cumulative threshold is breached.`
);
// Also remove the git hash-object mention in Task 4.6
content = content.replace(
  /- \[ \] \*\*Task 4\.6\*\*: Implement atomic TOCTOU prevention by using `git hash-object -w --stdin` batch processes during staging to generate blob IDs, and `git update-index --cacheinfo` during the apply phase to safely mutate the index\..*?The CLI must explicitly verify working tree parity \(detecting manual edits\) and safely abort the transaction if drift is detected, rather than force-clobbering\./,
  `- [ ] **Task 4.6**: Implement atomic TOCTOU prevention using fast native Node.js filesystem hashing (e.g., \`crypto.createHash('sha256')\`). The CLI must explicitly re-hash and verify working tree parity immediately before the final \`fs.renameSync\` swap to detect manual edits, safely aborting the transaction if drift is detected, rather than force-clobbering.`
);

// 3. NPM Configuration Injection via Parent Traversal
content = content.replace(
  /Scope the token strictly to the target registry \(e\.g\., `\/\/registry\.npmjs\.org\/:_authToken=token`\) to prevent transmission to arbitrary registries\./,
  `When injecting the token via stdin, the CLI MUST strictly hardcode and pin the exact \`registry\` URL alongside the token, and execute \`npm ci\` with \`--userconfig=/dev/null\` and \`--globalconfig=/dev/null\` to completely prevent malicious workspace-level \`.npmrc\` files from hijacking the registry resolution or overriding the injected credentials.`
);
content = content.replace(
  /enforce `--ignore-scripts` and `--globalconfig=\/dev\/null` to prevent local registry hijacking/,
  `enforce \`--ignore-scripts\`, \`--userconfig=/dev/null\`, and \`--globalconfig=/dev/null\` to prevent local registry hijacking`
);

// 5. Race Condition in Auto-Recovery
content = content.replace(
  /If interrupted during this sequence, the next boot-time sweep MUST explicitly detect orphaned `_old` directories or files\. Before restoring them, the recovery routine MUST verify if the live workspace is already successfully populated/,
  `If interrupted during this sequence, the next boot-time sweep MUST explicitly detect orphaned \`_old\` directories or files. To prevent split-brain state corruption from concurrent CLI executions in matrix CI pipelines, the recovery routine MUST first acquire a global atomic lock (e.g., creating a \`.openspec-recovery.lock\` directory using \`mkdir\`). Once locked, the recovery routine MUST verify if the live workspace is already successfully populated`
);


// 6. ReDoS & Event Loop Starvation
content = content.replace(
  /To prevent V8 Out-Of-Memory \(OOM\) crashes and premature abstraction, the scanner MUST be chunked line-by-line via streams on the main thread, utilizing a fixed-window streaming scanner, fast entropy checks, or safely bounded JS regex/,
  `To prevent V8 Out-Of-Memory (OOM) crashes and main-thread Event Loop starvation, the chunked line-by-line streaming secret scanner MUST be offloaded to Node.js \`worker_threads\`. The worker will utilize a fixed-window streaming scanner, fast entropy checks, or safely bounded JS regex`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 52 complete.');
