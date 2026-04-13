import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Correctness: Fix silent overwrite of manual edits during package.json atomic swap
content = content.replace(
  /running install, then atomically swapping the updated `node_modules`, `package\.json`, and `package-lock\.json` back into the live workspace\)/,
  `running install. To prevent silently clobbering manual edits, the CLI MUST compute a SHA-256 hash of the live \`package.json\` before staging, and assert this hash matches the live file immediately before the final swap. If drift is detected, abort the swap. Then atomically swap the updated \`node_modules\`, \`package.json\`, and \`package-lock.json\` back into the live workspace)`
);

// 2. Correctness: Fix broken workspace state on interrupted node_modules swap
content = content.replace(
  /It will execute a sequential move of the old directory to `\.old_node_modules`, rename the new directory into place, and asynchronously delete `\.old_node_modules` to minimize the race condition window\./,
  `Instead of removing the live \`node_modules\` first, it will rename the staging directory into place (e.g., \`node_modules_new\`), perform a rapid rename-swap, and asynchronously delete the old directory. Do not leave the primary path empty mid-transaction.`
);

// 3. Correctness: Fix race condition in git worktree teardown sequence
content = content.replace(
  /Future boot-time sweeps will physically delete the directory and then run `git worktree prune` to clean up the metadata once locks are released\./,
  `Strictly use \`git worktree remove --force <path>\` as the sole teardown mechanism. Only fallback to physical deletion followed by \`git worktree prune\` in future boot-time sweeps if the \`remove\` command explicitly failed due to OS-level lock (\`EBUSY\`) restrictions.`
);
content = content.replace(
  /It will forcefully delete these physical directories via Node's `fs\.promises\.rm\(target, \{ recursive: true, force: true \}\)` and execute `git worktree prune` to safely clean up\./,
  `It will use \`git worktree remove --force <path>\`, falling back to forceful physical deletion via Node's \`fs.promises.rm(target, { recursive: true, force: true })\` and executing \`git worktree prune\` only if OS locks persist.`
);

// 4. Correctness: Fix git status null-byte parsing loop index misalignment
content = content.replace(
  /using a `\.split\('\\0'\)` iterator loop\. For rename \(`R`\) and copy \(`C`\) status codes, the iterator MUST explicitly advance its pointer to consume and skip the `old_path` string on the next iteration to prevent treating the source path as a new file modification\. It must also filter out the trailing empty string \(`\.filter\(Boolean\)`\) resulting from the final null byte\./,
  `using a raw \`.split('\\0')\` array with a standard \`for (let i = 0; ...)\` loop. Manually skip empty strings within the loop body, and use \`i++\` safely to bypass the \`old_path\` entry on \`R\` and \`C\` status codes, avoiding mutation issues from pre-filtering.`
);

// 5. Maintainability: Fix Task 0.1 vs Section 5 API Contracts dead code contradiction
content = content.replace(
  /- \[ \] \*\*Task 0\.1\*\*: Implement the suppression logic for `stderr` deprecation warnings when `process\.env\.CI` is true\.\n/,
  `- [ ] **Task 0.1**: Ensure \`stderr\` deprecation warnings are explicitly emitted and NEVER suppressed, even when \`process.env.CI\` is true, enforcing visibility.\n`
);

// 6. Maintainability: Fix naming that obscures intent (SecurePayloadWriter -> PayloadDumper)
content = content.replace(/SecurePayloadWriter/g, 'PayloadDumper');

// 7. Maintainability: Fix naming that obscures intent (fs-intents.test.ts -> AtomicWorkspaceSwap.test.ts)
content = content.replace(/fs-intents\.test\.ts/g, 'AtomicWorkspaceSwap.test.ts');

// 8. Security: Child Process Environment Leakage
content = content.replace(
  /the CLI MUST NOT inject tokens into the global `process\.env`\./,
  `the CLI MUST NOT inject tokens into the global \`process.env\`. The \`env\` object passed to \`spawn\` must explicitly omit or sanitize sensitive inherited variables, as \`child_process.spawn\` inherits the parent shell environment by default.`
);

// 9. Security: Local DoS via Predictable Temp Directories
content = content.replace(
  /a hardcoded allowlist of safe base directories \(e\.g\., `process\.env\.RUNNER_TEMP` or `\/tmp\/openspec-claims`\)/,
  `a hardcoded allowlist of safe base directories. To prevent Local Denial of Service via pre-created paths, use \`fs.mkdtemp\` to generate randomized, unpredictable paths (e.g., \`/tmp/openspec-claims-[random]\`).`
);
content = content.replace(
  /If the directory exists, the CLI MUST assert via `fs\.promises\.stat` that the target directory is owned by the current user and possesses strict `0700` permissions to prevent TOCTOU hijacking by a malicious user in a shared \/tmp\/ environment\. If creating the directory, the CLI MUST enforce `0700` permissions\./,
  `The CLI MUST use \`fs.mkdtemp\` to create a new directory with strict \`0700\` permissions, preventing TOCTOU hijacking by a malicious user in a shared /tmp/ environment.`
);

// 10. Security: ReDoS & Event Loop Starvation
content = content.replace(
  /the scanner will read files into memory with a hard 50MB limit per file, strictly bounded by a concurrency cap \(e\.g\., `p-limit\(4\)`\)/,
  `the scanner MUST be chunked line-by-line via streams or offloaded to Node.js \`worker_threads\` to prevent Event Loop blocking and ReDoS on the main thread.`
);
content = content.replace(
  /Implement the native Node\.js secret scanner \(50MB file limit, concurrency capped at 4\)/,
  `Implement the native Node.js chunked stream or worker-thread secret scanner`
);

// 11. Security: Security Downgrade via Hook Bypass
content = content.replace(
  /Execute `git commit --no-verify` \(or provide an `--ignore-hooks` opt-out\) to bypass remaining slow local hooks, relying on the native stream scanner as the pre-commit safety net\./,
  `Provide an explicit \`--ignore-hooks\` opt-out for environments that need to bypass slow local hooks, but do NOT default to \`--no-verify\`, preserving organizational pre-commit hook security mandates.`
);
content = content.replace(
  /the CLI will execute `git commit --no-verify`\. While general code quality validation \(`npm run lint` or `typecheck`\) will be intentionally deferred to the CI pipeline to prevent bespoke local hooks from breaking the workflow/,
  `the CLI will execute \`git commit\` (respecting organizational hooks by default, with an \`--ignore-hooks\` opt-out). General code quality validation should be explicitly deferred or passed via fast native scanners`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
