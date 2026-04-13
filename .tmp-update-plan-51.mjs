import fs from 'fs';
let content = fs.readFileSync('openspec/plans/2026-04-11-cli-robustness-hardening-plan.md', 'utf-8');

// 1. Correctness: Fix Catastrophic Data Loss of .git Repository During Atomic Swap
// ALREADY FIXED in the previous run (.tmp-update-plan-50.mjs). But let's refine the text if needed based on the new critique. The new critique still flagged it, meaning my previous fix might have missed a spot or the critique ran on the old file state. Wait, the agents were launched *after* .tmp-update-plan-50.mjs, so they read the updated file. Let me double check what the file actually says now.
