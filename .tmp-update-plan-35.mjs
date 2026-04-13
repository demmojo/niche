import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');
content = content.replace(
  /immediately after the Zod parsing boundary \(before any core business logic evaluates it\) to prevent Prototype Pollution or argument injection vulnerabilities, \(e\.g\., `child_process\.spawn`\) to prevent argument injection vulnerabilities, explicitly avoiding custom coercion layers/,
  `immediately after the Zod parsing boundary (before any core business logic evaluates it) to prevent Prototype Pollution or argument injection vulnerabilities (e.g., into \`child_process.spawn\`), explicitly avoiding custom coercion layers`
);

// One more check for node_modules in task 4.1
content = content.replace(
  /- \[ \] \*\*Task 4\.1\*\*: Refactor `stage\.ts` to completely eradicate `node_modules` symlinking\/hard-linking\. Implement dependency hydration via a bounded `npm ci --prefer-offline --no-audit --ignore-scripts --fund=false`, injecting `NPM_CONFIG__AUTH` securely via `spawn` env options rather than writing physical `\.npmrc` files\./,
  `- [ ] **Task 4.1**: Refactor \`stage.ts\` to completely eradicate \`node_modules\` symlinking/hard-linking. Implement dependency hydration via a bounded \`npm ci --prefer-offline --no-audit --ignore-scripts --fund=false\`, or copying existing \`node_modules\` first to avoid performance collapse, and securely using the ephemeral \`--userconfig\` file.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
