import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// --- CORRECTNESS FIXES ---

// 1. Data Loss via Root Directory Rename
// (Checked previously, but let's make sure it's fully clarified).
content = content.replace(
  /rename the fully prepared staging directory into the original live workspace path/g,
  `rename individual directories from the staging directory into their respective original live workspace paths`
);

// 2. POSIX renameSync into non-empty ancestor
// Already mitigated by the above, but let's ensure it says "rename individual mutated files/folders from .tmp/[UUID] into the live workspace".
content = content.replace(
  /rename individual active directories \(like `node_modules`\) to a unique `\.tmp\/node_modules_old_\[UUID\]` suffix, then immediately rename the staging directory into place, and finally asynchronously delete the old directory\./g,
  `rename individual active directories (like \`node_modules\`) to a unique \`.tmp/node_modules_old_[UUID]\` suffix, then immediately rename the corresponding updated directory from the \`.tmp/[UUID]\` staging folder into the live workspace path, and finally asynchronously delete the old directory.`
);

// 3. NPM authentication fail due to conflicting config
content = content.replace(
  /--userconfig=\$\{platformNullDevice\}, and --globalconfig=\$\{platformNullDevice\}/g,
  `--userconfig=\${platformRamDiskNpmrcPath}, and --globalconfig=\${platformNullDevice}`
);

// 4. Git status output mismatch (git diff --cached --name-only doesn't output statuses or old_path)
content = content.replace(
  /Furthermore, when extracting modified or untracked paths, the CLI will execute `git status --porcelain -z` and parse the UTF-8 output using a raw `\.split\('\\0'\)` array.*?old_path.*?avoiding mutation issues from pre-filtering\./s,
  `Furthermore, when extracting paths during staging, the CLI will use \`git diff --cached --name-only -z\` and explicitly parse the null-terminated UTF-8 output. Because \`--name-only\` does not output status codes or \`old_path\` entries, the parser MUST split by \`\\0\` and filter empty strings without attempting to skip \`old_path\` permutations.`
);

// --- MAINTAINABILITY FIXES ---

// 1. Unnecessary Indirection: Remove Git stream abstractions entirely.
// We already replaced it with standard Node.js crypto hashing, but let's ensure the wording is clear.
// Replaced in previous round, but maintainability subagent still flagged "Reimplementing Git object database ingestion". 
content = content.replace(
  /To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will ingest the files directly into the Git object database \*during\* the hash phase using `git hash-object -w --stdin-paths` \(which returns the blob ID\)\. In the `--apply` phase, the CLI will update the Git index directly using that exact blob ID \(`git update-index --cacheinfo`\), wrapping this operation in a retry loop with \*\*jittered\*\* exponential backoff \(hard-capped at 5 retries and a 500ms maximum delay\) specifically targeting `fatal: Unable to create '\.\.\/\.git\/index\.lock': File exists` errors to ensure stability against IDE background watchers\. /g,
  ``
);

// 2. Premature Abstraction: worker_threads
content = content.replace(
  /MUST be offloaded to Node\.js `worker_threads`\. The worker will utilize/g,
  `MUST execute directly within the async control flow (yielding to the event loop using standard \`setImmediate\` or async iteration rather than heavy \`worker_threads\`). The scanner will utilize`
);

// 3. PayloadLogger -> PayloadDumper
content = content.replace(/PayloadLogger/g, 'PayloadDumper');

// --- SECURITY FIXES ---

// 1. Arbitrary TTL Manipulation
content = content.replace(
  /allowing O\(1\) filtering sweeps without `fs\.stat\(\)` blocks/g,
  `enforcing strict regex validation on the filename structure and validating that the \`ExpiryTimestamp\` is mathematically bounded (e.g., maximum 24 hours from current time) before trusting the timestamp to prevent garbage collection bypasses or premature deletions`
);

// 2. TOCTOU in recursive deletion
content = content.replace(
  /Node's `fs\.promises\.rm` \(strictly preceded by an `fs\.lstat` check to prevent following symlinks outside the sandbox\)/g,
  `Node's \`fs.promises.rm\` API (which natively and safely unlinks symlinks without following them, removing the need for a custom TOCTOU-vulnerable \`lstat\` check)`
);

// 3. RAM Disk Permission Escalation
content = content.replace(
  /securely provision an ephemeral in-memory `\.npmrc` via a RAM disk \(`tmpfs`, e\.g\., `\/dev\/shm`\) or a secure local HTTP proxy interceptor to provide the token/g,
  `securely provision an ephemeral in-memory \`.npmrc\` via a RAM disk (\`tmpfs\`, e.g., \`/dev/shm\`). The CLI MUST create a highly restricted directory via \`fs.mkdtemp\` with strict \`0700\` permissions within the RAM disk BEFORE writing the \`.npmrc\` file (with \`0600\` permissions) to prevent local information disclosure`
);

// 4. Incomplete Log Redaction
content = content.replace(
  /using exact string matching of injected tokens/g,
  `using the same comprehensive entropy and regex-based secret scanning logic employed in the core staging pipeline (not just brittle exact string matching)`
);

// 5. ReDoS Mitigation Gaps
content = content.replace(
  /safely bounded JS regex \(enforcing a strict 500-character line length limit before Regex evaluation\)/g,
  `safely bounded JS regex (enforcing a strict 500-character line length limit, prohibiting nested quantifiers like \`(a+)+\`, and wrapping execution in a hard timeout to prevent ReDoS)`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 57 complete.');
