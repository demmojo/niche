import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. NPM Credential Exfiltration via Workspace Traversal
content = content.replace(
  /The ephemeral `\.npmrc` provisioner MUST map all supported legacy auth tokens/g,
  `When spawning \`npm ci\`, the CLI MUST explicitly neutralize workspace proxy hijacking by injecting the highest-precedence environment variables into the child process: \`NPM_CONFIG_PROXY=""\`, \`NPM_CONFIG_HTTPS_PROXY=""\`, and \`NPM_CONFIG_STRICT_SSL="true"\`. The ephemeral \`.npmrc\` provisioner MUST map all supported legacy auth tokens`
);

// 2. Infeasible RAM Disk Provisioning
content = content.replace(
  /via a RAM disk \(`tmpfs`, e\.g\., `\/dev\/shm` on Linux\)\. On environments lacking native unprivileged RAM disks \(like Windows or restricted Docker containers\), the CLI MUST fallback securely to `os\.tmpdir\(\)` combined with strict `0600` POSIX permissions and an immediate asynchronous `fs\.unlink` hook after the child process completes\./g,
  `strictly targeting OS-provided ephemeral memory stores (e.g., \`/dev/shm\`). If unavailable, the CLI MUST securely fallback to \`os.tmpdir()\` with a highly restricted directory (\`fs.mkdtemp\` with \`0700\` permissions) and explicitly overwrite the file with null bytes before unlinking it to securely erase the token from physical disk.`
);

// 3. Naming Obfuscation & Architectural Drift
content = content.replace(/PayloadWriter/g, 'TerminalPresenter');
content = content.replace(/PayloadDumper/g, 'TerminalPresenter');
content = content.replace(/StructuredOutputManager/g, 'TerminalPresenter');

// 4. Stream Injection via TAB
content = content.replace(
  /contains a `\\n` or `\\r` character/g,
  `contains a \`\\n\`, \`\\r\`, or \`\\t\` (TAB) character`
);
content = content.replace(
  /contain a `\\n` or `\\r` character/g,
  `contain a \`\\n\`, \`\\r\`, or \`\\t\` (TAB) character`
);

// 5. Stale Recovery Lock Deadlock
content = content.replace(
  /Once locked, the recovery routine MUST verify/g,
  `To prevent deadlocks if the crash-only CLI is SIGKILLed while holding the lock, it MUST implement a stale lock detection mechanism (e.g., \`mtime\` expiration checks). Once securely locked, the recovery routine MUST verify`
);

// 6. Secret Scanner Implementation Contradiction
content = content.replace(
  /, explicitly avoiding complex chunked stream overlaps/g,
  ``
);

// 7. Prototype Pollution in Zod Passthrough
content = content.replace(
  /explicitly strip `__proto__` and `constructor` to prevent Prototype Pollution/g,
  `parse an object instantiated via \`Object.create(null)\` to neutralize Prototype Pollution at the root level`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 62 complete.');
