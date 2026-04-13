import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Correctness/Security: Revert to git hash-object -w for true TOCTOU elimination
content = content.replace(
  /The CLI will stream all paths through native Node\.js `crypto\.createHash\('sha256'\)` to verify working tree parity before a standard commit, explicitly abandoning complex `git hash-object --stdin-paths` pipelines and OS IPC buffer management\./,
  `To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will ingest the files directly into the Git object database *during* the hash phase using \`git hash-object -w --stdin-paths\` (which returns the blob ID). In the \`--apply\` phase, the CLI will update the Git index directly using that exact blob ID (\`git update-index --cacheinfo\`), wrapping this operation in a retry loop with **jittered** exponential backoff (hard-capped at 5 retries and a 500ms maximum delay) specifically targeting \`fatal: Unable to create '.../.git/index.lock': File exists\` errors to ensure stability against IDE background watchers. The CLI will stream all paths directly into \`stdin\` while strictly respecting stream backpressure (using \`stream.pipeline\`). It must actively drain the child process \`stdout\` stream strictly in parallel with the \`stdin\` pipeline (e.g., using \`Promise.all([stream.pipeline(...), consumeStdout(...)])\`) to prevent OS IPC pipe buffer deadlocks.`
);
content = content.replace(
  /To completely eliminate TOCTOU race conditions where files are modified between the staging hash validation and the final apply, the CLI will compute working tree file hashes using native Node\.js `crypto\.createHash\('sha256'\)` streaming reads\. This explicitly avoids `git hash-object` pipeline deadlocks and OS IPC buffer limits\. During the `--apply` phase, the CLI will re-hash the target files to verify parity against the cryptographic staging tokens\./,
  `To prevent Time-of-Check to Time-of-Use (TOCTOU) race conditions where files are modified between the \`--stage\` and \`--apply\` phases, the CLI will rely on Git index mechanics. To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will ingest the files directly into the Git object database *during* the hash phase using \`git hash-object -w --stdin-paths\` (which returns the blob ID).`
);
content = content.replace(
  /- \[ \] \*\*Task 4\.6\*\*: Implement atomic TOCTOU prevention by using native Node\.js `crypto\.createHash\('sha256'\)` streams to compute working tree file hashes\. The CLI must explicitly verify working tree parity against the staging tokens \(detecting manual edits\) and safely abort the transaction if drift is detected, rather than force-clobbering\./,
  `- [ ] **Task 4.6**: Implement atomic TOCTOU prevention by using \`git hash-object -w --stdin-paths\` during staging to generate blob IDs, and \`git update-index --cacheinfo\` during the apply phase to safely mutate the index. The CLI must actively drain the \`stdout\` stream in parallel with the \`stdin\` pipeline to prevent OS IPC pipe buffer deadlocks. The CLI must explicitly verify working tree parity (detecting manual edits) and safely abort the transaction if drift is detected, rather than force-clobbering.`
);

// 2. Correctness: Fix non-atomic multiple component swap (package.json, node_modules)
content = content.replace(
  /Then atomically swap the updated `node_modules`, `package\.json`, and `package-lock\.json` back into the live workspace\)/,
  `Then sequentially swap the updated \`package.json\` and \`package-lock.json\` into the live workspace, followed immediately by the \`node_modules\` directory swap)`
);

// 3. Correctness: EPIPE swallowing hiding legitimate failures
content = content.replace(
  /- \[ \] \*\*Task 3\.1\*\*: Modify the CLI entrypoint to bind `\.on\('error'\)` handlers to `process\.stdout` and `process\.stderr` that specifically swallow `EPIPE` errors\./,
  `- [ ] **Task 3.1**: Modify the CLI entrypoint to bind \`.on('error')\` handlers to \`process.stdout\` and \`process.stderr\` that specifically swallow \`EPIPE\` errors ONLY during JSON payload emission, ensuring legitimate streaming failures in other contexts are not masked.`
);

