import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

content = content.replace(
  /- \[ \] \*\*Task 4\.7\*\*: Ensure `\.npmrc` credentials are never written to disk or injected into `process\.env`\.[\s\S]*?(?=\n\n## 5\. API Contracts & Breaking Changes)/,
  `- [ ] **Task 4.7**: Ensure NPM registry credentials are never written to disk or injected into the global \`process.env\`. Inject the \`NPM_CONFIG__AUTH\` token strictly into the \`child_process.spawn\` options \`env\` object for the \`npm ci\` child process. Scope the token strictly to the target registry (e.g., \`//registry.npmjs.org/:_authToken=token\`) to prevent transmission to arbitrary registries. Append \`--logs-max=0\` to ensure crash dumps do not write environment variables to disk, and enforce \`--ignore-scripts\` and \`--globalconfig=/dev/null\` to prevent local registry hijacking and child-process exfiltration.`
);

content = content.replace(
  /- \*\*NPM Authentication\*\*: Environment variables \(`NPM_CONFIG__AUTH`\) are strictly ignored\. If `NPM_CONFIG__AUTH` is present, the CLI will enter a deprecation phase: it will securely translate it to an ephemeral `--userconfig` \(stored in the workspace `\.tmp\/` staging directory as described above\) internally without mutating the user environment, and proceed\. A `stderr` warning is explicitly emitted to visibility in logs\. Hard failures will be introduced in the next major version\./,
  `- **NPM Authentication**: Global environment variables (\`NPM_CONFIG__AUTH\`) are strictly ignored. If \`NPM_CONFIG__AUTH\` is present in the global \`process.env\`, the CLI will enter a deprecation phase: it will extract the token and pass it securely via the \`spawn\` options \`env\` object to the isolated \`npm ci\` process, bypassing the disk. A \`stderr\` warning is explicitly emitted. Hard failures will be introduced in the next major version, requiring users to pass tokens via explicit CLI arguments or secure IPC.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
