import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Fix Authentication Breakage (RAM disk contradiction)
content = content.replace(/--userconfig=\$\{platformNullDevice\}/g, '--userconfig=${ephemeralRamDiskNpmrcPath}');

// 2. Unresolved Split-Brain (Remove remnant git hash-object --stdin-paths)
content = content.replace(/To completely eliminate TOCTOU race conditions where files are modified between the hash validation and the Apply read, the CLI will ingest the files directly into the Git object database \*during\* the hash phase using `git hash-object -w --stdin-paths` \(which returns the blob ID\)\. In the `--apply` phase, the CLI will update the Git index directly using that exact blob ID \(`git update-index --cacheinfo`\), wrapping this operation in a retry loop with \*\*jittered\*\* exponential backoff \(hard-capped at 5 retries and a 500ms maximum delay\) specifically targeting `fatal: Unable to create '\.\.\/\.git\/index\.lock': File exists` errors to ensure stability against IDE background watchers\. /g, '');
content = content.replace(/The CLI will stream all paths directly into `stdin` while strictly respecting stream backpressure \(using `stream\.pipeline`\)\./g, '');
// Ensure no other references to git hash-object remain
content = content.replace(/prevent Git filename injection when piping to `git hash-object -w --stdin` loops/g, 'prevent stream injection into `git update-index --index-info` loops');
content = content.replace(/git hash-object/g, 'native Node.js filesystem hashing'); // Catch-all for any stragglers if needed, but let's be careful. Let's just do targeted replacements.

// 3. Atomic Swap ENOTEMPTY (Section 3.4 contradiction)
content = content.replace(/execute a single `fs\.renameSync` of the entire `\.tmp\/\[UUID\]` staging directory over the live workspace/g, 'execute a sequence of `fs.renameSync` calls moving individual mutated files and directories from the `.tmp/[UUID]` staging directory over the live workspace');

// 4. Secret Scanner Indexing Error (ENOENT on deleted files)
content = content.replace(/reading the physical files from the `\.tmp\/\[UUID\]` staging directory/g, 'reading the physical files from the `.tmp/[UUID]` staging directory (explicitly catching and swallowing `ENOENT` exceptions for files staged for deletion)');

// 5. Secret Scanner Truncation Blind Spots
content = content.replace(/strict 500-character line length limit/g, 'sliding window chunking mechanism with overlap (e.g., 500 chars with 50-char overlap)');

// 6. DoS via Malicious Expiry Timestamps
content = content.replace(/validating that the `ExpiryTimestamp` is mathematically bounded \(e\.g\., maximum 24 hours from current time\) before trusting the timestamp to prevent garbage collection bypasses or premature deletions/g, 'validating that the `ExpiryTimestamp` is mathematically bounded (e.g., maximum 24 hours from current time). Anomalous, unparseable, or maliciously future-dated timestamps MUST NOT be ignored; the directories MUST be forcefully deleted to prevent DoS via disk exhaustion');

// 7. Git Status Parsing Logic Swallowing Files
content = content.replace(/correctly advancing the iterator when a rename\/copy status \(e\.g\., `R`, `C`, `RM`\) indicates an `old_path` is present/g, 'explicitly verifying the exact status code prefix (e.g., `R `, `C `, `RM`) before advancing the iterator to skip the `old_path`, preventing valid files from being swallowed');

// 8. Unnecessary Indirection / Conceptual Coupling (Task 4.4 git worktree remove on .tmp)
content = content.replace(/It will use `spawn\('git', \['worktree', 'remove', '--force', '--', path\]\)`.*?falling back to forceful physical deletion via Node's `fs\.promises\.rm` \(which natively and safely unlinks symlinks without following them, removing the need for a custom TOCTOU-vulnerable `lstat` check\) and executing `git worktree prune` only if OS locks persist\./g, 'It will use Node\'s native `fs.promises.rm(path, { recursive: true, force: true })` (which safely unlinks symlinks without following them) to clean up raw `.tmp/` staging directories, while using `spawn(\'git\', [\'worktree\', \'remove\', \'--force\', \'--\', path])` strictly for legacy Git worktree teardowns.');

// 9. Naming Obfuscation
content = content.replace(/PayloadDumper/g, 'StructuredOutputManager');
content = content.replace(/commitStagingTransaction/g, 'swapStagingToLive');

// 10. Stream Injection Misattribution
content = content.replace(/prevent Git filename injection when piping to native Node\.js filesystem hashing -w --stdin loops/g, 'prevent stream injection into `git update-index --index-info` loops');
content = content.replace(/prevent Git filename injection when piping to `git hash-object -w --stdin` loops/g, 'prevent stream injection into `git update-index --index-info` loops');

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 59 complete.');
