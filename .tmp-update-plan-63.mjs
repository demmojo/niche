import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Correctness / Security: Fix proxy wiping contradiction
content = content.replace(
  /When spawning `npm ci`, the CLI MUST explicitly neutralize workspace proxy hijacking by injecting the highest-precedence environment variables into the child process: `NPM_CONFIG_PROXY=""`, `NPM_CONFIG_HTTPS_PROXY=""`, and `NPM_CONFIG_STRICT_SSL="true"`\. /g,
  `When spawning \`npm ci\`, the CLI MUST strictly validate any inherited \`NPM_CONFIG_PROXY\` or \`NPM_CONFIG_HTTPS_PROXY\` environment variables against trusted schemes (\`http\`/\`https\`) to prevent workspace proxy hijacking, rather than blindly wiping them (which would break legitimate corporate firewalls). `
);

// 2. Maintainability / Correctness: Remove dead git hash-object code and hallucinated "native Node.js filesystem hashing -w --stdin"
content = content.replace(
  /The CLI MUST NOT buffer massive file chunks in V8 memory\. It must explicitly stream file descriptors \(`fs\.createReadStream`\) directly and concurrently into `crypto\.createHash\('sha256'\)` to re-hash and verify working tree parity immediately before the final `swapStagingToLive` execution/g,
  `The CLI MUST NOT buffer massive file chunks in V8 memory. It must explicitly stream file descriptors (\`fs.createReadStream\`) directly and concurrently into \`crypto.createHash('sha256')\` to re-hash and verify working tree parity immediately before the final \`swapStagingToLive\` execution` // Already correct, just ensuring it's there
);
content = content.replace(
  /prevent stream injection into `git update-index --index-info` loops/g,
  `prevent Git filename injection when piping to native OS commands` // Genericized since we removed update-index
);

// Remove ANY remaining references to git update-index or git hash-object
content = content.replace(/git update-index --index-info/g, '');
content = content.replace(/git hash-object/g, '');
content = content.replace(/native Node\.js filesystem hashing -w --stdin/g, '');

// 3. Maintainability: Naming Obfuscation (TerminalPresenter -> OutputRouter)
content = content.replace(/TerminalPresenter/g, 'OutputRouter'); 

// 4. Maintainability: Prototype pollution via Object.create(null)
content = content.replace(
  /parse an object instantiated via `Object\.create\(null\)` to neutralize Prototype Pollution at the root level/g,
  `strictly parse the CLI flags`
);

// 5. Correctness: False Atomicity / Error handling ENOTEMPTY
content = content.replace(
  /execute a sequence of asynchronous `fs\.promises\.rename` calls \(wrapped in a concurrency limiter like `p-limit\(4\)` to prevent Event Loop starvation and EMFILE limits\) to move individual mutated files and directories from the `\.tmp\/\[UUID\]` staging directory over the live workspace\./g,
  `execute a sequence of asynchronous \`fs.promises.rename\` calls (wrapped in a concurrency limiter like \`p-limit(4)\` to prevent Event Loop starvation and EMFILE limits) to move individual mutated files and directories from the \`.tmp/[UUID]\` staging directory over the live workspace (explicitly handling \`ENOTEMPTY\` for directories by moving them to \`_old\` first).`
);

// 6. Security: ReDoS Mitigation Gaps
content = content.replace(
  /prohibiting nested quantifiers like `\(a\+\)\+`/g,
  `matching fixed prefixes like \`sk_live_\` first before evaluating regex, and prohibiting nested quantifiers`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 63 complete.');
