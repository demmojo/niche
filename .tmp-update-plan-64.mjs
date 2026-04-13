import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// Fix Task 4.1 formatting
content = content.replace(
  /Implement dependency hydration via a bounded `npm ci --prefer-offline --no-audit --ignore-scripts --fund=false`, The CLI MUST strictly forbid recursively copying `node_modules` via `fs\.promises\.cp` to prevent catastrophic disk I\/O bottlenecks\. Instead, it MUST leverage a shared immutable NPM cache \(`npm ci --prefer-offline --cache=\.openspec-npm-cache`\) to ensure fast, safe, native dependency resolution within the staging directory\., and securely using the ephemeral `--userconfig` file\./g,
  `Implement dependency hydration via a bounded \`npm ci --prefer-offline --no-audit --ignore-scripts --fund=false\`. The CLI MUST strictly forbid recursively copying \`node_modules\` via \`fs.promises.cp\` to prevent catastrophic disk I/O bottlenecks. Instead, it MUST leverage a shared immutable NPM cache (\`npm ci --prefer-offline --cache=.openspec-npm-cache\`) to ensure fast, safe, native dependency resolution within the staging directory, securely using the ephemeral \`--userconfig\` file.`
);

// Fix Task 4.3 old_path skipping
content = content.replace(
  /The loop MUST correctly handle `old_path` renames by explicitly advancing the iterator pointer to skip the next string, and filter trailing empty strings\./g,
  `Because \`--name-only\` does not output status codes or \`old_path\` permutations, the parser MUST NOT attempt to skip any strings, preventing valid changed files from being silently dropped.`
);

// Fix Task 4.4 git worktree
content = content.replace(
  /Update `cleanupOldStaged` to use `git worktree remove <path> --force`\. The aasynchronous boot-time sweep will iterate through all `\.tmp\/staging-\*`, `\.tmp\/failed-\*`, and orphaned `\.tmp\/workspace_old_\*` directories and attempt removal in the background\. It will use `spawn\('git', \['worktree', 'remove', '--force', '--', path\]\)`, explicitly utilizing the POSIX End-of-Options delimiter \(`--`\) to prevent argument injection vulnerabilities, falling back to forceful physical deletion via Node's `fs\.promises\.rm` API \(which natively and safely unlinks symlinks without following them, removing the need for a custom TOCTOU-vulnerable `lstat` check\) and executing `git worktree prune` only if OS locks persist\./g,
  `Update \`cleanupOldStaged\`. The asynchronous boot-time sweep will iterate through all \`.tmp/staging-*\`, \`.tmp/failed-*\`, and orphaned \`.tmp/workspace_old_*\` directories and attempt removal in the background. It will use Node's native \`fs.promises.rm(path, { recursive: true, force: true })\` (which safely unlinks symlinks without following them) to clean up raw \`.tmp/\` staging directories, while using \`spawn('git', ['worktree', 'remove', '--force', '--', path])\` strictly for legacy Git worktree teardowns.`
);

// Fix Task 4.7 tmpfs
content = content.replace(
  /Instead, the CLI MUST securely provision it via a RAM disk \(`tmpfs`\)\. When injecting the token via RAM disk/g,
  `Instead, the CLI MUST securely provision it using \`os.tmpdir()\` with a highly restricted directory (\`fs.mkdtemp\` with \`0700\` permissions). When injecting the token via this secure temp file`
);
content = content.replace(
  /via a RAM disk \(`tmpfs`\)/g,
  `via \`os.tmpdir()\``
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 64 complete.');
