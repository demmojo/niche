import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// Final sweep of contradictions around "crash-only" vs "openspec recover"
content = content.replace(
  /relying entirely on the synchronous boot-time sweep to automatically clean up partial states on the next boot/,
  `relying on the synchronous boot-time sweep to automatically clean up partial states on the next boot (with a narrow exception for secure credential unlinking).`
);

content = content.replace(
  /This eliminates the need for an `openspec recover` command, as the system is inherently self-healing and crash-immune\./,
  `The system is inherently self-healing and crash-immune.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
