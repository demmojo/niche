import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Correctness: Fix node_modules rename swap issue
content = content.replace(
  /it will rename the live directory to an `_old` suffix, rename the staging directory into place, and then asynchronously delete the old directory\. This creates a microsecond transient state where `node_modules` does not exist, but guarantees POSIX atomicity\./,
  `it will rename the live directory to a unique \`_old_[UUID]\` suffix (explicitly catching and swallowing \`ENOENT\` if the directory doesn't exist yet), rename the staging directory into place, and then asynchronously delete the old directory. This creates a microsecond transient state where \`node_modules\` does not exist, but guarantees POSIX atomicity.`
);

// 2. Correctness: Fix Git hash-object contradiction
content = content.replace(
  /The CLI will stream all paths directly into `stdin` while strictly respecting stream backpressure \(using `stream\.pipeline`\)\. It must actively drain the child process `stdout` stream strictly in parallel with the `stdin` pipeline \(e\.g\., using `Promise\.all\(\[stream\.pipeline\(\.\.\.\), consumeStdout\(\.\.\.\)\]\)`\) to prevent OS IPC pipe buffer deadlocks\. \(avoiding `argv` `E2BIG` limits entirely\) to bypass Node memory limits without incurring child-process spawn overhead, strictly avoiding brittle `mtime` checks\) against the index hash\./,
  `The CLI will stream all paths through native Node.js \`crypto.createHash('sha256')\` to verify working tree parity before a standard commit, explicitly abandoning complex \`git hash-object --stdin-paths\` pipelines and OS IPC buffer management.`
);

// 3. Correctness: Fix secret scanner scanning node_modules
content = content.replace(
  /Implement the native Node\.js chunked stream or worker-thread secret scanner during the `--stage` phase inside the `\.tmp\/` directory\./,
  `Implement the native Node.js chunked stream or worker-thread secret scanner during the \`--stage\` phase inside the \`.tmp/\` directory, explicitly configuring the scanner to ignore \`node_modules\` and \`.git\` paths to prevent massive CPU/IO event loop blocking.`
);

// 4. Correctness: Fix EBUSY abandonment lock checks
content = content.replace(
  /The teardown sequence MUST parse Git's `stderr` string and exit code \(e\.g\., 128\) to reliably detect the lock, as Node\.js `try\/catch` will not intercept child process OS failures\./,
  `The teardown sequence MUST rely on a non-zero exit code combined with fallback cleanup logic, rather than parsing Git's \`stderr\` for the exact string 'EBUSY', as OS-specific human-readable translations vary.`
);

// 5. Correctness: Fix PayloadDumper sync serialization
content = content.replace(
  /Standard `JSON\.stringify` is perfectly safe and efficient for stdout emission\. \(e\.g\., `\{ "payloadDumpPath": "\/absolute\/path\/to\/\.tmp\/payload-1234\.json" \}`\)\./,
  `While emitting the tiny 50-byte \`{"payloadDumpPath": "..."}\` to \`stdout\` via standard \`JSON.stringify\` is perfectly safe, the CLI MUST use an asynchronous or streaming JSON serializer strictly when writing the actual large payload (e.g., 50MB) to the dump file on disk, preventing the main Node.js event loop from blocking for hundreds of milliseconds.`
);

// 6. Maintainability: Fix dead/redundant text
content = content.replace(
  /To prevent Denial of Service \(DoS\) memory exhaustion, the CLI MUST enforce a hard ceiling on the maximum number of changed\/untracked files processed \(e\.g\., `MAX_FILES = 25,000`\)\. If the limit is breached, abort with an `E_TOO_MANY_FILES` error\. To prevent Denial of Service \(DoS\) memory exhaustion, the CLI MUST enforce a hard ceiling on the maximum number of changed\/untracked files processed \(e\.g\., `MAX_FILES = 25,000`\)\. If the limit is breached, abort with an `E_TOO_MANY_FILES` error\./,
  `To prevent Denial of Service (DoS) memory exhaustion, the CLI MUST enforce a hard ceiling on the maximum number of changed/untracked files processed (e.g., \`MAX_FILES = 25,000\`). If the limit is breached, abort with an \`E_TOO_MANY_FILES\` error.`
);
content = content.replace(
  /To prevent split-brain states during metadata migrations or file staging, To prevent split-brain states and eliminate the need for complex Write-Ahead Logs \(WAL\) or rollback ledgers, the CLI will embrace \*\*Atomic Directory Swapping\*\*\./,
  `To prevent split-brain states and eliminate the need for complex Write-Ahead Logs (WAL) or rollback ledgers, the CLI will embrace **Atomic Directory Swapping**.`
);

// 7. Maintainability: Rename PayloadDumper -> CliOutputRouter
content = content.replace(/PayloadDumper/g, 'CliOutputRouter');

// 8. Security: Credential Leakage on SIGKILL / OOM (Auth/Authz, OWASP A07)
content = content.replace(
  /Because environment variables injected into `spawn` leak via `\/proc\/<pid>\/environ`, the CLI MUST create an ephemeral `\.npmrc` file inside the isolated `\.tmp\/\[UUID\]` staging directory with strict `0600` permissions containing the auth token\. This file MUST be explicitly deleted immediately after the `npm ci` child process exits\./,
  `Because environment variables injected into \`spawn\` leak via \`/proc/<pid>/environ\`, the CLI MUST create an ephemeral \`.npmrc\` file inside the isolated \`.tmp/[UUID]\` staging directory with strict \`0600\` permissions containing the auth token. This file MUST be explicitly deleted immediately after the \`npm ci\` child process exits. To mitigate indefinite persistence of plaintext tokens in the event of an un-trappable SIGKILL crash, the CLI MUST enforce short-lived (ephemeral) tokens wherever possible, and ensure the root \`.tmp/\` directory is strictly added to \`.gitignore\` to prevent accidental commits.`
);

// 9. Security: ReDoS & DoS in Native Secret Scanning
content = content.replace(
  /the scanner MUST be chunked line-by-line via streams or offloaded to Node\.js `worker_threads` to prevent Event Loop blocking and ReDoS on the main thread\./,
  `the scanner MUST be chunked line-by-line via streams on the main thread, enforcing a hard line-length truncation (e.g., skip or truncate lines > 1024 chars) *before* applying regex patterns to prevent catastrophic backtracking (ReDoS) and Event Loop blocking on minified files.`
);
content = content.replace(
  /Implement the native Node\.js chunked stream or worker-thread secret scanner/,
  `Implement the native Node.js chunked stream secret scanner (truncating long lines)`
);

// 10. Security: OOM Crash via Synchronous File Hashing
content = content.replace(
  /the CLI MUST compute a SHA-256 hash of the live `package\.json` before staging, and assert this hash matches the live file immediately before the final swap\./,
  `the CLI MUST compute a SHA-256 hash of the live \`package.json\` before staging (using a bounded \`fs.createReadStream\` piped into \`crypto.createHash()\`, explicitly rejecting abnormally large files to prevent V8 OOM crashes), and assert this hash matches the live file immediately before the final swap.`
);

// 11. Security: Sensitive Data Leakage in CI Stack Traces
content = content.replace(
  /It will ONLY export `stderr\.log`, `stdout\.log`, `stacktrace\.txt`, and the `openspec\.json` metadata file\./,
  `It will ONLY export \`stderr.log\`, \`stdout.log\`, \`stacktrace.txt\`, and the \`openspec.json\` metadata file. The CLI MUST implement an aggressive \`Error\` prototype sanitizer that strips \`process.env\` and authentication headers from error objects before they are stringified to \`stacktrace.txt\` to prevent internal env leakage.`
);


fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
