import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// Fix remaining occurrences of "swapStagedWorkspace"
content = content.replace(/swapStagedWorkspace/g, 'commitStagingTransaction');

// Clean up some redundant phrasing around package-lock.json and npm ci
content = content.replace(
  /This allows bounded `npm install` execution when `package\.json` changes are detected without corresponding lockfile changes, enabling the package manager to safely regenerate the lockfile before the atomic swap\./,
  `This ensures the package manager safely regenerates the lockfile natively before the atomic swap.`
);

fs.writeFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', content);
console.log('Update 56 complete.');
