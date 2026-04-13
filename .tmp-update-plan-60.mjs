import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. False Atomicity in Directory Swap (Half-swapped state)
// Ensure rollback/forward mechanism in recovery
content = content.replace(
  /ensuring it can atomically complete or roll back the transaction\./g,
  `ensuring it can atomically complete (by moving the remaining directories in) or roll back (by moving the \`_old\` directories back) the transaction before proceeding.`
);

// 2. RAM Disk Privilege Escalation & Portability
content = content.replace(
  /via a RAM disk \(`tmpfs`, e\.g\., `\/dev\/shm` on Linux\)\. On environments lacking native unprivileged RAM disks \(like Windows or restricted Docker containers\), the CLI MUST fallback securely to `os\.tmpdir\(\)`/g,
  `via standard OS-provided temporary directories (\`os.tmpdir()\`)`
);
content = content.replace(
  /The CLI MUST create a highly restricted directory via `fs\.mkdtemp` with strict `0700` permissions within the RAM disk BEFORE writing the `\.npmrc` file/g,
  `The CLI MUST create a highly restricted directory via \`fs.mkdtemp\` with strict \`0700\` permissions within \`os.tmpdir()\` BEFORE writing the \`.npmrc\` file`
);
content = content.replace(
  /\$\{ephemeralRamDiskNpmrcPath\}/g,
  `\${ephemeralTmpdirNpmrcPath}`
);

// 3. In-Memory Regex Timeout Impossibility
content = content.replace(
  /and wrapping execution in a hard timeout to prevent ReDoS/g,
  `Because standard JS regex cannot be timed out on the main thread, the CLI MUST rely exclusively on pre-audited regex patterns with no nested quantifiers, or implement a state-machine/token-based scanner to guarantee no ReDoS vulnerability`
);

// 4. Race Condition with Asynchronous node_modules Copy
content = content.replace(
  /it MUST be executed asynchronously using `fs\.promises\.cp` with `recursive: true` alongside other non-blocking staging tasks, never synchronously\./g,
  `it MUST be executed asynchronously using \`fs.promises.cp\` with \`recursive: true\` and fully resolve (e.g., \`await\`) BEFORE spawning the \`npm ci\` child process to prevent hydration failures on mutating structures.`
);

// 5. Relative Path Breakage in Staged npm install
content = content.replace(
  /The AI MUST NEVER mutate `package-lock\.json` directly\. If `package\.json` drifted, the CLI executes `npm install` to natively regenerate the lockfile within the staging directory\./g,
  `The AI MUST NEVER mutate \`package-lock.json\` directly. If \`package.json\` drifted, the CLI executes \`npm install\` to natively regenerate the lockfile within the staging directory. The CLI MUST dynamically re-map or account for any local \`file:\` or \`workspace:\` dependencies that rely on relative paths, as the staging directory is at a different depth than the workspace root.`
);

// 6. Secret Scanner Sliding Window Blind Spot
content = content.replace(
  /overlap \(e\.g\., 500 chars with 50-char overlap\)/g,
  `overlap explicitly sized to exceed the maximum expected length of secrets (e.g., 2048+ characters) to prevent long secrets like RSA keys or JWTs from bypassing detection at boundaries`
);

// 7. Parsing Conflict in --name-only -z
// Ensure we're not advancing to skip old_path
content = content.replace(
  /explicitly verifying the exact status code prefix \(e\.g\., `R `, `C `, `RM`\) before advancing the iterator to skip the `old_path`, preventing valid files from being swallowed/g,
  `Because \`--name-only\` does not output status codes or \`old_path\` permutations, the parser MUST NOT attempt to skip any strings, preventing valid changed files from being silently dropped.`
);

// 8. File Read TOCTOU Vulnerability (fs.createReadStream package.json)
content = content.replace(
  /enforce `fs\.promises\.lstat` before opening any read streams to reject symlinks, then compute a SHA-256 hash of the live `package\.json` and `package-lock\.json` before staging \(using a bounded `fs\.createReadStream` piped into `crypto\.createHash\(\)`/g,
  `use \`fs.promises.open()\` to acquire an immutable file descriptor handle, verify it is not a symlink via \`handle.stat()\`, and then stream directly from the handle into \`crypto.createHash()\` to prevent TOCTOU symlink swapping`
);

// 9. Naming Obfuscation
content = content.replace(/StructuredOutputManager/g, 'PayloadWriter'); // Or LogRouter

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 60 complete.');
