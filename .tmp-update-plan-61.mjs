import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// --- PERFORMANCE ORACLE FIXES ---

// 1. Remove node_modules copying (I/O Bottleneck)
content = content.replace(
  /or copying the existing `node_modules` first to avoid performance collapse\. If copying is chosen, it MUST be executed asynchronously using `fs\.promises\.cp` with `recursive: true` and fully resolve \(e\.g\., `await`\) BEFORE spawning the `npm ci` child process to prevent hydration failures on mutating structures\./g,
  `The CLI MUST strictly forbid recursively copying \`node_modules\` via \`fs.promises.cp\` to prevent catastrophic disk I/O bottlenecks. Instead, it MUST leverage a shared immutable NPM cache (\`npm ci --prefer-offline --cache=.openspec-npm-cache\`) to ensure fast, safe, native dependency resolution within the staging directory.`
);

// 2. Eradicate In-Memory Byte Buffers (Memory Leak & OOM)
content = content.replace(
  /The CLI must explicitly re-hash and verify working tree parity immediately before the final `commitStagingTransaction` execution to detect manual edits/g,
  `The CLI MUST NOT buffer massive file chunks in V8 memory. It must explicitly stream file descriptors (\`fs.createReadStream\`) directly and concurrently into \`crypto.createHash('sha256')\` to re-hash and verify working tree parity immediately before the final \`commitStagingTransaction\` execution`
);

// 3. Synchronous Staging Swaps (Event Loop Blocking)
content = content.replace(
  /execute a sequence of `fs\.renameSync` calls moving individual mutated files and directories/g,
  `execute a sequence of asynchronous \`fs.promises.rename\` calls (wrapped in a concurrency limiter like \`p-limit(4)\` to prevent Event Loop starvation and EMFILE limits) to move individual mutated files and directories`
);

// 4. Background Cleanup Thundering Herd
content = content.replace(
  /falling back to forceful physical deletion via Node's `fs\.promises\.rm` \(which natively and safely unlinks symlinks without following them, removing the need for a custom TOCTOU-vulnerable `lstat` check\)/g,
  `falling back to forceful physical deletion via Node's \`fs.promises.rm(..., { recursive: true })\`. This recursive deletion MUST be wrapped in a concurrency limiter (e.g., \`p-limit(2)\`) to prevent file descriptor queue exhaustion (\`EMFILE\`) and foreground I/O starvation`
);

// 5. Configurable Limits
content = content.replace(
  /hard ceiling on the maximum number of changed\/untracked files processed \(e\.g\., `MAX_FILES = 25,000`\)/g,
  `hard ceiling on the maximum number of changed/untracked files processed (e.g., \`MAX_FILES = 25,000\`, strictly configurable via the \`OPENSPEC_MAX_FILES\` environment variable for enterprise monorepos)`
);
content = content.replace(
  /global cumulative byte-size limit \(e\.g\., `MAX_TOTAL_PAYLOAD = 500MB`\)/g,
  `global cumulative byte-size limit (e.g., \`MAX_TOTAL_PAYLOAD = 500MB\`, strictly configurable via the \`OPENSPEC_MAX_PAYLOAD_MB\` environment variable)`
);

// --- ARCHITECTURE STRATEGIST FIXES ---

// 1. Windows EBUSY / EPERM Lock Contention in Rename
content = content.replace(
  /rename individual active directories \(like `node_modules`\) to a unique `\.tmp\/node_modules_old_\[UUID\]` suffix, then immediately rename the corresponding updated directory/g,
  `rename individual active directories (like \`node_modules\`) to a unique \`.tmp/node_modules_old_[UUID]\` suffix. To mitigate transient Windows OS locks (e.g., TS Server, antivirus), this rename MUST be wrapped in a fast retry-loop with jittered exponential backoff. Then immediately rename the corresponding updated directory`
);

// --- API CONTRACT REVIEWER FIXES ---

// 1. Zod Deprecation Warning backward compatibility breaking
content = content.replace(
  /Eliminate any contradictory manual `\.passthrough\(\)` warning implementations\./g,
  `To ensure backward compatibility during the transition, explicit CLI flag aliases and legacy fallbacks MUST be typed and handled within the Zod schema before the \`.strict()\` enforcement applies.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 61 complete.');
