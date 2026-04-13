# 🔍 COMPREHENSIVE TECHNICAL AUDIT REPORT (V2)

**Date:** April 11, 2026
**Target:** `openspec/plans/2026-04-11-ai-native-frontend-workflow-docs.md`
**Auditors:** Correctness Reviewer, Maintainability Reviewer, Security Sentinel

## Executive Summary

The recent patches successfully resolved the O(n²) array mutation issue, traceId continuity, and multiple API contract contradictions. However, the subagents have discovered severe, high-priority vulnerabilities introduced or left unaddressed by the previous fixes, including Mutation XSS (mXSS) via Web Workers, Mass Assignment via `/v1/` `passthrough`, and a massive Financial DoS backdoor.

The overall risk posture remains **CRITICAL** pending the resolution of these findings.

---

## 🔴 CRITICAL FINDINGS (Action Required)

### 1. Security: Web Worker DOMPurify Offloading (Mutation XSS)

- **Vulnerability:** The plan mandates offloading heavy HTML sanitization (DOMPurify) to a Web Worker. Because Web Workers lack DOM access, developers must use polyfills like `jsdom`. These polyfills parse HTML differently than real browsers. An attacker can craft a payload deemed safe by the polyfill, which the main thread browser then mutates into an executable XSS payload upon insertion via `innerHTML`.
- **Remediation:** **Never run DOMPurify in a Web Worker.** To prevent main-thread freezing, you must perform incremental/chunked sanitization on the main thread (only sanitizing the active delta).

### 2. Security: `/v1/` Schema Mutation / Mass Assignment (NoSQLi)

- **Vulnerability:** The plan states that `/v1/` routes must preserve permissive `.passthrough()` behavior. However, shadow validation only logs deviations; it does not drop them. Arbitrary injected keys (e.g., `"isAdmin": true`) remain in the AST and can be passed directly to Firestore `set({ merge: true })`, achieving Mass Assignment.
- **Remediation:** You cannot preserve permissive inputs at the gateway while claiming "Never allow unvalidated object trees to reach the database". You MUST implement a strict field-whitelist at the Database/Repository layer before writing.

### 3. Security: `/v1/` Rate Limit Inheritance Exemption (Financial DoS)

- **Vulnerability:** The plan explicitly forbids applying HTTP 429 limits to `/v1/`. Attackers can completely bypass the Redis Lua Token Buckets by downgrading API requests to `/v1/`, launching volumetric Layer 7 DoS attacks and draining LLM API credits.
- **Remediation:** Rate limits MUST be applied to `/v1/`. To avoid breaking contracts, apply a highly generous "legacy ceiling" limit to `/v1/` (e.g., 10x normal capacity), but an absolute upper bound _must_ exist.

### 4. Correctness: Unconditional Throttled Re-rendering Loop

- **Vulnerability:** The document states to periodically clone the array (`[...bufferRef.current]`) and flush it to React state. If this decoupled loop runs unconditionally (e.g., every 16ms), it creates a new array reference every tick, forcing continuous React re-renders even when the network is idle.
- **Remediation:** The throttle loop MUST compare the current length of `bufferRef.current` against the previously flushed length, and only clone/flush if new chunks have actually been added.

### 5. Correctness: Missing Final Buffer Flush on Stream Close

- **Vulnerability:** Because the network ingestion loop and the React state throttle loop are decoupled, closing the stream (EOF) can leave the final appended chunks stranded in `bufferRef` if the stream finishes between throttle ticks.
- **Remediation:** The `onclose` handler MUST explicitly perform one final flush of `[...bufferRef.current]` to React state to guarantee final chunks are rendered.

### 6. Correctness: Orphaned Throttle Loop (CPU Leak)

- **Vulnerability:** The specification mandates clearing the throttle timer 'upon unmount' but fails to require clearing it upon stream completion. The interval will run indefinitely after generation finishes.
- **Remediation:** Explicitly mandate that the decoupled throttle timer MUST be cancelled in the stream's `onclose`, `ondone`, or `catch` blocks.

### 7. Correctness: Single-Use `jti` Replay Race Condition

- **Vulnerability:** Burning the resumption `jti` in Redis immediately upon connection creates a lockout. If a client connects (burning `jti`) but the network drops before receiving a new `Cursor`, the client will try to reconnect using the burned `jti` and be permanently locked out.
- **Remediation:** The server MUST issue a new `Cursor`/`Event-ID` immediately upon successful resume as the very first SSE event.

---

## 🟠 HIGH & MODERATE RISK FINDINGS

### 8. Security: Authz Bypass via Out-of-Band Firebase Revocation

- **Vulnerability:** Relying on documented policy that "all revocations MUST route through a custom backend endpoint" guarantees failure. Native console revocations bypass this, leaving JWTs valid in Redis for 60 minutes.
- **Remediation:** Use a Firebase Auth Background Trigger (`functions.auth.user().onDelete()` and `onUpdate()`) to automatically intercept native console revocations and synchronize them to Redis.

### 9. Security: SSRF Time-of-Check to Time-of-Use (DNS Rebinding)

- **Vulnerability:** If you validate the resolved IP but then pass the _URL hostname_ to `fetch()` on a redirect, you are vulnerable to DNS Rebinding.
- **Remediation:** Implement strict IP Pinning. The HTTP request MUST be dispatched directly to the _exact validated IP address_, passing the original hostname exclusively in the HTTP `Host` header.

### 10. Security: BOLA Downgrade Contradiction

- **Vulnerability:** Making intrinsic tenant isolation optional or delayed on `/v1/` allows attackers to strip `workspaceId` parameters and access cross-tenant data.
- **Remediation:** BOLA fixes cannot be optional. If legacy automated consumers use a single key across multiple workspaces, implement an explicit `/v1/` multi-tenant key mechanism.

### 11. Maintainability: Coupling of Routing Architecture to Generic Fetch Utility

- **Vulnerability:** Forcing the generic frontend fetch utility to parse URL strings (`/v1/` vs `/v2/`) to conditionally change its Promise resolution contract violates the Single Responsibility Principle.
- **Remediation:** Export a configurable client (e.g., `createFetchClient(config)`) and instantiate `v1Client` and `v2Client` separately.

### 12. Maintainability: Inconsistent Hook Naming

- **Vulnerability:** The document references both `useGenerativeStateMachine` and `useGenerativeStream` for the identical hook.
- **Remediation:** Standardize strictly on `useGenerativeStream`.

### 13. Maintainability: Over-engineered In-Memory Token Bucket Fallback

- **Vulnerability:** Dividing global quotas by dynamic container counts (`GLOBAL_LIMIT / MAX_CONTAINERS`) for an extreme edge-case (Redis outage) introduces severe fragility.
- **Remediation:** If Redis is unreachable, fail-closed for anonymous traffic and apply a static, conservative local limit for enterprise traffic. Drop the math abstraction entirely.

---

**[HITL PAUSE]**

The subagents have identified critical security and correctness flaws, notably the mXSS risk of running DOMPurify in a Web Worker, the Mass Assignment/Financial DoS vectors left open in `/v1/`, and several synchronization issues with the decoupled React throttle loop.

Would you like me to resolve these identified issues by applying patches to the OpenSpec plan?
