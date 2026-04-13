import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// Final check on git status -z parsing
content = content.replace(
  /Furthermore, when extracting modified or untracked paths, the CLI will execute `git status --porcelain -z` and parse the UTF-8 output using a `\.split\('\\0'\)` iterator loop\. For rename \(`R`\) and copy \(`C`\) status codes, the iterator MUST explicitly advance its pointer to consume and skip the `old_path` string on the next iteration to prevent treating the source path as a new file modification\. It must also filter out the trailing empty string \(`\.filter\(Boolean\)`\) resulting from the final null byte\./,
  `To prevent Denial of Service (DoS) memory exhaustion, the CLI MUST enforce a hard ceiling on the maximum number of changed/untracked files processed (e.g., \`MAX_FILES = 25,000\`). If the limit is breached, abort with an \`E_TOO_MANY_FILES\` error. Furthermore, when extracting modified or untracked paths, the CLI will execute \`git status --porcelain -z\` and parse the UTF-8 output using a \`.split('\\0')\` iterator loop. For rename (\`R\`) and copy (\`C\`) status codes, the iterator MUST explicitly advance its pointer to consume and skip the \`old_path\` string on the next iteration to prevent treating the source path as a new file modification. It must also filter out the trailing empty string (\`.filter(Boolean)\`) resulting from the final null byte.`
);

content = content.replace(
  /- \[ \] \*\*Task 4\.3\*\*: Refactor `git status` extraction pipelines to strictly enforce `--porcelain -z` with a simple array iterator loop handling `old_path` renames and filtering trailing empty strings, and explicitly rejecting filenames containing newline characters to prevent `git hash-object --stdin-paths` injection\./,
  `- [ ] **Task 4.3**: Refactor \`git status\` extraction pipelines to strictly enforce \`--porcelain -z\` with a simple array iterator loop. The loop MUST correctly handle \`old_path\` renames by explicitly advancing the iterator pointer to skip the next string, and filter trailing empty strings. Implement a hard \`MAX_FILES = 25,000\` ceiling to prevent DoS memory exhaustion.`
);


fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
