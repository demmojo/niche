const fs = require('fs');

const path = 'openspec/changes/nicheai-mlp-plg-refactor/tasks.md';
let tasks = fs.readFileSync(path, 'utf8');

const phase0 = `## Phase 0: Immediate Drift Remediation (Pre-Requisites)

Before implementing the broader features, we MUST fix the critical security and structural drift present in the current codebase:
- [ ] **Fix IDOR & Auth Bypass**: In \`roastRoutes.ts\`, remove \`req.body.owner_uid\` and instead strictly use \`req.user.uid\` from Auth middleware. Apply \`zod\` validation to \`req.body.idea\`.
- [ ] **Fix Floating Promise**: In \`roastRoutes.ts\`, structurally \`await tasksClient.createTask()\` before sending the \`202 Accepted\` response to prevent silent task drops.
- [ ] **Fix Firestore Contention**: Delete \`rateLimitCounters.ts\` entirely and remove its usages. Replace with a Redis pipeline for rate limiting in \`roastRoutes.ts\`.
- [ ] **Fix Lease Collisions**: In \`workerRoutes.ts\`, return \`429\` or \`503\` instead of \`200 OK\` when a lease is actively locked.
- [ ] **Fix Lease Deadlocks**: In \`workerRoutes.ts\`, explicitly clear the \`leased_until\` timestamp in the \`catch (error)\` block so retries are not blocked.
- [ ] **Fix Blocking I/O**: In \`workerRoutes.ts\`, push \`jobRef.update\` promises into an array during the stream loop and \`await Promise.allSettled()\` at the end instead of awaiting inside the loop.
- [ ] **Fix Redis Race Condition**: In \`workerRoutes.ts\`, remove the inline \`redisClient.connect()\` middleware. Hoist the connection logic to a singleton promise or app startup.
- [ ] **Fix Hardcoded Execution**: In \`workerRoutes.ts\`, extract the \`idea\` from the Firestore document data instead of using the hardcoded \`"Roast this idea"\` prompt.

`;

tasks = tasks.replace('## Phase 1:', phase0 + '## Phase 1:');

fs.writeFileSync(path, tasks);
