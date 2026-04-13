import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// Correctness: Git porcelain parsing
content = content.replace(
  /parser MUST split the output by `\\0` and filter empty strings/g,
  "parser MUST split the output by `\\0`, explicitly slice off the 3-byte status prefix (e.g., ' M ', '?? '), and correctly parse renamed files (which include both new and old paths)"
);

// Correctness & Security: EBUSY exit code fallacy
content = content.replace(
  /MUST rely strictly on standard Node\.js filesystem error codes \(e\.g\., `EPERM`, `EBUSY`\) or standard exit codes/g,
  "MUST rely on standard Node.js error codes for spawn failures, and explicitly check Git's exit code combined with `stderr` substring matching to detect directory locks if Git itself fails to delete the worktree"
);

// Correctness & Maintainability: Drop lockfile path rewriting streaming abstraction
content = content.replace(
  /require a dedicated, memory-efficient streaming JSON parser \(`stream-json`\) for `package-lock\.json` path mutation/g,
  "utilize standard `JSON.parse()` for `package-lock.json` path mutation, as AST streaming is a premature abstraction for lockfiles"
);

// Correctness & Security: .npmrc SIGKILL cleanup and GC logging
content = content.replace(
  /The cleanup routine MUST swallow `ENOENT`/g,
  "To prevent infinite disk bloat, if the cleanup routine encounters permanent `EPERM` or `EBUSY` locks on stale directories, it MUST log a warning to stderr rather than silently swallowing the error forever. Furthermore, the cleanup routine MUST instantly shred any `.npmrc` files found within `.tmp/` ignoring TTL, to prevent SIGKILL credential leakage. The routine MUST swallow `ENOENT`"
);

// Maintainability: Remove worker_threads for secret scanning
content = content.replace(
  /MUST be offloaded to a dedicated Node\.js `worker_threads` pool to parallelize the hashing and entropy checks without blocking the main event loop\. To prevent massive V8 isolate memory spikes and OOM crashes on memory-constrained CI runners, the pool size MUST be hard-capped independently of CPU cores \(e\.g\., `Math\.min\(4, os\.cpus\(\)\.length\)`\) and utilize `SharedArrayBuffer` where possible to pass file chunks without copying data across the isolate boundary\./g,
  "MUST be executed synchronously on the main thread using standard regex (or delegated to a highly optimized native binary like ripgrep) to avoid the premature abstraction, IPC overhead, and memory bloat of a `worker_threads` pool."
);

// Security: GIT_* env vars
content = content.replace(
  /The `env` object passed to the `spawn` call MUST strictly filter out any keys matching/g,
  "The `env` object passed to the `spawn` call MUST strictly filter out dangerous Git variables (`GIT_ASKPASS`, `GIT_SSH_COMMAND`, `GIT_PROXY_COMMAND`, `GIT_EDITOR`) as well as keys matching"
);

// Security: Symlinks in Secret Scanner
content = content.replace(
  /the Secret Scanner MUST operate comprehensively/g,
  "the Secret Scanner MUST use `fs.promises.lstat` to explicitly ignore symlinks (preventing out-of-bounds traversal) and operate comprehensively"
);

// Empty command blocks fixing
content = content.replace(/directly into\s{2}/g, 'directly into the object database using `git hash-object -w --stdin` ');
content = content.replace(/exact blob ID \(\)/g, 'exact blob ID (`git update-index --cacheinfo`)');

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 70 complete.');
