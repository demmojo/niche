import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Correctness: Fix Git hash-object stdout desynchronization
content = content.replace(
  /using a single batch `git hash-object --stdin-paths` SHA-256 content hashing process, completely eliminating O\(N\) `fs\.stat` I\/O bottlenecks/,
  `using native Node.js \`crypto.createHash('sha256')\` streams, completely eliminating \`git hash-object\` pipeline deadlocks`
);
content = content.replace(
  /To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will ingest the files directly into the Git object database \*during\* the hash phase using `git hash-object -w --stdin-paths` \(which returns the blob ID\)\. In the `--apply` phase, the CLI will update the Git index directly using that exact blob ID \(`git update-index --cacheinfo`\), wrapping this operation in a retry loop with \*\*jittered\*\* exponential backoff \(hard-capped at 5 retries and a 500ms maximum delay\) specifically targeting `fatal: Unable to create '\.\.\/\.git\/index\.lock': File exists` errors to ensure stability against IDE background watchers\.\. To prevent destroying uncommitted manual edits made during the TOCTOU window, the CLI will compare the working tree file hash \(using native Node\.js `crypto\.createHash\('sha256'\)` streams, completely eliminating `git hash-object` pipeline deadlocks\) against the index hash\. The CLI will stream all paths directly into `stdin` while strictly respecting stream backpressure \(using `stream\.pipeline`\)\. It must actively drain the child process `stdout` stream strictly in parallel with the `stdin` pipeline \(e\.g\., using `Promise\.all\(\[stream\.pipeline\(\.\.\.\), consumeStdout\(\.\.\.\)\]\)`\) to prevent OS IPC pipe buffer deadlocks\. \(avoiding `argv` `E2BIG` limits entirely\) to bypass Node memory limits without incurring child-process spawn overhead, strictly avoiding brittle `mtime` checks\)\./,
  `To completely eliminate TOCTOU race conditions where files are modified between the staging hash validation and the final apply, the CLI will compute working tree file hashes using native Node.js \`crypto.createHash('sha256')\` streaming reads. This explicitly avoids \`git hash-object\` pipeline deadlocks and OS IPC buffer limits. During the \`--apply\` phase, the CLI will re-hash the target files to verify parity against the cryptographic staging tokens.`
);

// 2. Security: Fix Flawed Secret Redaction in CI Artifacts
content = content.replace(
  /To prevent secret leakage in these exported logs, the CLI MUST pipe stdout\/stderr through a redacting stream\. To prevent ReDoS and avoid cross-platform native compilation failures \(e\.g\., `node-gyp` on M-series Macs\), the redactor MUST utilize simple, static string replacements \(`\.replaceAll\(\)`\) for known rigid secret prefixes or a strictly bounded JS regex engine fallback, strictly avoiding expensive high-entropy math on large logs before writing the CI artifact logs\./,
  `Because output redaction is fundamentally insecure and prone to bypasses, the CLI MUST NOT attempt to redact secrets from CI artifacts. Instead, it must prevent secrets from entering logs at the source, enforce strict \`0600\` permissions on the \`.openspec-failed-artifacts/[UUID]\` contents, and explicitly prohibit uploading these raw artifact dumps to public CI runners.`
);

// 3. Security: Indefinite Credential Persistence via Crash-Only Design
content = content.replace(
  /By placing it here, the existing synchronous boot-time sweep natively garbage collects any orphaned credentials after a catastrophic SIGKILL crash\./,
  `While the CLI embraces a crash-only design, it MUST implement a narrow, isolated \`process.on('SIGINT')\` and \`process.on('exit')\` trap explicitly dedicated to securely unlinking the \`.npmrc\` credential file before the process dies, neutralizing the risk of token persistence.`
);

// 4. Security: Node Environment Injection in npm ci
content = content.replace(
  /The `env` object passed to `spawn` must explicitly omit or sanitize sensitive inherited variables, as `child_process\.spawn` inherits the parent shell environment by default\./,
  `The \`env\` object passed to \`spawn\` must explicitly omit sensitive inherited variables. Furthermore, the CLI MUST explicitly set \`NODE_OPTIONS=""\` and strip all \`NPM_CONFIG_*\` variables from the \`spawn\` environment to prevent malicious hijacking of the sandboxed \`npm ci\` execution.`
);

// 5. Correctness: Impossibility of zero-gap directory swaps in Node.js
content = content.replace(
  /Instead of removing the live `node_modules` first, it will rename the staging directory into place \(e\.g\., `node_modules_new`\), perform a rapid rename-swap, and asynchronously delete the old directory\. Do not leave the primary path empty mid-transaction\./,
  `Instead of removing the live \`node_modules\` first, it will rename the live directory to an \`_old\` suffix, rename the staging directory into place, and then asynchronously delete the old directory. This creates a microsecond transient state where \`node_modules\` does not exist, but guarantees POSIX atomicity.`
);

// 6. Correctness: Resource leak of orphaned node_modules_old directories
content = content.replace(
  /The synchronous boot-time sweep will simply iterate through all `\.tmp\/staging-\*` and `\.tmp\/failed-\*` directories and attempt removal\./,
  `The synchronous boot-time sweep will iterate through all \`.tmp/staging-*\`, \`.tmp/failed-*\`, and orphaned \`node_modules_old\` directories and attempt removal.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