// 4. Security: Secret Scanner Evasion via Line Truncation
content = content.replace(
  /enforcing a hard line-length truncation \(e\.g\., skip or truncate lines > 1024 chars\) \*before\* applying regex patterns to prevent catastrophic backtracking \(ReDoS\) and Event Loop blocking on minified files\./,
  `utilizing a non-backtracking regex engine (e.g., Google's RE2 via \`node-re2\`) or a fixed-window entropy scanner to securely scan long lines (e.g., minified files) without ReDoS risks or arbitrary truncation blind spots.`
);
content = content.replace(
  /Implement the native Node\.js chunked stream secret scanner \(truncating long lines\)/,
  `Implement the chunked stream secret scanner (using node-re2 or entropy checks for long lines)`
);

// 5. Security: Unredacted CI Artifact Exfiltration
content = content.replace(
  /Because output redaction is fundamentally insecure and prone to bypasses, the CLI MUST NOT attempt to redact secrets from CI artifacts\. Instead, it must prevent secrets from entering logs at the source, enforce strict `0600` permissions on the `\.openspec-failed-artifacts\/\[UUID\]` contents, and explicitly prohibit uploading these raw artifact dumps to public CI runners\./,
  `Because external tools (like NPM or Git) frequently dump sensitive context to \`stderr\` during hard failures, the CLI MUST perform a fast, deterministic string-replacement pass (masking the specific known \`--userconfig\` token) before writing \`stderr.log\` and \`stdout.log\` to the CI artifact dump. It must also enforce strict \`0600\` permissions on the \`.openspec-failed-artifacts/[UUID]\` contents, and explicitly prohibit uploading these artifact dumps to public CI runners.`
);

// 6. Security: Stripping all NPM_CONFIG_* variables breaks enterprise networks
content = content.replace(
  /Furthermore, the CLI MUST explicitly set `NODE_OPTIONS=""` and strip all `NPM_CONFIG_\*` variables from the `spawn` environment to prevent malicious hijacking of the sandboxed `npm ci` execution\./,
  `Furthermore, the CLI MUST explicitly strip \`NPM_CONFIG__AUTH\` from the \`spawn\` environment to prevent token inheritance, while preserving legitimate enterprise configurations (like \`NPM_CONFIG_PROXY\` or \`NPM_CONFIG_CAFILE\`) required for \`npm ci\` execution behind corporate firewalls. Setting \`NODE_OPTIONS=""\` is forbidden as it strips valid \`--max-old-space-size\` limits.`
);

// 7. Security: Persistent Credentials on Disk Post-SIGKILL
content = content.replace(
  /To mitigate indefinite persistence of plaintext tokens in the event of an un-trappable SIGKILL crash, the CLI MUST enforce short-lived \(ephemeral\) tokens wherever possible, and ensure the root `\.tmp\/` directory is strictly added to `\.gitignore` to prevent accidental commits\./,
  `To mitigate indefinite persistence of plaintext tokens in the event of an un-trappable SIGKILL crash, the CLI MUST prioritize creating the ephemeral \`.npmrc\` in an OS-level \`tmpfs\` (e.g., \`/dev/shm\` on Linux) if available, falling back to the workspace \`.tmp/[UUID]\`. The boot-time garbage collector MUST explicitly prioritize wiping \`.npmrc\` files in orphaned directories before any other operations. Ensure the root \`.tmp/\` directory is strictly added to \`.gitignore\` to prevent accidental commits.`
);

// 8. Maintainability: Naming Obfuscation (AtomicWorkspaceSwap -> swapWorkspaceAtomically)
content = content.replace(/AtomicWorkspaceSwap/g, 'swapWorkspaceAtomically');

// 9. Maintainability: Deprecation Phase Logic
content = content.replace(
  /the CLI MUST compare `Object\.keys\(input\)` against the Zod schema keys to trigger deprecation warnings, then strictly use Zod's native `\.strict\(\)` or `\.strip\(\)` parsing methods to return the sanitized options object securely, explicitly avoiding manual key deletion loops to prevent Prototype Pollution vulnerabilities\./,
  `the CLI MUST strictly use Zod's native \`.strict()\` or \`.strip()\` parsing methods to return the sanitized options object securely, explicitly avoiding convoluted manual key deletion loops and \`Object.keys()\` diffing to prevent Prototype Pollution vulnerabilities and maintainability debt. Deprecation warnings for unknown flags should be handled by Zod's built-in warning mechanisms if available, or omitted in favor of strict rejection.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update complete.');
