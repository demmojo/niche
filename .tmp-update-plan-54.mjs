import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// There is one final issue: Task 4.7 and Section 3.8 still talk about writing .npmrc to disk because my previous replace for that specific sentence missed.
content = content.replace(
  /Because environment variables injected into `spawn` leak via `\/proc\/<pid>\/environ`, the CLI MUST create an ephemeral `\.npmrc` file with strict `0600` permissions exclusively inside the highly scoped, workspace-local `\.tmp\/\[UUID\]` staging directory\./,
  `Because environment variables injected into \`spawn\` leak via \`/proc/<pid>/environ\`, the CLI MUST NOT write an ephemeral \`.npmrc\` file to disk. Instead, the CLI MUST securely inject the token into the \`npm ci\` child process via \`stdin\` or a secure IPC channel.`
);

// Task 4.7
content = content.replace(
  /the CLI MUST create an ephemeral `\.npmrc` file inside the isolated `\.tmp\/\[UUID\]` staging directory with strict `0600` permissions containing the auth token\. This file MUST be explicitly deleted immediately after the `npm ci` child process exits\./,
  `the CLI MUST securely inject the token into the \`npm ci\` child process via \`stdin\` or a secure IPC channel, bypassing disk writes.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 54 complete.');
