const fs = require('fs');
const path = 'openspec/plans/2026-04-11-ai-native-frontend-workflow-docs.md';
let content = fs.readFileSync(path, 'utf8');

// 1. Redis CROSSSLOT Error
content = content.replace(
  /To support Redis Clustering, the keys for both operations MUST use identical Redis Hash Tags \(e\.g\., `\{workspaceId\}:revocation` and `\{workspaceId\}:token_bucket` for enterprise, or `\{uid\}` for anonymous\) to guarantee they route to the same physical hash slot and avoid CROSSSLOT errors\./g,
  "To support Redis Clustering and avoid CROSSSLOT errors when interacting with disparate domains (e.g., `{uid}` for revocation vs `{workspaceId}` for rate limiting), do NOT combine them into a single Lua script. Execute Revocation and Token Bucket decrement sequentially in a Redis pipeline, or use a standalone Lua script exclusively for `{uid}`."
);

// 2. Mid-Stream Error 'Success' Overwrite & 3. Partial Data Loss in Catch
content = content.replace(
  /The stream's `onclose` or `ondone` handler MUST explicitly perform one final flush of `\[\.\.\.bufferRef\.current\]` to React state to guarantee final chunks are rendered\. Furthermore, the `onclose`, `ondone`, and `catch` blocks MUST explicitly cancel the decoupled throttle timer to prevent CPU leaks \(orphaned timers\) during abrupt network exceptions\./g,
  "The stream's `onclose`, `ondone`, and `catch` handlers MUST explicitly perform one final synchronous flush of `[...bufferRef.current]` to React state to guarantee final chunks are rendered and no data is lost on abrupt disconnects. Furthermore, the `onclose` and `ondone` handlers MUST check the current state machine status; if the state is already `Error` (e.g. from a mid-stream failure), they MUST bypass the final `Success` transition to prevent overwriting the failure state."
);

// 4. Fail-Open Authorization Bypass in Redis Fallback Logic
content = content.replace(
  /If Redis is unreachable, fail-closed for anonymous traffic and apply a static, conservative local limit for enterprise traffic\./g,
  "Explicitly mandate a Fail-Closed policy for Authentication/Revocation. If Redis is unreachable, the system MUST reject requests bearing JWTs that rely on Redis for revocation checks. Rate limiting can fallback to a static, conservative local limit for enterprise traffic, but security MUST NOT fail-open."
);

// 5. Resumption Sliding Window Amplification
content = content.replace(
  /Maintain a sliding window of valid byte-offsets for the given `jti` in Redis, allowing rapid idempotent retries within the 5-minute TTL without triggering a lockout\./g,
  "Resumption offsets MUST be strictly monotonically increasing. The backend must reject any resumption request for an offset older than the most recently seen cursor for that `jti` to prevent Layer 7 amplification attacks while allowing legitimate forward-progress retries."
);

// 6. TLS SNI Mismatch in SSRF IP-Pinning
content = content.replace(
  /Implement strict IP Pinning: the redirected HTTP request MUST be dispatched directly to the exact validated IP address, passing the original hostname exclusively in the HTTP `Host` header to prevent DNS Rebinding\./g,
  "Implement strict IP Pinning: the redirected HTTP request MUST be dispatched directly to the exact validated IP address, passing the original hostname exclusively in the HTTP `Host` header to prevent DNS Rebinding. You MUST explicitly override the TLS `servername` property with the original hostname to ensure the SNI handshake succeeds when connecting directly to an IP."
);

// 7. BOLA Patch Contradiction for /v1/
content = content.replace(
  /To resolve legacy multi-tenant keys without breaking contracts, implement a strict "Shadow Isolation" mode on `\/v1\/` that logs cross-tenant access for a defined audit period without blocking, followed by a hard cutoff date for explicit scoped token enforcement\. BOLA mitigations cannot be indefinitely delayed\./g,
  "Immediately issue explicitly scoped multi-tenant keys for identified legacy machine-to-machine consumers, and hard-enforce single-tenant intrinsic isolation for all other `/v1/` requests with zero exceptions. BOLA mitigations cannot be delayed."
);

// 8. Secondary Polling Loop for State Accumulation
content = content.replace(
  /A separate decoupled throttle loop \(e\.g\., `requestAnimationFrame` or interval\) should compare the current length of `bufferRef\.current` against the previously flushed length, and only clone the array \(`\[\.\.\.bufferRef\.current\]`\) and flush it to React state if new chunks have actually been added\./g,
  "Throttling MUST be handled inline within the network read loop (e.g., using a time-based throttle directly inside the `while` loop) to periodically clone the array (`[...bufferRef.current]`) and flush it to React state. Do not invent a disconnected secondary polling architecture."
);

// 9. Jargon-Heavy Architecture Names
content = content.replace(/The Anti-Slop MLP Stack/g, "Modern Frontend Stack");
content = content.replace(/Anti-Slop MLP Stack/g, "Modern Frontend Stack");
content = content.replace(/The Colocated One-Way Trip/g, "Local IDE Editing");
content = content.replace(/Bifurcated Entrypoint Architecture/g, "Isolated E2E Entrypoint");
content = content.replace(/Two-Stage Fetch Architecture/g, "Progressive Fetch Pattern");
content = content.replace(/Deterministic Fetch Phase/g, "Initial Fetch Phase");
content = content.replace(/Generative Stream Phase/g, "Streaming Phase");

// 10. createFetchClient Factory Premature Abstraction
content = content.replace(
  /export a configurable client \(e\.g\., `createFetchClient\(config\)`\) and instantiate `v1Client` \(legacy behavior preserving `res\.ok`\) and `v2Client` separately\./g,
  "export two distinct, explicit fetch utility functions (e.g., `fetchV1` and `fetchV2`) instead of a generic factory. `fetchV1` preserves legacy `res.ok` behavior."
);

fs.writeFileSync(path, content, 'utf8');
