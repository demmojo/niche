import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Correctness: Fix NPM Configuration Precedence Vulnerability & Crash-only Orphaned .npmrc
content = content.replace(
  /the CLI MUST create an ephemeral `\.npmrc` file with strict `0600` permissions exclusively in an OS-level `tmpfs` directory[\s\S]*?never orphaned on persistent storage\./,
  `the CLI MUST create an ephemeral \`.npmrc\` file with strict \`0600\` permissions exclusively inside the highly scoped, workspace-local \`.tmp/[UUID]\` staging directory. By placing it here, the existing synchronous boot-time sweep natively garbage collects any orphaned credentials after a catastrophic SIGKILL crash. To prevent configuration precedence vulnerabilities where a malicious workspace-level \`.npmrc\` overrides the ephemeral config, the CLI must enforce \`--userconfig=.npmrc\` and explicitly run the \`npm ci\` process from within the staging directory (ignoring the workspace root entirely).`
);
content = content.replace(
  /create an ephemeral `\.npmrc` file inside `os\.tmpdir\(\)` with strict `0600` permissions/,
  `create an ephemeral \`.npmrc\` file inside the isolated \`.tmp/[UUID]\` staging directory with strict \`0600\` permissions`
);

// 2. Correctness/Maintainability: Fix "openspec recover" Dead Code & Architecture Contradiction
content = content.replace(
  /relying entirely on the explicit `openspec recover` workflow to clean up partial states on the next boot\./,
  `relying entirely on the synchronous boot-time sweep to automatically clean up partial states on the next boot.`
);

// 3. Correctness: Fix Asynchronous API in Synchronous Boot Sweep
content = content.replace(
  /Implement a fast, synchronous boot-time check of the `\.tmp\/` directory using `fs\.promises\.opendir`\./,
  `Implement a fast, synchronous boot-time check of the \`.tmp/\` directory using \`fs.readdirSync\` with the \`withFileTypes: true\` option.`
);

// 4. Correctness: Fix git status -z parsing logic for rename/copy
content = content.replace(
  /using a simple `\.split\('\\0'\)` iterator loop that handles rename\/copy sequences \(`R` or `C` status codes followed by `new_path\\0old_path\\0`\) and explicitly filters out the trailing empty string/,
  `using a \`.split('\\0')\` iterator loop. For rename (\`R\`) and copy (\`C\`) status codes, the iterator MUST explicitly advance its pointer to consume and skip the \`old_path\` string on the next iteration to prevent treating the source path as a new file modification. It must also filter out the trailing empty string`
);

// 5. Correctness: Fix TOCTOU manual edit clobbering window
content = content.replace(
  /If hash drift is detected \(indicating a human edit mid-flight\) or `ENOENT` is thrown, the transaction will explicitly abort, prompting the user\. It will never force-clobber the working directory\./,
  `If hash drift is detected (indicating a human edit mid-flight) or \`ENOENT\` is thrown, the transaction will explicitly abort, prompting the user. To close the microsecond TOCTOU window between hash verification and the \`fs.renameSync\` swap, the CLI will use \`fs.open(..., 'r+')\` to acquire exclusive advisory locks (where OS-supported) on the target files before the final overwrite. It will never force-clobber manually modified files.`
);

// 6. Security/Correctness: Fix DoS via Unbounded File Counts
content = content.replace(
  /Furthermore, when extracting modified or untracked paths, the CLI will execute `git status --porcelain -z`/,
  `To prevent Denial of Service (DoS) memory exhaustion, the CLI MUST enforce a hard ceiling on the maximum number of changed/untracked files processed (e.g., \`MAX_FILES = 25,000\`). If the limit is breached, abort with an \`E_TOO_MANY_FILES\` error. Furthermore, when extracting modified or untracked paths, the CLI will execute \`git status --porcelain -z\``
);

// 7. Security: Fix TOCTOU Directory Hijacking on Payload Dumps
content = content.replace(
  /If creating the directory, the CLI MUST enforce `0700` permissions\./,
  `If the directory exists, the CLI MUST assert via \`fs.promises.stat\` that the target directory is owned by the current user and possesses strict \`0700\` permissions to prevent TOCTOU hijacking by a malicious user in a shared /tmp/ environment. If creating the directory, the CLI MUST enforce \`0700\` permissions.`
);

// 8. Security/Maintainability: Fix OutputFormatter Naming & Scope Bloat
content = content.replace(/OutputFormatter/g, 'SecurePayloadWriter');

// 9. Security/Maintainability: Fix Prototype Pollution via Zod Stripping
content = content.replace(
  /the CLI MUST explicitly strip all unknown keys from the options object immediately after the Zod parsing boundary \(before any core business logic evaluates it\) to prevent Prototype Pollution or argument injection vulnerabilities \(e\.g\., into `child_process\.spawn`\), explicitly avoiding custom coercion layers to prevent technical debt\./,
  `the CLI MUST compare \`Object.keys(input)\` against the Zod schema keys to trigger deprecation warnings, then strictly use Zod's native \`.strict()\` or \`.strip()\` parsing methods to return the sanitized options object securely, explicitly avoiding manual key deletion loops to prevent Prototype Pollution vulnerabilities.`
);

// 10. Security: Fix ReDoS Dependency Risk (node-re2 fallback)
content = content.replace(
  /MUST pipe stdout\/stderr through a redacting stream using a non-backtracking regex engine \(e\.g\., `node-re2`\) to prevent ReDoS\. It must strictly mask known, rigid secret prefixes rather than computing expensive high-entropy math on large logs/,
  `MUST pipe stdout/stderr through a redacting stream. To prevent ReDoS and avoid cross-platform native compilation failures (e.g., \`node-gyp\` on M-series Macs), the redactor MUST utilize simple, static string replacements (\`.replaceAll()\`) for known rigid secret prefixes or a strictly bounded JS regex engine fallback, strictly avoiding expensive high-entropy math on large logs`
);

// 11. Security: Uncaught ENOENT on .tmp validation
content = content.replace(
  /Before creating the `\[UUID\]` subdirectory, the CLI MUST assert via `fs\.promises\.lstat` that the base `\.tmp` directory is a physical directory, strictly rejecting symlinks to prevent traversal escapes\./,
  `Before creating the \`[UUID]\` subdirectory, the CLI MUST assert via \`fs.promises.lstat\` that the base \`.tmp\` directory is a physical directory, explicitly catching \`ENOENT\` to safely create the \`.tmp\` directory on fresh clones, and strictly rejecting symlinks to prevent traversal escapes.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update complete.');
