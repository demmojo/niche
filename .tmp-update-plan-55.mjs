import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// --- CORRECTNESS & MAINTAINABILITY & SECURITY FIXES ---

// 1. Data Loss & OS Lock via Root Directory Rename
content = content.replace(
  /rename the live workspace directory to a unique `\.tmp\/workspace_old_\[UUID\]` suffix/g,
  `rename individual active directories (like \`node_modules\`) to a unique \`.tmp/node_modules_old_[UUID]\` suffix`
);

// 2. Remove git hash-object completely (TOCTOU)
content = content.replace(
  /To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will pipe the exact in-memory validated byte buffer.*?If the hashes drift/s,
  `To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will compute a SHA-256 hash of the live files prior to staging. Immediately before the final \`commitStagingTransaction\` execution (which uses \`fs.renameSync\`), the CLI will re-hash the live working tree files. If the hashes drift`
);

// 3. Ephemeral .npmrc and RAM disk
content = content.replace(
  /the CLI MUST securely inject the token into the `npm ci` child process via `stdin` or a secure IPC channel, bypassing disk writes\./g,
  `the CLI MUST securely provision an ephemeral in-memory \`.npmrc\` via a RAM disk (\`tmpfs\`, e.g., \`/dev/shm\`) or a secure local HTTP proxy interceptor to provide the token, bypassing physical disk writes entirely.`
);
content = content.replace(
  /the CLI MUST NOT write an ephemeral `\.npmrc` file to disk\. Instead, the CLI MUST securely inject the token into the `npm ci` child process via `stdin` or a secure IPC channel\./g,
  `the CLI MUST NOT write an ephemeral \`.npmrc\` file to physical disk. Instead, the CLI MUST securely provision it via a RAM disk (\`tmpfs\`).`
);
content = content.replace(
  /When injecting the token via stdin, the CLI MUST strictly hardcode and pin the exact `registry` URL/g,
  `When injecting the token via RAM disk, the CLI MUST strictly hardcode and pin the exact \`registry\` URL`
);
content = content.replace(
  /--userconfig=\/dev\/null/g,
  `--userconfig=\${platformNull}`
);
content = content.replace(
  /--globalconfig=\/dev\/null/g,
  `--globalconfig=\${platformNull}`
);
content = content.replace(
  /dynamically resolve the platform-specific null device path \(e\.g\., `\\\\\\.\\NUL` on Windows\)/,
  ''
);

// 4. Secret Scanner Index scanning wrong dir
content = content.replace(
  /operating exclusively on the exact list of files staged for commit in the index \(e\.g\., using `git diff --cached --name-only`\)/,
  `operating exclusively on the exact list of files staged for commit in the index by running \`git diff --cached --name-only\` against the live workspace, but reading the physical files from the \`.tmp/[UUID]\` staging directory`
);

// 5. Lockfile TOCTOU
content = content.replace(
  /hash of the live `package\.json` before staging/g,
  `hash of the live \`package.json\` and \`package-lock.json\` before staging`
);
content = content.replace(
  /assert this hash matches the live file immediately before the final swap/g,
  `assert these hashes match the live files immediately before the final swap`
);

// 6. Rename extraction git status
content = content.replace(
  /use `i\+\+` safely to bypass the `old_path` entry on `R` and `C` status codes/g,
  `parse the null-separated sequences according to Git's documentation, correctly advancing the iterator when a rename/copy status (e.g., \`R\`, \`C\`, \`RM\`) indicates an \`old_path\` is present`
);

// 7. CI Artifact Log Exports (Memory efficient stream redaction)
content = content.replace(
  /It MUST drop the global Regex masking entirely in favor of strict object picking to guarantee secrets are omitted from `stacktrace\.txt`\. Because external tools.*?explicitly avoiding ad-hoc log sanitizers\./s,
  `For \`stacktrace.txt\`, it MUST use strict object picking. For \`stderr.log\` and \`stdout.log\`, the CLI MUST implement a memory-efficient stream transformer that redacts known secrets (using exact string matching of injected tokens) across all exported log files before writing them to the \`.openspec-failed-artifacts/\` directory.`
);

// 8. Zod passthrough vs strict
content = content.replace(
  /Update Zod schemas to strictly reject unknown flags via `\.strict\(\)`, avoiding custom passthrough logic/g,
  `Update Zod schemas to strictly reject unknown flags via \`.strict()\`, and explicitly strip \`__proto__\` and \`constructor\` to prevent Prototype Pollution`
);

// 9. Global lockfile contradiction
content = content.replace(
  /No global lockfiles are used, preventing permanent UX deadlocks if the CLI crashes mid-run\./,
  `A strict \`.openspec-recovery.lock\` is used ONLY during the atomic boot-time recovery phase.`
);

// 10. Renames
content = content.replace(/TerminalIOController/g, 'PayloadLogger');
content = content.replace(/swapStagedWorkspace/g, 'commitStagingTransaction');
content = content.replace(/safeExit/g, 'flushStreamsAndExit');
content = content.replace(/getSandboxPath/g, 'resolveConfinedPath');

// 11. AI-Mutated Lockfile
content = content.replace(
  /If `node_modules` exists but the hash drifted, the CLI executes `npm install --prefer-offline` \(if the AI mutated `package\.json`\) or `npm ci --prefer-offline` \(if only the lockfile drifted\) within the staging directory\./,
  `The AI MUST NEVER mutate \`package-lock.json\` directly. If \`package.json\` drifted, the CLI executes \`npm install\` to natively regenerate the lockfile within the staging directory.`
);

// 12. ReDoS in JS Secret Scanner
content = content.replace(
  /safely bounded JS regex to securely scan long lines/g,
  `safely bounded JS regex (enforcing a strict 500-character line length limit before Regex evaluation) to securely scan long lines`
);

// 13. V8 OOM Concurrency
content = content.replace(
  /stream pipelines in parallel with the `stdin` pipeline/g,
  `stream pipelines wrapped in a concurrency limiter (e.g., \`p-limit(2)\`)`
);
content = content.replace(
  /To prevent cumulative disk exhaustion attacks during the TOCTOU hash check phase, the CLI MUST implement both a per-file size limit \(e\.g\., 50MB\) and a global cumulative byte-size limit \(e\.g\., `MAX_TOTAL_PAYLOAD = 500MB`\) across the entire staging transaction\./,
  `To prevent V8 OOM and disk exhaustion during the TOCTOU hash check phase, the CLI MUST implement a per-file size limit (e.g., 50MB), a global cumulative byte-size limit (e.g., \`MAX_TOTAL_PAYLOAD = 500MB\`), and wrap the hashing stream operations in a concurrency limiter (e.g., \`p-limit(2)\`).`
);

// 14. fs.promises.rm lstat
content = content.replace(
  /falling back to forceful physical deletion via Node's `fs\.promises\.rm\(target, \{ recursive: true, force: true \}\)`/,
  `falling back to forceful physical deletion via Node's \`fs.promises.rm\` (strictly preceded by an \`fs.lstat\` check to prevent following symlinks outside the sandbox)`
);

// 15. Cross platform /dev/null
content = content.replace(
  /\$\{platformNull\}/g,
  `\${platformNullDevice}` // Just a generic placeholder representing dynamically resolved
);
content = content.replace(
  /--userconfig=\/dev\/null, and --globalconfig=\/dev\/null/,
  `--userconfig=\${platformNullDevice}, and --globalconfig=\${platformNullDevice} (dynamically resolved to /dev/null or \\\\.\\NUL)`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 55 complete.');
