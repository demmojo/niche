import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 7. Command Argument Injection Edge Case
content = content.replace(
  /It will use `git worktree remove --force <path>`, falling back to forceful physical deletion/,
  `It will use \`spawn('git', ['worktree', 'remove', '--force', '--', path])\`, explicitly utilizing the POSIX End-of-Options delimiter (\`--\`) to prevent argument injection vulnerabilities, falling back to forceful physical deletion`
);

// 8. JSON Output Pipeline Shell Injection
content = content.replace(
  /The CLI MUST append a cryptographically secure UUIDv4 to the generated payload dump filename to prevent `EEXIST` crashes\./,
  `The CLI MUST append a cryptographically secure UUIDv4 to the generated payload dump filename to prevent \`EEXIST\` crashes. Before generating the final path, it MUST explicitly sanitize and validate that the generated path components contain only safe alphanumeric characters and hyphens to prevent downstream Bash shell injection vulnerabilities (e.g., if a user scripts \`eval \$(jq -r .payloadDumpPath)\`).`
);

// Clean up Task 4.2 text regarding node_modules bypassing
content = content.replace(
  /It MUST NOT exclude files based on `\.gitignore` rules if they are actively staged for commit, preventing bypasses where a secret is added with `git add -f` and then gitignored\. It must explicitly hardcode `\.git\/` and `node_modules\/` into a global exclusion matrix to prevent V8 OOM crashes\./,
  `It MUST NOT exclude files based on \`.gitignore\` rules if they are actively staged for commit, preventing bypasses where a secret is added with \`git add -f\` and then gitignored. Exclusions (such as ignoring \`.git/\` or \`node_modules/\`) MUST strictly rely on absolute path boundaries or exact root-level segment matching to prevent bypasses via maliciously nested directories (e.g., \`src/node_modules/secret.js\`).`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 53 complete.');
