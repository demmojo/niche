import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// --- PERFORMANCE ORACLE FIXES ---

// 1. Boot-Time GC Disk I/O Contention at Boot (Thundering Herd)
content = content.replace(
  /To prevent disk I\/O saturation concurrently with CLI startup, the asynchronous prune operation MUST be wrapped in a detached, unreferenced timer \(`setTimeout\(sweep, 5000\)\.unref\(\)`\) to strictly defer garbage collection I\/O until after the CLI's critical execution path completes\./g,
  `To prevent disk I/O saturation concurrently with CLI startup, the asynchronous prune operation MUST NOT run during the boot sequence. It MUST be spawned as a completely detached, lower-priority background child process (e.g., \`child_process.spawn(..., { detached: true, stdio: 'ignore' })\` and \`unref()\`) or explicitly deferred to run immediately prior to \`process.exit\`, ensuring garbage collection never blocks or competes with the CLI's critical execution path.`
);

// 2. Worker Thread Pool Memory Spikes
content = content.replace(
  /MUST be offloaded to a dedicated Node\.js `worker_threads` pool \(sized to `os\.cpus\(\)\.length`\) to parallelize the hashing and entropy checks without blocking the main event loop/g,
  `MUST be offloaded to a dedicated Node.js \`worker_threads\` pool to parallelize the hashing and entropy checks without blocking the main event loop. To prevent massive V8 isolate memory spikes and OOM crashes on memory-constrained CI runners, the pool size MUST be hard-capped independently of CPU cores (e.g., \`Math.min(4, os.cpus().length)\`) and utilize \`SharedArrayBuffer\` where possible to pass file chunks without copying data across the isolate boundary.`
);

// 3. I/O Concurrency Starvation & Misaligned Concurrency Limits
content = content.replace(
  /wrapped in a concurrency limiter scaled to the host's capabilities \(e\.g\., `p-limit\(Math\.max\(4, os\.cpus\(\)\.length\)\)`\) to maximize NVMe SSD throughput without exhausting `EMFILE` limits/g,
  `wrapped in a flat, OS-safe concurrency limiter (e.g., \`p-limit(64)\` across macOS/Linux) to maximize NVMe SSD throughput while absolutely guaranteeing no \`EMFILE\` (file descriptor exhaustion) crashes, decoupling I/O bounds from irrelevant CPU core counts`
);
content = content.replace(
  /wrapped in a concurrency limiter like `p-limit\(100\)` to maximize NVMe disk IOPS/g,
  `wrapped in a safe concurrency limiter (e.g., \`p-limit(64)\`) to maximize NVMe disk IOPS without hitting \`libuv\` default file descriptor limits on macOS`
);

// --- ARCHITECTURE STRATEGIST FIXES ---

// 1. CI Cache Poisoning Defense
content = content.replace(
  /Upon initialization, the CLI MUST automatically ensure `\.tmp\/` is appended to the workspace's `\.gitignore`, `\.eslintignore`, and `\.prettierignore`/g,
  `Upon initialization, the CLI MUST automatically ensure \`.tmp/\` is appended to the workspace's \`.gitignore\`, \`.eslintignore\`, and \`.prettierignore\` (to prevent IDE lock contentions). Furthermore, the CLI MUST explicitly document that CI/CD cache definitions (e.g., GitHub Actions \`actions/cache\`) must exclude the \`.tmp/\` and \`.openspec-failed-artifacts/\` directories to prevent massive failed staging states from ballooning cache sizes and degrading CI performance.`
);

// 2. Harden Boot-Time Swap Recovery
content = content.replace(
  /specifically checking for a "half-swapped" state where `_old` directories exist but the new directories haven't been moved in yet, ensuring it can atomically complete \(by moving the remaining directories in\) or roll back \(by moving the `_old` directories back\) the transaction before proceeding\./g,
  `specifically checking for a deterministic "half-swapped" state indicator (e.g., an explicit \`.openspec-swap-in-progress\` marker file created *before* the 3-step directory rename begins). This gives the boot sweep absolute certainty to either roll forward (by moving the remaining directories in) or roll backward (by moving the \`_old\` directories back) if the workspace was interrupted mid-swap, before deleting the marker file.`
);

// --- API CONTRACT REVIEWER FIXES ---

// 1. Breaking default: --ignore-scripts breaking postinstall native binaries
// We already added `--allow-scripts` in the previous round, but the contract reviewer highlighted that defaulting to `--ignore-scripts` is a major breaking change for existing projects (Prisma, esbuild).
// Let's ensure the deprecation / breaking change documentation is explicit about this in Section 5.
content = content.replace(
  /- \*\*NPM Authentication\*\*: Global environment variables \(`NPM_CONFIG__AUTH`\) are strictly ignored\./g,
  `- **Native Dependency Scripts**: The CLI will now execute \`npm ci\` and \`npm install\` with \`--ignore-scripts\` by default to secure the staging environment. This is a **major breaking change** for consumer projects relying on \`postinstall\` scripts for native binaries (e.g., Prisma, esbuild, node-sass). These projects MUST now explicitly pass the \`--allow-scripts\` opt-in flag, or their builds will silently fail to compile during staging.\n- **NPM Authentication**: Global environment variables (\`NPM_CONFIG__AUTH\`) are strictly ignored.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 69 complete.');
