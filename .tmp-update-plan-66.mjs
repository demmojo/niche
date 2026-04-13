import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. RCE via npm install fallback (add flags)
content = content.replace(
  /If `package\.json` drifted, the CLI executes `npm install` to natively regenerate the lockfile within the staging directory\./g,
  `If \`package.json\` drifted, the CLI executes \`npm install --ignore-scripts --no-audit --fund=false\` to natively and securely regenerate the lockfile within the staging directory.`
);

// 2. Temporal Paradox in Secret Scanning
// Change from scanning files identified by git diff --cached to scanning them *before* any git add.
// Oh wait, if the staging directory contains the generated files, we scan them directly.
content = content.replace(
  /operating exclusively on the exact list of files staged for commit in the index by running `git diff --cached --name-only` against the live workspace, but reading the physical files from the `\.tmp\/\[UUID\]` staging directory/g,
  `operating comprehensively on the entire \`.tmp/[UUID]\` staging directory *before* any files are swapped into the live workspace or added to the Git index`
);

// 3. Relative Path Corruption in Lockfile Regeneration
content = content.replace(
  /The CLI MUST dynamically re-map or account for any local `file:` or `workspace:` dependencies that rely on relative paths, as the staging directory is at a different depth than the workspace root\./g,
  `To prevent lockfile path corruption, the CLI MUST dynamically rewrite local \`file:\` or \`workspace:\` relative paths to absolute paths bounded by \`resolveConfinedPath\` before executing \`npm install\`, and explicitly revert them to their original relative structure in the generated \`package-lock.json\` before swapping it into the live workspace.`
);

// 4. Event Emitter Memory Leak and Swallow Hazard
content = content.replace(
  /bind a one-time `\.once\('error'\)` handler to `process\.stdout` that specifically swallows `EPIPE` errors ONLY during JSON payload emission, ensuring the listener is immediately removed to prevent Event Emitter memory leaks, ensuring legitimate streaming failures in other contexts are not masked/g,
  `bind an \`.on('error')\` handler to \`process.stdout\` that specifically swallows \`EPIPE\` errors ONLY during JSON payload emission. The CLI MUST explicitly call \`removeListener\` in a \`finally\` block immediately after the payload emission succeeds to prevent memory leaks and ensure subsequent legitimate stream errors are not accidentally swallowed by a lingering \`.once\` listener`
);

// 5. Persistent Credential Leakage via Crash-Only Design
content = content.replace(
  /Because environment variables injected into `spawn` leak via `\/proc\/<pid>\/environ`, the CLI MUST NOT write an ephemeral `\.npmrc` file to physical disk\. Instead, the CLI MUST securely provision it using `os\.tmpdir\(\)` with a highly restricted directory \(`fs\.mkdtemp` with `0700` permissions\)\./g,
  `Because environment variables injected into \`spawn\` leak via \`/proc/<pid>/environ\`, the CLI MUST securely provision an ephemeral \`.npmrc\` using \`os.tmpdir()\` with a highly restricted directory (\`fs.mkdtemp\` with \`0700\` permissions). While the CLI generally embraces a crash-only design, the ephemeral \`.npmrc\` is a strict exception: the CLI MUST explicitly register synchronous \`process.on('exit')\` and \`process.on('SIGINT')\` handlers dedicated solely to securely overwriting and unlinking this specific credentials file before the process terminates.`
);

// 6. Unnecessary Indirection: Global Matrix CI Locks
content = content.replace(
  /To prevent split-brain state corruption from concurrent CLI executions in matrix CI pipelines, the recovery routine MUST first acquire a global atomic lock/g,
  `To prevent split-brain state corruption from concurrent local CLI executions (e.g., a developer rapidly triggering the CLI in multiple terminal tabs), the recovery routine MUST first acquire a local atomic lock`
);

// 7. Brittle OS-Lock Detection
content = content.replace(
  /The teardown sequence MUST force `LC_ALL=C` in the child process `spawn` environment to guarantee POSIX standard English `stderr` output, enabling a reliable string inclusion check for known lock keywords \(e\.g\., 'busy', 'permission', 'lock'\) to differentiate expected OS locks from fatal errors\./g,
  `The teardown sequence MUST rely entirely on standard OS-level or Node.js filesystem error codes (\`EPERM\`, \`EBUSY\`) or the subprocess exit codes, rather than brittle substring matching of English words in \`stderr\`, to differentiate expected OS locks from fatal errors.`
);

// 8. ReDoS in Boot-time Sweep
content = content.replace(
  /enforcing strict regex validation on the filename structure and validating that the `ExpiryTimestamp` is mathematically bounded/g,
  `using strict string splitting (e.g., \`split('-')\`) or regex with zero nested quantifiers to parse the filename structure, and validating that the \`ExpiryTimestamp\` is mathematically bounded`
);

// 9. Naming Obfuscation TerminalPresenter
// Was already updated in previous step, but just to be sure
content = content.replace(/OutputRouter/g, 'TerminalPresenter');

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 66 complete.');
