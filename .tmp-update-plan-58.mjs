import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// --- PERFORMANCE FIXES ---

// 1. Event Emitter Memory Leak Risk (process.stdout)
content = content.replace(
  /bind `\.on\('error'\)` handlers to `process\.stdout` that specifically swallow `EPIPE` errors ONLY during JSON payload emission/g,
  `bind a one-time \`.once('error')\` handler to \`process.stdout\` that specifically swallows \`EPIPE\` errors ONLY during JSON payload emission, ensuring the listener is immediately removed to prevent Event Emitter memory leaks`
);

// 2. Directory Sweep Memory Spiking (readdir -> opendir)
content = content.replace(
  /using `fs\.promises\.readdir`/g,
  `using \`fs.promises.opendir\`. \`opendir\` provides an async iterator that streams directory entries one by one, scaling infinitely with O(1) memory usage regardless of how many abandoned directories exist`
);

// 3. Asynchronous node_modules copying
content = content.replace(
  /or copying existing `node_modules` first to avoid performance collapse/g,
  `or copying the existing \`node_modules\` first to avoid performance collapse. If copying is chosen, it MUST be executed asynchronously using \`fs.promises.cp\` with \`recursive: true\` alongside other non-blocking staging tasks, never synchronously.`
);

// 4. tmpfs portability
content = content.replace(
  /via a RAM disk \(`tmpfs`, e\.g\., `\/dev\/shm`\)/g,
  `via a RAM disk (\`tmpfs\`, e.g., \`/dev/shm\` on Linux). On environments lacking native unprivileged RAM disks (like Windows or restricted Docker containers), the CLI MUST fallback securely to \`os.tmpdir()\` combined with strict \`0600\` POSIX permissions and an immediate asynchronous \`fs.unlink\` hook after the child process completes.`
);

// --- ARCHITECTURE FIXES ---

// 1. Abstract the tmpfs Requirement
// (Fixed above by adding fallback to os.tmpdir())

// 2. Harden the Swap Sequence
content = content.replace(
  /Once locked, the recovery routine MUST verify if the live workspace is already successfully populated with the new state \(e\.g\., via hash parity\)\./g,
  `Once locked, the recovery routine MUST verify if the live workspace is already successfully populated with the new state (e.g., via hash parity), specifically checking for a "half-swapped" state where \`_old\` directories exist but the new directories haven't been moved in yet, ensuring it can atomically complete or roll back the transaction.`
);

// --- API CONTRACT FIXES ---

// 1. Contradictory Zod validation strategy
content = content.replace(
  /Update Zod schemas to strictly reject unknown flags via `\.strict\(\)`, and explicitly strip `__proto__` and `constructor` to prevent Prototype Pollution, implement string-to-boolean coercion, and deprecate previous manual `\.passthrough\(\)` warning implementations/g,
  `Update Zod schemas to strictly reject unknown flags via \`.strict()\`, explicitly strip \`__proto__\` and \`constructor\` to prevent Prototype Pollution, and implement string-to-boolean coercion. Eliminate any contradictory manual \`.passthrough()\` warning implementations.`
);

// 2. Silent authentication breakage for alternative NPM tokens
content = content.replace(
  /strip `NPM_CONFIG__AUTH` and any other sensitive `NPM_CONFIG_\*` variables \(like `NPM_CONFIG_TOKEN`\) from the `spawn` environment/g,
  `strip \`NPM_CONFIG__AUTH\` and any other sensitive \`NPM_CONFIG_*\` variables (like \`NPM_CONFIG_TOKEN\`) from the \`spawn\` environment. The ephemeral \`.npmrc\` provisioner MUST map all supported legacy auth tokens (like \`NPM_CONFIG_TOKEN\`) to the standard \`_authToken\` configuration internally to prevent silent authentication breakages.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 58 complete.');
