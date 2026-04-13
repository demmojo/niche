import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// Clean up some phrasing in 3.6 about crypto.createHash
content = content.replace(
  /To prevent destroying uncommitted manual edits made during the TOCTOU window, the CLI will compare the working tree file hash \(using native Node\.js `crypto\.createHash\('sha256'\)` streams, completely eliminating `git hash-object` pipeline deadlocks\) against the index hash\. The CLI will stream all paths directly into `stdin` while strictly respecting stream backpressure/,
  `To prevent destroying uncommitted manual edits made during the TOCTOU window, the CLI will stream all paths directly into \`stdin\` while strictly respecting stream backpressure`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
