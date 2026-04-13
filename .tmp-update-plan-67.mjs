import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// --- PERFORMANCE ORACLE FIXES ---

// 1. Main-Thread Secret Scanner Bottleneck (CPU) -> Move back to worker_threads (we flipped this earlier based on maintainability, but performance oracle rightly points out it's too slow for 25k files)
content = content.replace(
  /MUST execute directly within the async control flow \(yielding to the event loop using a time-sliced budget, e\.g\., only yielding via `setImmediate` if the synchronous execution block exceeds 15ms, preventing catastrophic context-switching overhead while maintaining responsiveness\)/g,
  `MUST be offloaded to a dedicated Node.js \`worker_threads\` pool (sized to \`os.cpus().length\`) to parallelize the hashing and entropy checks without blocking the main event loop`
);

// 2. package-lock.json AST Memory Bloat (Memory/CPU)
content = content.replace(
  /explicitly revert them to their original relative structure in the generated `package-lock\.json` before swapping it into the live workspace\./g,
  `explicitly revert them to their original relative structure in the generated \`package-lock.json\` before swapping it into the live workspace. To prevent V8 memory bloat and Event Loop starvation on massive enterprise lockfiles, the CLI MUST use a streaming JSON transformer or a \`readline\` stream to mutate these paths on-the-fly, strictly forbidding synchronous \`JSON.parse()\` on the entire AST.`
);

// 3. I/O Concurrency Starvation
content = content.replace(
  /wrapped in a concurrency limiter like `p-limit\(4\)` to prevent Event Loop starvation and EMFILE limits/g,
  `wrapped in a concurrency limiter like \`p-limit(100)\` because \`fs.rename\` only updates directory indices and does not hold open file descriptors like \`fs.open\`, maximizing NVMe disk IOPS`
);

// 4. Boot-Time GC Deferral
content = content.replace(
  /The system is inherently self-healing and requires no user intervention; orphaned directories matching the TTL expiry will be asynchronously pruned in the background without blocking the main execution thread\./g,
  `The system is inherently self-healing. To prevent disk I/O saturation concurrently with CLI startup, the asynchronous prune operation MUST be wrapped in a detached, unreferenced timer (\`setTimeout(sweep, 5000).unref()\`) to strictly defer garbage collection I/O until after the CLI's critical execution path completes.`
);


// --- API CONTRACT REVIEWER FIXES ---

// 1. Silent suppression of NPM lifecycle scripts / Isolation from workspace .npmrc
content = content.replace(
  /ignoring the workspace root entirely\)\./g,
  `ignoring the workspace root entirely). However, to support enterprise monorepos relying on complex local \`.npmrc\` definitions for internal scoped packages, the CLI MUST dynamically parse and merge safe registry configurations from the workspace root \`.npmrc\` into the ephemeral \`.npmrc\` before spawning \`npm ci\` or \`npm install\`. Furthermore, to support native binary compilation (e.g., Prisma, esbuild), the CLI MUST provide an explicit \`--allow-scripts\` opt-in flag to safely bypass the default \`--ignore-scripts\` staging restriction when strictly necessary.`
);


// --- ARCHITECTURE STRATEGIST FIXES ---

// 1. Cross-Device Link Errors (EXDEV) Fallbacks
content = content.replace(
  /execute a sequence of top-level atomic swaps\. For massive directories like `node_modules`, rename the live directory to `node_modules_old_\[UUID\]` using a single `fs\.renameSync`, then execute a single `fs\.renameSync` to move the staging `node_modules` into the live path, achieving O\(1\) swap speed\./g,
  `execute a sequence of top-level atomic swaps. For massive directories like \`node_modules\`, rename the live directory to \`node_modules_old_[UUID]\` using a single \`fs.renameSync\`, then execute a single \`fs.renameSync\` to move the staging \`node_modules\` into the live path, achieving O(1) swap speed. If \`fs.renameSync\` throws an \`EXDEV\` error (Cross-device link) due to \`.tmp/\` crossing a mount boundary, the CLI MUST gracefully fallback to a recursive copy-and-delete (\`fs.promises.cp\`), acknowledging the loss of true atomicity but maintaining functional compatibility.`
);

// 2. Workspace Ignore Rules
content = content.replace(
  /All transient staging environments will be built locally within the workspace's `\.tmp\/` directory\./g,
  `All transient staging environments will be built locally within the workspace's \`.tmp/\` directory. Upon initialization, the CLI MUST automatically ensure \`.tmp/\` is appended to the workspace's \`.gitignore\`, \`.eslintignore\`, and \`.prettierignore\` to prevent IDE language servers from aggressively indexing the thousands of files generated during staging, which prevents \`EBUSY\` lock contentions.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 67 complete.');
