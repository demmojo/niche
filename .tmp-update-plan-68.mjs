import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Persistent Deadlock via Flawed Locking Mechanism
content = content.replace(
  /creating a `\.openspec-recovery\.lock` directory using `mkdir`/g,
  `using POSIX advisory record locking (e.g., \`fs-ext\`'s \`flock\` or \`lockf\` on a \`.openspec-recovery.lock\` file)`
);
content = content.replace(
  /To prevent deadlocks if the crash-only CLI is SIGKILLed while holding the lock, it MUST implement a stale lock detection mechanism \(e\.g\., `mtime` expiration checks\)\. Once securely locked/g,
  `Because POSIX advisory locks are tied to the process's file descriptor table, the OS kernel mathematically guarantees the lock is released instantly if the process terminates (even via \`SIGKILL\`), completely eliminating permanent deadlocks and the need for brittle time-based heuristics. Once securely locked`
);

// 2. Orphaned Plaintext Credentials in System /tmp
content = content.replace(
  /securely provision an ephemeral `\.npmrc` using `os\.tmpdir\(\)` with a highly restricted directory \(`fs\.mkdtemp` with `0700` permissions\)/g,
  `securely provision an ephemeral \`.npmrc\` inside the workspace's *local* \`.tmp/[UUID]/\` staging directory (with strict \`0600\` permissions)`
);
content = content.replace(
  /\$\{ephemeralTmpdirNpmrcPath\}/g,
  `\${localStagingNpmrcPath}`
);

// 3. Temporal Paradox in Secret Scanning
// Already updated in previous step? Wait, let's check what it says currently.
content = content.replace(
  /operating comprehensively on the entire `\.tmp\/\[UUID\]` staging directory \*before\* any files are swapped into the live workspace or added to the Git index/g,
  `operating comprehensively on the entire \`.tmp/[UUID]\` staging directory *before* any files are swapped into the live workspace or added to the Git index`
);

// 4. Relative Path Corruption & JSON Injection (Lockfile Regeneration)
content = content.replace(
  /The CLI MUST dynamically rewrite local `file:` or `workspace:` relative paths to absolute paths bounded by `resolveConfinedPath` before executing `npm install`, and explicitly revert them to their original relative structure in the generated `package-lock\.json` before swapping it into the live workspace\. To prevent V8 memory bloat and Event Loop starvation on massive enterprise lockfiles, the CLI MUST use a streaming JSON transformer or a `readline` stream to mutate these paths on-the-fly, strictly forbidding synchronous `JSON\.parse\(\)` on the entire AST\./g,
  `The CLI MUST dynamically rewrite local \`file:\` or \`workspace:\` relative paths to absolute paths bounded by \`resolveConfinedPath\` before executing \`npm install\`, and explicitly revert them to their original relative structure in the generated \`package-lock.json\` before swapping it into the live workspace. To prevent V8 memory bloat, JSON injection vulnerabilities, and Event Loop starvation on massive enterprise lockfiles, the CLI MUST use a dedicated, memory-efficient streaming JSON parser (such as \`stream-json\`) to safely mutate these paths on-the-fly while guaranteeing AST integrity and proper string escaping, strictly forbidding synchronous \`JSON.parse()\` on the entire AST or raw text/regex replacements.`
);

// 5. Unreachable Boot-Time Sweep / Event Loop Dead Code
content = content.replace(
  /wrapped in a detached, unreferenced timer \(`setTimeout\(sweep, 5000\)\.unref\(\)`\)/g,
  `executed immediately upon boot using asynchronous I/O and explicitly unreferenced (\`.unref()\`) from the main event loop, without any \`setTimeout\` delay that would prevent it from running in short-lived CLI commands`
);

// 6. Missing Deletion Propagation in Atomic Swap
content = content.replace(
  /execute a sequence of asynchronous `fs\.promises\.rename` calls \(wrapped in a concurrency limiter like `p-limit\(100\)` because `fs\.rename` only updates directory indices and does not hold open file descriptors like `fs\.open`, maximizing NVMe disk IOPS\) to move individual mutated files and directories from the `\.tmp\/\[UUID\]` staging directory over the live workspace \(explicitly handling `ENOTEMPTY` for directories by moving them to `_old` first\)\./g,
  `execute a sequence of asynchronous \`fs.promises.rename\` calls (wrapped in a concurrency limiter like \`p-limit(100)\` to maximize NVMe disk IOPS) to move individual mutated files and directories from the \`.tmp/[UUID]\` staging directory over the live workspace (explicitly handling \`ENOTEMPTY\` for directories by moving them to \`_old\` first). Furthermore, the atomic swap sequence MUST explicitly read a ledger or diff generated during staging to execute \`fs.promises.rm\` on files that were deleted by the AI, ensuring perfect parity with the staging environment.`
);

// 7. Over-Engineered CI Artifact Redaction
content = content.replace(
  /For `stderr\.log` and `stdout\.log`, the CLI MUST implement a memory-efficient stream transformer that redacts known secrets \(using the same comprehensive entropy and regex-based secret scanning logic employed in the core staging pipeline \(not just brittle exact string matching\)\) across all exported log files before writing them to the `\.openspec-failed-artifacts\/` directory\./g,
  `For \`stderr.log\` and \`stdout.log\`, the CLI MUST completely omit dumping \`process.env\`, HTTP request headers, and sensitive payload variables from the crash logs in the first place, rather than attempting to build a complex, bespoke streaming redaction engine inside an error dumper.`
);

// 8. TerminalPresenter Naming Obfuscation
content = content.replace(/TerminalPresenter/g, 'StdioRouter');

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 68 complete.');
